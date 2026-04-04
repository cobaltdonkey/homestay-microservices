"""
routes.py — Deposit Resolution Orchestrator
============================================
Pure composite orchestrator with NO database ownership.
Coordinates deposit resolution across domain services via
synchronous HTTP REST and asynchronous RabbitMQ (AMQP).

Three paths:
  GOOD            — Host reports everything is fine  → release deposit
  BAD             — Host reports damage              → capture deposit
  NO_RESPONSE     — Host failed to inspect in 48hrs  → auto-release deposit
"""
import threading
from flask import Blueprint, request, jsonify
from helpers import (
    call_service,
    call_outsystems,
    publish_event,
    STAY_SERVICE_URL,
    INSPECTION_SERVICE_URL,
    PAYMENT_GATEWAY_URL,
    USERS_SERVICE_URL,
)

bp = Blueprint('main', __name__)

# ─────────────────────────────────────────────────────────────
# Constants (inlined — this service does NOT mount shared/)
# ─────────────────────────────────────────────────────────────
CONDITION_GOOD = "GOOD"
CONDITION_BAD = "BAD"
CONDITION_NO_RESPONSE = "NO_RESPONSE_FROM_HOST"

REASON_HOST_REPORT = "HOST_REPORT"
REASON_DAMAGE = "DAMAGE"
REASON_NO_RESPONSE = "NO_RESPONSE_AUTO_RELEASE"

STATUS_RELEASED = "RELEASED"
STATUS_CAPTURED = "CAPTURED"

TXN_TYPE_DEPOSIT_RELEASE = "DEPOSIT_RELEASE"
TXN_TYPE_DEPOSIT_CAPTURE = "DEPOSIT_CAPTURE"

EVENT_DEPOSIT_RESOLVED = "deposit.resolved"


# ═════════════════════════════════════════════════════════════
# Health Check
# ═════════════════════════════════════════════════════════════
@bp.route('/health', methods=['GET'])
@bp.route('/deposit-resolutions/health', methods=['GET'])
def health():
    return jsonify({
        "code": 200,
        "data": {"status": "ok", "service": "deposit-resolution"},
        "message": "success"
    }), 200



# ─────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────
def uuid_to_int32(uuid_str: str) -> int:
    """
    Convert a UUID string to a deterministic positive int32 value.
    OutSystems InspectionAPI requires StayId as integer (int32).
    We derive a stable integer from the UUID hex so the same stay
    always maps to the same integer without an external lookup table.
    """
    try:
        hex_str = uuid_str.replace('-', '')
        full_int = int(hex_str, 16)
        return full_int % (2 ** 31 - 1)   # keep within signed int32 range
    except (ValueError, AttributeError):
        return 0


# ═════════════════════════════════════════════════════════════
# POST /deposit-resolutions — Good / Bad Path
# ═════════════════════════════════════════════════════════════
@bp.route('/deposit-resolutions', methods=['POST'])
def resolve_deposit():
    """
    Host submits inspection result.
    Body: {stay_id, host_id, condition_result: GOOD | BAD, notes}
    """
    body = request.get_json() or {}
    stay_id = body.get('stay_id') or body.get('stayId')
    host_id = body.get('host_id') or body.get('hostId')
    condition_result = body.get('condition_result') or body.get('conditionResult')
    notes = body.get('notes', '')

    if not all([stay_id, host_id, condition_result]):
        return jsonify({
            "code": 400, "data": None,
            "message": "Missing required fields: stay_id, host_id, condition_result"
        }), 400

    if condition_result not in (CONDITION_GOOD, CONDITION_BAD):
        return jsonify({
            "code": 400, "data": None,
            "message": f"Invalid condition_result: {condition_result}. Must be GOOD or BAD."
        }), 400

    # ── Step 2: Retrieve Stay Details ────────────────────────
    print(f"[STEP 2] Fetching stay {stay_id} from Stay Service ...", flush=True)
    stay_status, stay_data = call_service("get", f"{STAY_SERVICE_URL}/stays/{stay_id}")
    if stay_status != 200 or stay_data.get("data") is None:
        return jsonify({
            "code": 404, "data": None,
            "message": f"Stay {stay_id} not found (status={stay_status})"
        }), 404

    stay = stay_data["data"]
    guest_id = stay["guestId"]
    host_id_from_stay = stay["hostId"]
    booking_id = stay["bookingId"]
    deposit_txn_id = stay["depositTxnId"]
    deposit_amount = float(stay["depositAmount"])
    checkout_time = stay.get("checkoutTime")

    # ── Step 3: Record Inspection (OutSystems) ──────────────
    # Endpoint: POST /inspection (lowercase) with PascalCase fields
    # StayId must be int32 per OutSystems schema; derive from UUID deterministically
    outsystems_endpoint = INSPECTION_SERVICE_URL.rstrip('/') + '/inspection'
    print(f"[STEP 3] Recording inspection at {outsystems_endpoint} for stay {stay_id} ...", flush=True)
    insp_payload = {
        "StayId": uuid_to_int32(stay_id),
        "HostId": host_id,
        "Condition": condition_result,
        "Notes": notes or "",
    }
    insp_status, insp_data = call_outsystems(outsystems_endpoint, insp_payload)

    if insp_status == 409:
        return jsonify({
            "code": 409, "data": None,
            "message": "Inspection already submitted for this stay"
        }), 409

    if insp_status not in (200, 201):
        # RESILIENCE: Abort before payment if inspection fails
        print(f"[STEP 3 ABORT] Inspection service returned {insp_status}: {insp_data}", flush=True)
        return jsonify({
            "code": 503, "data": None,
            "message": f"Inspection service error (status={insp_status}). Aborting before payment."
        }), 503

    # OutSystems wraps the result in { Success: bool, Data: {...}, Error: {...} }
    if not insp_data.get("Success", True):  # default True for non-OutSystems responses
        err = insp_data.get("Error", {})
        print(f"[STEP 3 ABORT] OutSystems reported failure: {err}", flush=True)
        return jsonify({
            "code": 503, "data": None,
            "message": f"Inspection service reported failure: {err.get('Message', 'Unknown error')}"
        }), 503

    result_data = insp_data.get("Data") or insp_data
    inspection_id = (
        result_data.get("InspectionId")
        or result_data.get("inspection_id")
        or result_data.get("inspectionId", "unknown")
    )
    print(f"[STEP 3] Inspection recorded: {inspection_id}", flush=True)

    # ── Step 4: Business Logic Decision ─────────────────────
    if condition_result == CONDITION_GOOD:
        reason = REASON_HOST_REPORT
        payment_status = STATUS_RELEASED
        txn_type = TXN_TYPE_DEPOSIT_RELEASE
        idempotency_key = f"dep-release-{stay_id}"
    else:  # BAD
        reason = REASON_DAMAGE
        payment_status = STATUS_CAPTURED
        txn_type = TXN_TYPE_DEPOSIT_CAPTURE
        idempotency_key = f"dep-capture-{stay_id}"

    print(f"[STEP 4] Decision: condition={condition_result} → reason={reason}, status={payment_status}", flush=True)

    # ── Step 5: Payment Action ──────────────────────────────
    if condition_result == CONDITION_GOOD:
        gw_endpoint = f"{PAYMENT_GATEWAY_URL}/gateway/deposits/release"
    else:
        gw_endpoint = f"{PAYMENT_GATEWAY_URL}/gateway/deposits/capture"

    print(f"[STEP 5] Calling {gw_endpoint} for depositTxnId={deposit_txn_id} ...", flush=True)
    gw_status, gw_data = call_service("post", gw_endpoint, {
        "depositTxnId": deposit_txn_id,
        "reason": reason,
        "idempotencyKey": idempotency_key,
    }, retries=1)

    if gw_status != 200:
        print(f"[STEP 5 ERROR] Payment gateway returned {gw_status}: {gw_data}", flush=True)
        return jsonify({
            "code": gw_status, "data": None,
            "message": f"Payment action failed (status={gw_status})"
        }), gw_status

    print(f"[STEP 5] Payment action successful: {gw_data}", flush=True)

    # ── Step 6: Update Stay Deposit Status ──────────────────
    print(f"[STEP 6] Updating stay {stay_id} deposit status to {payment_status} ...", flush=True)
    call_service("patch", f"{STAY_SERVICE_URL}/stays/{stay_id}/deposit-status", {
        "depositStatus": payment_status,
    })

    # ── Step 7: Publish Payment Event to RabbitMQ ──────────
    payment_event_payload = {
        "booking_id": booking_id,
        "payment_txn_id": None,
        "deposit_txn_id": deposit_txn_id,
        "transaction_type": txn_type,
        "amount": deposit_amount,
        "deposit_amount": deposit_amount,
        "status": payment_status,
        "reason": reason,
        "idempotency_key": idempotency_key,
    }
    print(f"[STEP 7] Publishing payment event ({txn_type}) to RabbitMQ ...", flush=True)
    publish_event(EVENT_DEPOSIT_RESOLVED, payment_event_payload, idempotency_key=idempotency_key)

    # ── Step 8: Return to Caller ────────────────────────────
    response_body = {
        "code": 200,
        "data": {
            "inspection_id": inspection_id,
            "depositTxnId": deposit_txn_id,
            "reason": reason,
            "status": payment_status,
        },
        "message": "success",
    }

    # ── Steps 9-10: Async post-response work ────────────────
    # Guest contact retrieval + notification event are non-blocking.
    def _post_response_work():
        try:
            # Step 9 — Retrieve Guest Contact
            print(f"[STEP 9] Fetching guest contact for {guest_id} ...", flush=True)
            _, g_data = call_service("get", f"{USERS_SERVICE_URL}/users/{guest_id}/contact")
            guest_contact = g_data.get("data", {})

            _, h_data = call_service("get", f"{USERS_SERVICE_URL}/users/{host_id_from_stay}/contact")
            host_contact = h_data.get("data", {})

            # Step 10 — Publish Notification Event
            notification_payload = {
                "inspection_id": inspection_id,
                "stay_id": stay_id,
                "guestId": guest_id,
                "hostId": host_id_from_stay,
                "name": guest_contact.get("name", ""),
                "phone": guest_contact.get("phoneNumber", ""),
                "reason": reason,
                "status": payment_status,
                # Fields expected by notification-gateway handler
                "action": "RELEASE" if condition_result == CONDITION_GOOD else "CAPTURE",
                "amount": deposit_amount,
                "stayId": stay_id,
                "guestContact": guest_contact,
                "hostContact": host_contact,
                "depositTxnId": deposit_txn_id,
            }
            print(f"[STEP 10] Publishing notification event ...", flush=True)
            publish_event("deposit.resolved", notification_payload)

        except Exception as e:
            print(f"[ASYNC ERROR] Post-response work failed: {e}", flush=True)

    thread = threading.Thread(target=_post_response_work, daemon=True)
    thread.start()

    print(f"[STEP 8] Returning response to caller.", flush=True)
    return jsonify(response_body), 200


# ═════════════════════════════════════════════════════════════
# POST /deposit-resolutions/<stayId>/auto-release — No-Response Path
# ═════════════════════════════════════════════════════════════
@bp.route('/deposit-resolutions/<stayId>/auto-release', methods=['POST'])
def auto_release_deposit(stayId):
    """
    Triggered by the deposit-expirer when the host fails to submit
    an inspection within 48 hours of checkout.
    Body: {stay_id} or path param.
    """
    stay_id = stayId

    # ── Step 2: Retrieve Stay Details ────────────────────────
    print(f"[AUTO-RELEASE][STEP 2] Fetching stay {stay_id} ...", flush=True)
    stay_status, stay_data = call_service("get", f"{STAY_SERVICE_URL}/stays/{stay_id}")
    if stay_status != 200 or stay_data.get("data") is None:
        return jsonify({
            "code": 404, "data": None,
            "message": f"Stay {stay_id} not found"
        }), 404

    stay = stay_data["data"]
    guest_id = stay["guestId"]
    host_id = stay["hostId"]
    booking_id = stay["bookingId"]
    deposit_txn_id = stay["depositTxnId"]
    deposit_amount = float(stay["depositAmount"])

    # Constants for no-response path
    condition_result = CONDITION_NO_RESPONSE
    reason = REASON_NO_RESPONSE
    payment_status = STATUS_RELEASED
    txn_type = TXN_TYPE_DEPOSIT_RELEASE
    idempotency_key = f"dep-release-{stay_id}"

    # ── Step 3: Record Inspection (OutSystems) ──────────────
    # Endpoint: POST /inspection (lowercase) with PascalCase fields
    # StayId must be int32 per OutSystems schema; derive from UUID deterministically
    outsystems_endpoint = INSPECTION_SERVICE_URL.rstrip('/') + '/inspection'
    print(f"[AUTO-RELEASE][STEP 3] Recording NO_RESPONSE inspection at {outsystems_endpoint} ...", flush=True)
    insp_payload = {
        "StayId": uuid_to_int32(stay_id),
        "HostId": host_id,
        "Condition": CONDITION_NO_RESPONSE,
        "Notes": "",
    }
    insp_status, insp_data = call_outsystems(outsystems_endpoint, insp_payload)

    if insp_status == 409:
        # Inspection already exists — perhaps host submitted late, or already auto-released
        print(f"[AUTO-RELEASE][STEP 3] Inspection already exists, skipping.", flush=True)
        return jsonify({
            "code": 409, "data": None,
            "message": "Inspection already submitted for this stay"
        }), 409

    if insp_status not in (200, 201):
        print(f"[AUTO-RELEASE][STEP 3 ABORT] OutSystems returned {insp_status}: {insp_data}", flush=True)
        return jsonify({
            "code": 503, "data": None,
            "message": f"Inspection service error (status={insp_status}). Aborting."
        }), 503

    # OutSystems wraps the result in { Success: bool, Data: {...}, Error: {...} }
    if not insp_data.get("Success", True):
        err = insp_data.get("Error", {})
        print(f"[AUTO-RELEASE][STEP 3 ABORT] OutSystems reported failure: {err}", flush=True)
        return jsonify({
            "code": 503, "data": None,
            "message": f"Inspection service reported failure: {err.get('Message', 'Unknown error')}"
        }), 503

    result_data = insp_data.get("Data") or insp_data
    inspection_id = (
        result_data.get("InspectionId")
        or result_data.get("inspection_id")
        or result_data.get("inspectionId", "unknown")
    )

    # ── Step 4: Business Logic — always release ─────────────
    print(f"[AUTO-RELEASE][STEP 4] Decision: NO_RESPONSE → release deposit", flush=True)

    # ── Step 5: Release Deposit ─────────────────────────────
    print(f"[AUTO-RELEASE][STEP 5] Releasing deposit {deposit_txn_id} ...", flush=True)
    gw_status, gw_data = call_service("post",
        f"{PAYMENT_GATEWAY_URL}/gateway/deposits/release",
        {
            "depositTxnId": deposit_txn_id,
            "reason": reason,
            "idempotencyKey": idempotency_key,
        },
        retries=1,
    )

    if gw_status != 200:
        print(f"[AUTO-RELEASE][STEP 5 ERROR] Payment gateway returned {gw_status}: {gw_data}", flush=True)
        return jsonify({
            "code": gw_status, "data": None,
            "message": f"Deposit release failed (status={gw_status})"
        }), gw_status

    # ── Step 6: Update Stay Deposit Status ──────────────────
    print(f"[AUTO-RELEASE][STEP 6] Updating stay deposit status to RELEASED ...", flush=True)
    call_service("patch", f"{STAY_SERVICE_URL}/stays/{stay_id}/deposit-status", {
        "depositStatus": STATUS_RELEASED,
    })

    # ── Step 7: Publish Payment Event ───────────────────────
    payment_event_payload = {
        "booking_id": booking_id,
        "payment_txn_id": None,
        "deposit_txn_id": deposit_txn_id,
        "transaction_type": txn_type,
        "amount": deposit_amount,
        "deposit_amount": deposit_amount,
        "status": payment_status,
        "reason": reason,
        "idempotency_key": idempotency_key,
    }
    print(f"[AUTO-RELEASE][STEP 7] Publishing payment event ...", flush=True)
    publish_event(EVENT_DEPOSIT_RESOLVED, payment_event_payload, idempotency_key=idempotency_key)

    # ── Step 8: Return to Caller ────────────────────────────
    response_body = {
        "code": 200,
        "data": {
            "inspection_id": inspection_id,
            "depositTxnId": deposit_txn_id,
            "reason": reason,
            "status": payment_status,
        },
        "message": "success",
    }

    # ── Steps 9-10: Async post-response work ────────────────
    def _post_response_work():
        try:
            # Step 9 — Retrieve Guest Contact
            print(f"[AUTO-RELEASE][STEP 9] Fetching guest contact for {guest_id} ...", flush=True)
            _, g_data = call_service("get", f"{USERS_SERVICE_URL}/users/{guest_id}/contact")
            guest_contact = g_data.get("data", {})

            _, h_data = call_service("get", f"{USERS_SERVICE_URL}/users/{host_id}/contact")
            host_contact = h_data.get("data", {})

            # Step 10 — Publish Notification Event
            notification_payload = {
                "inspection_id": inspection_id,
                "stay_id": stay_id,
                "guestId": guest_id,
                "hostId": host_id,
                "name": guest_contact.get("name", ""),
                "phone": guest_contact.get("phoneNumber", ""),
                "reason": reason,
                "status": payment_status,
                # Fields expected by notification-gateway handler
                "action": "AUTO_RELEASE",
                "amount": deposit_amount,
                "stayId": stay_id,
                "guestContact": guest_contact,
                "hostContact": host_contact,
                "depositTxnId": deposit_txn_id,
            }
            print(f"[AUTO-RELEASE][STEP 10] Publishing notification event ...", flush=True)
            publish_event("deposit.resolved", notification_payload)

        except Exception as e:
            print(f"[ASYNC ERROR] Post-response work failed: {e}", flush=True)

    thread = threading.Thread(target=_post_response_work, daemon=True)
    thread.start()

    print(f"[AUTO-RELEASE][STEP 8] Returning response to caller.", flush=True)
    return jsonify(response_body), 200
