from flask import Blueprint, request, jsonify
from helpers import call_service, publish_event
import os

AVAILABILITY_SERVICE_URL = os.environ.get("AVAILABILITY_SERVICE_URL", "http://availability-service:5005")
PAYMENT_GATEWAY_URL = os.environ.get("PAYMENT_GATEWAY_URL", "http://payment-gateway-wrapper:5010")
USERS_SERVICE_URL = os.environ.get("USERS_SERVICE_URL", "http://users-service:5003")
BOOKING_DETAIL_SERVICE_URL = os.environ.get("BOOKING_DETAIL_SERVICE_URL", "http://booking-detail-service:5012")

EVENT_BOOKING_DECLINED = "booking.declined"
EVENT_BOOKING_EXPIRED = "booking.expired"

bp = Blueprint('main', __name__)

@bp.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "service": "reject-booking-service"}), 200

@bp.route('/reject/<bookingId>', methods=['POST', 'OPTIONS'])
def reject_booking(bookingId):
    # Handle CORS preflight explicitly if needed by frontend
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    body = request.get_json() or {}
    status_indication = body.get('status', 'REJECTED') # 'REJECTED' or 'EXPIRED'
    reason_input = body.get('reason')

    # 1. Call GET /bookings/{id} on Booking Detail Service
    b_status, b_data = call_service("get", f"{BOOKING_DETAIL_SERVICE_URL}/bookings/{bookingId}")
    if b_status != 200:
        return jsonify({"error": "Booking not found"}), 404
        
    booking = b_data.get("data", {})
    current_status = booking.get("status")
    
    # 2. Validate current status
    if current_status != "PENDING_HOST":
        print(f"[REJECT-SERVICE] Rejection failed for booking {bookingId}: current status is {current_status}, expected PENDING_HOST", flush=True)
        return jsonify({"error": f"Invalid booking status: {current_status}. Must be PENDING_HOST."}), 400

    # Validate status_indication
    if status_indication not in ['REJECTED', 'EXPIRED']:
        return jsonify({"error": "Invalid status indication. Must be REJECTED or EXPIRED."}), 400

    paymentTxnId = booking.get("paymentTxnId")
    depositTxnId = booking.get("depositTxnId")
    
    # Self-hydrate
    guestId = body.get("guestId") or booking.get("guestId")
    hostId = body.get("hostId") or booking.get("hostId")
    listingId = body.get("listingId") or booking.get("listingId")
    checkInDate = body.get("checkInDate") or booking.get("checkInDate")
    checkOutDate = body.get("checkOutDate") or booking.get("checkOutDate")

    # Fetch holdId
    holdId = body.get("holdId") or body.get("hold_id")
    if not holdId:
        h_status, h_data = call_service("get", f"{AVAILABILITY_SERVICE_URL}/holds/booking/{bookingId}")
        if h_status == 200:
            holdId = (h_data.get("data") or {}).get("holdId") or (h_data.get("data") or {}).get("hold_id")
            if holdId:
                print(f"[REJECT-SERVICE] Found holdId: {holdId} for booking {bookingId}", flush=True)
        else:
            print(f"[REJECT-SERVICE][WARNING] Could not find holdId for booking {bookingId} (Status: {h_status})", flush=True)

    # 2. Call PUT /bookings/{id} on Booking Detail Service to update status
    put_status, put_data = call_service("put", f"{BOOKING_DETAIL_SERVICE_URL}/bookings/{bookingId}", {
        "status": status_indication
    })
    if put_status != 200:
        print(f"[REJECT-SERVICE][ERROR] Failed to update booking status in Detail Service. Status: {put_status}, Response: {put_data}", flush=True)
    else:
        print(f"[REJECT-SERVICE][SUCCESS] Booking status updated to {status_indication} in Detail Service.", flush=True)

    # 3. Call DELETE /availability/hold/{holdId} on Availability Service
    if holdId:
        d_status, d_data = call_service("delete", f"{AVAILABILITY_SERVICE_URL}/availability/holds/{holdId}")
        if d_status != 200:
             print(f"[REJECT-SERVICE][ERROR] Failed to delete hold {holdId} in Availability Service. Status: {d_status}, Response: {d_data}", flush=True)
        else:
             print(f"[REJECT-SERVICE][SUCCESS] Hold {holdId} deleted in Availability Service.", flush=True)

    # Reason for payment services based on status
    reason = "HOST_REJECTED" if status_indication == "REJECTED" else "HOST_NO_RESPONSE"

    # 4. Consolidated Call POST to Payment Gateway to void both payments
    if paymentTxnId or depositTxnId:
        v_status, v_data = call_service("post", f"{PAYMENT_GATEWAY_URL}/gateway/void", {
            "paymentTxnId": paymentTxnId,
            "depositTxnId": depositTxnId,
            "reason": reason,
            "idempotencyKey": f"void-{status_indication.lower()}-{bookingId}"
        })
        if v_status != 200:
            print(f"[REJECT-SERVICE][ERROR] Failed to void payment in Gateway Service. Status: {v_status}, Response: {v_data}", flush=True)
        else:
            print(f"[REJECT-SERVICE][SUCCESS] Payment voided in Gateway Service.", flush=True)
        
        # 5. Publish payment.voided and deposit.released events for Payment Logs Service
        if paymentTxnId:
            publish_event("payment.voided", {
                "bookingId": bookingId,
                "paymentTxnId": paymentTxnId,
                "status": "VOIDED",
                "reason": reason,
                "idempotencyKey": f"void-log-{bookingId}"
            })
        if depositTxnId:
            publish_event("deposit.released", {
                "bookingId": bookingId,
                "depositTxnId": depositTxnId,
                "status": "RELEASED",
                "reason": reason,
                "idempotencyKey": f"release-log-{bookingId}"
            })

    # 6. Call GET to User Service to retrieve guest and host contact details
    guestContact, hostContact = {}, {}
    if guestId:
        _, g_res = call_service("get", f"{USERS_SERVICE_URL}/users/{guestId}/contact")
        if g_res: guestContact = g_res.get("data", {})
    if hostId:
        _, h_res = call_service("get", f"{USERS_SERVICE_URL}/users/{hostId}/contact")
        if h_res: hostContact = h_res.get("data", {})

    # 7. Publish BookingDeclined or BookingExpired event to RabbitMQ
    event_payload = {
        "bookingId": bookingId,
        "guestId": guestId,
        "hostId": hostId,
        "listingId": listingId,
        "checkInDate": checkInDate,
        "checkOutDate": checkOutDate,
        "reason": reason,
        "guestContact": guestContact,
        "hostContact": hostContact
    }
    
    routing_key = EVENT_BOOKING_DECLINED if status_indication == "REJECTED" else EVENT_BOOKING_EXPIRED
    publish_event(routing_key, event_payload)

    # 8. Return 200 OK
    return jsonify({
        "code": 200,
        "message": "success",
        "data": {"bookingId": bookingId, "status": status_indication}
    }), 200
