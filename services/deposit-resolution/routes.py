from flask import Blueprint, request, jsonify
import uuid
from models import db, DepositResolution
from helpers import publish_event, call_service
from shared.constants import *

bp = Blueprint('main', __name__)


@bp.route('/health', methods=['GET'])
@bp.route('/deposit-resolutions/health', methods=['GET'])
def health():
    return jsonify({"code": 200,
        "data": {"status": "ok", "service": "deposit-resolution"},
        "message": "success"}), 200


@bp.route('/deposit-resolutions', methods=['POST'])
def resolve_deposit():
    body = request.get_json() or {}
    stayId = body.get('stayId')
    conditionResult = body.get('conditionResult')
    photos = body.get('photos', [])
    notes = body.get('notes', '')
    hostId = body.get('hostId')

    # Step 1 — Fetch stay
    _, stay_data = call_service("get", f"{STAY_SERVICE_URL}/stays/{stayId}")
    if stay_data.get("data") is None:
        return jsonify({"code": 404, "data": None, "message": "Stay not found"}), 404
    stay = stay_data["data"]
    guestId = stay["guestId"]
    hostId = stay["hostId"]
    depositTxnId = stay["depositTxnId"]
    depositAmount = float(stay["depositAmount"])
    bookingId = stay["bookingId"]

    # Step 2 — Submit inspection report
    insp_status, _ = call_service("post",
        f"{INSPECTION_SERVICE_URL}/inspections",
        {"stayId": stayId, "hostId": hostId,
         "conditionResult": conditionResult,
         "photos": photos, "notes": notes})
    if insp_status == 409:
        return jsonify({"code": 409, "data": None, "message": "Inspection already submitted"}), 409
    if insp_status != 201:
        return jsonify({"code": 503, "data": None, "message": "Inspection service error"}), 503

    # Step 3 — Release or capture deposit
    if conditionResult == CONDITION_GOOD:
        gw_status, gw_data = call_service("post",
            f"{PAYMENT_GATEWAY_URL}/gateway/deposits/release",
            {"depositTxnId": depositTxnId,
             "reason": "HOST_REPORT",
             "idempotencyKey": f"dep-release-{stayId}"})
        action = DEPOSIT_ACTION_RELEASE
        txnType = TXN_TYPE_DEPOSIT_RELEASE
        newStatus = DEPOSIT_STATUS_RELEASED
        reason = DEPOSIT_REASON_HOST_REPORT
    else:
        gw_status, gw_data = call_service("post",
            f"{PAYMENT_GATEWAY_URL}/gateway/deposits/capture",
            {"depositTxnId": depositTxnId,
             "reason": "DAMAGE",
             "idempotencyKey": f"dep-capture-{stayId}"})
        action = DEPOSIT_ACTION_CAPTURE
        txnType = TXN_TYPE_DEPOSIT_CAPTURE
        newStatus = DEPOSIT_STATUS_CAPTURED
        reason = DEPOSIT_REASON_DAMAGE

    # Step 4 — Log to payment-logs
    call_service("post",
        f"{PAYMENT_LOGS_SERVICE_URL}/payment-logs",
        {"type": "DEPOSIT", "bookingId": bookingId,
         "depositTxnId": depositTxnId,
         "transactionType": txnType,
         "depositAmount": depositAmount,
         "status": newStatus,
         "reason": reason,
         "idempotencyKey": f"log-dep-{stayId}"})

    # Step 5 — Update stay deposit status
    call_service("patch",
        f"{STAY_SERVICE_URL}/stays/{stayId}/deposit-status",
        {"depositStatus": newStatus})

    # Step 6 — Persist resolution record
    resolution = DepositResolution(
        resolution_id=str(uuid.uuid4()),
        stay_id=stayId,
        guest_id=guestId,
        host_id=hostId,
        deposit_txn_id=depositTxnId,
        amount=depositAmount,
        action=action,
        reason=reason,
        status="RESOLVED"
    )
    db.session.add(resolution)
    db.session.commit()

    # Step 7 — Fetch contacts
    _, g = call_service("get", f"{USERS_SERVICE_URL}/users/{guestId}/contact")
    _, h = call_service("get", f"{USERS_SERVICE_URL}/users/{hostId}/contact")
    guestContact = g.get("data", {})
    hostContact = h.get("data", {})

    # Step 8 — Publish event
    publish_event(EVENT_DEPOSIT_RESOLVED,
        {"stayId": stayId, "guestId": guestId, "hostId": hostId,
         "depositTxnId": depositTxnId, "amount": depositAmount,
         "action": action, "reason": reason,
         "guestContact": guestContact, "hostContact": hostContact})

    # Step 9 — Return
    return jsonify({"code": 200,
        "data": {"stayId": stayId, "action": action, "depositStatus": newStatus},
        "message": "success"}), 200


@bp.route('/deposit-resolutions/<stayId>/auto-release', methods=['POST'])
def auto_release_deposit(stayId):
    # Step 1 — Fetch stay
    _, stay_data = call_service("get", f"{STAY_SERVICE_URL}/stays/{stayId}")
    if stay_data.get("data") is None:
        return jsonify({"code": 404, "data": None, "message": "Stay not found"}), 404
    stay = stay_data["data"]
    guestId = stay["guestId"]
    hostId = stay["hostId"]
    depositTxnId = stay["depositTxnId"]
    depositAmount = float(stay["depositAmount"])
    bookingId = stay["bookingId"]

    action = DEPOSIT_ACTION_AUTO_RELEASE
    txnType = TXN_TYPE_DEPOSIT_RELEASE
    newStatus = DEPOSIT_STATUS_RELEASED
    reason = DEPOSIT_REASON_NO_REPORT

    # Step 3 — Release deposit (no inspection for auto-release)
    call_service("post",
        f"{PAYMENT_GATEWAY_URL}/gateway/deposits/release",
        {"depositTxnId": depositTxnId,
         "reason": "NO_REPORT_48HR",
         "idempotencyKey": f"auto-{stayId}"})

    # Step 4 — Log to payment-logs
    call_service("post",
        f"{PAYMENT_LOGS_SERVICE_URL}/payment-logs",
        {"type": "DEPOSIT", "bookingId": bookingId,
         "depositTxnId": depositTxnId,
         "transactionType": txnType,
         "depositAmount": depositAmount,
         "status": newStatus,
         "reason": reason,
         "idempotencyKey": f"log-dep-{stayId}"})

    # Step 5 — Update stay deposit status
    call_service("patch",
        f"{STAY_SERVICE_URL}/stays/{stayId}/deposit-status",
        {"depositStatus": newStatus})

    # Step 6 — Persist resolution record
    resolution = DepositResolution(
        resolution_id=str(uuid.uuid4()),
        stay_id=stayId,
        guest_id=guestId,
        host_id=hostId,
        deposit_txn_id=depositTxnId,
        amount=depositAmount,
        action=action,
        reason=reason,
        status="RESOLVED"
    )
    db.session.add(resolution)
    db.session.commit()

    # Step 7 — Fetch contacts
    _, g = call_service("get", f"{USERS_SERVICE_URL}/users/{guestId}/contact")
    _, h = call_service("get", f"{USERS_SERVICE_URL}/users/{hostId}/contact")
    guestContact = g.get("data", {})
    hostContact = h.get("data", {})

    # Step 8 — Publish event
    publish_event(EVENT_DEPOSIT_RESOLVED,
        {"stayId": stayId, "guestId": guestId, "hostId": hostId,
         "depositTxnId": depositTxnId, "amount": depositAmount,
         "action": action, "reason": reason,
         "guestContact": guestContact, "hostContact": hostContact})

    return jsonify({"code": 200,
        "data": {"stayId": stayId, "action": "AUTO_RELEASE"},
        "message": "success"}), 200
