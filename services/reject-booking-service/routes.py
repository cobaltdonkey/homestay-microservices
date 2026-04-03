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

@bp.route('/<bookingId>', methods=['POST'])
def reject_booking(bookingId):
    body = request.get_json() or {}
    status_indication = body.get('status', 'REJECTED') # 'REJECTED' or 'EXPIRED'
    holdId = body.get('holdId')
    guestId = body.get('guestId')
    hostId = body.get('hostId')
    listingId = body.get('listingId')
    checkInDate = body.get('checkInDate')
    checkOutDate = body.get('checkOutDate')

    if status_indication not in ['REJECTED', 'EXPIRED']:
        return jsonify({"error": "Invalid status indication. Must be REJECTED or EXPIRED."}), 400

    # 1. Call GET /bookings/{id} on Booking Detail Service
    b_status, b_data = call_service("get", f"{BOOKING_DETAIL_SERVICE_URL}/bookings/{bookingId}")
    if b_status != 200:
        return jsonify({"error": "Booking not found"}), 404
        
    booking = b_data.get("data", {})
    paymentTxnId = booking.get("paymentTxnId")
    depositTxnId = booking.get("depositTxnId")

    # Step 1.5: If holdId is missing, try to find it by bookingId
    if not holdId:
        print(f"[DEBUG] Step 1.5: Looking up hold for booking {bookingId}", flush=True)
        h_list_status, h_list_data = call_service("get", f"{AVAILABILITY_SERVICE_URL}/holds?bookingId={bookingId}")
        if h_list_status == 200 and h_list_data.get("data"):
            # FIX: Key is 'holdId' in the Availability Service to_dict()
            holdId = h_list_data["data"][0].get("holdId") 
            print(f"[DEBUG] Found holdId: {holdId}", flush=True)

    # Fallback to values from the DB if not in request body
    # We must use correct field names from the booking-detail-service response
    listingId = listingId or booking.get("listingId")
    guestId = guestId or booking.get("guestId")
    hostId = hostId or booking.get("hostId")
    checkInDate = checkInDate or booking.get("checkInDate")
    checkOutDate = checkOutDate or booking.get("checkOutDate")
    
    print(f"[DEBUG] Final IDs: holdId={holdId}, listingId={listingId}, guestId={guestId}, hostId={hostId}", flush=True)

    # 2. Call PUT /bookings/{id} on Booking Detail Service to update status
    print(f"[DEBUG] Step 2: Updating booking {bookingId} status to {status_indication}...", flush=True)
    call_service("put", f"{BOOKING_DETAIL_SERVICE_URL}/bookings/{bookingId}", {
        "status": status_indication
    })

    # 3. Call DELETE /availability/hold/{holdId} on Availability Service
    if holdId:
        print(f"[DEBUG] Step 3: Deleting hold {holdId}...", flush=True)
        call_service("delete", f"{AVAILABILITY_SERVICE_URL}/holds/{holdId}")

    # Reason for payment services based on status
    reason = "HOST_REJECTED" if status_indication == "REJECTED" else "HOST_NO_RESPONSE"

    # 4. Call POST to Payment Gateway to void the payment
    if paymentTxnId:
        print(f"[DEBUG] Step 4: Voiding payment {paymentTxnId}...", flush=True)
        call_service("post", f"{PAYMENT_GATEWAY_URL}/gateway/void", {
            "paymentTxnId": paymentTxnId,
            "reason": reason,
            "idempotencyKey": f"void-{status_indication.lower()}-{bookingId}"
        })

    # 5. Call POST to Payment Gateway to release the deposit hold
    if depositTxnId:
        print(f"[DEBUG] Step 5: Releasing deposit {depositTxnId}...", flush=True)
        call_service("post", f"{PAYMENT_GATEWAY_URL}/gateway/deposits/release", {
            "depositTxnId": depositTxnId,
            "reason": reason,
            "idempotencyKey": f"dep-void-{status_indication.lower()}-{bookingId}"
        })

    # 6. Call GET to User Service to retrieve guest and host contact details
    print(f"[DEBUG] Step 6: Fetching contacts for guest {guestId} and host {hostId}...", flush=True)
    guestContact, hostContact = {}, {}
    if guestId:
        _, g_res = call_service("get", f"{USERS_SERVICE_URL}/users/{guestId}/contact")
        if g_res: guestContact = g_res.get("data", {})
    if hostId:
        _, h_res = call_service("get", f"{USERS_SERVICE_URL}/users/{hostId}/contact")
        if h_res: hostContact = h_res.get("data", {})

    # 7. Publish BookingDeclined or BookingExpired event to RabbitMQ
    print(f"[DEBUG] Step 7: Publishing event...", flush=True)
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
