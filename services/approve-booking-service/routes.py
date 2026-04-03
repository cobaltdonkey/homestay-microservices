from flask import Blueprint, request, jsonify
from helpers import call_service, publish_event
import os
import sys

# Assume constants are accessible or just redefine needed URLs
AVAILABILITY_SERVICE_URL = os.environ.get("AVAILABILITY_SERVICE_URL", "http://availability-service:5005")
BOOKING_DETAIL_SERVICE_URL = os.environ.get("BOOKING_DETAIL_SERVICE_URL", "http://booking-detail-service:5012")
PAYMENT_GATEWAY_URL = os.environ.get("PAYMENT_GATEWAY_URL", "http://payment-gateway-wrapper:5010")
STAY_SERVICE_URL = os.environ.get("STAY_SERVICE_URL", "http://stay-service:5006")
USERS_SERVICE_URL = os.environ.get("USERS_SERVICE_URL", "http://users-service:5003")
EVENT_BOOKING_CONFIRMED = "booking.confirmed"

bp = Blueprint('main', __name__)

@bp.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "service": "approve-booking-service"}), 200

@bp.route('/approve/<bookingId>', methods=['POST', 'OPTIONS'])
def approve_booking(bookingId):
    # Handle CORS preflight explicitly if needed by frontend
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    body = request.get_json() or {}

    # Step 1: Call GET /bookings/{id} on Booking Detail Service
    print(f"[DEBUG] Step 1: Fetching booking {bookingId} from {BOOKING_DETAIL_SERVICE_URL}...", flush=True)
    b_status, b_data = call_service("get", f"{BOOKING_DETAIL_SERVICE_URL}/bookings/{bookingId}")
    if b_status != 200:
        print(f"[DEBUG] Step 1 Failed for ID {bookingId}: Status {b_status} | Body: {b_data}", flush=True)
        return jsonify({"code": b_status, "error": f"Booking {bookingId} not found in DB or error ({b_status}).", "details": b_data}), 404
        
    booking = b_data.get("data", {})
    status = booking.get("status")
    print(f"[DEBUG] Step 1 Success: Booking {bookingId} status is {status}", flush=True)

    # Fallback to values from the DB if not in request body
    # This is CRITICAL if the Frontend doesn't pass them in the POST body.
    holdId = holdId or booking.get("holdId")
    listingId = listingId or booking.get("listingId")
    guestId = guestId or booking.get("guestId")
    hostId = hostId or booking.get("hostId")
    checkInDate = checkInDate or booking.get("checkInDate")
    checkOutDate = checkOutDate or booking.get("checkOutDate")

    print(f"[DEBUG] IDs: holdId={holdId}, listingId={listingId}, guestId={guestId}, hostId={hostId}", flush=True)
    print(f"[DEBUG] Dates: checkIn={checkInDate}, checkOut={checkOutDate}", flush=True)

    payment_due_at = booking.get("paymentDueAt")
    
    # Validation step as requested
    if status != "PENDING_HOST":
        return jsonify({"code": 403, "error": f"Invalid booking status: {status}. Must be PENDING_HOST."}), 403
        
    if payment_due_at:
        # Check for expiration
        from datetime import datetime, timezone
        due_time = datetime.fromisoformat(payment_due_at.replace('Z', '+00:00'))
        if datetime.now(timezone.utc) > due_time:
             print(f"[DEBUG] Validation Failed: Booking {bookingId} expired at {due_time}", flush=True)
             return jsonify({"code": 403, "error": "Booking request has expired (payment due date passed)."}), 403

    paymentTxnId = booking.get("paymentTxnId")
    depositTxnId = booking.get("depositTxnId")
    bookingAmount = booking.get("bookingAmount")
    depositAmount = booking.get("depositAmount")

    # Step 1.5: If holdId is missing, try to find it by bookingId
    if not holdId:
        print(f"[DEBUG] Step 1.5: Looking up hold by bookingId {bookingId} at {AVAILABILITY_SERVICE_URL}", flush=True)
        h_list_status, h_list_data = call_service("get", f"{AVAILABILITY_SERVICE_URL}/availability/holds?bookingId={bookingId}")
        if h_list_status == 200 and h_list_data.get("data"):
            holdId = h_list_data["data"][0].get("holdId")
            print(f"[DEBUG] Step 1.5 Success: Found holdId {holdId}", flush=True)
        else:
            print(f"[DEBUG] Step 1.5 Failed: No hold found in list. Status: {h_list_status}, Data: {h_list_data}", flush=True)

    if not holdId:
        print(f"[DEBUG] Aborting: Final holdId is missing for booking {bookingId}", flush=True)
        return jsonify({"code": 404, "error": "No active hold found for this booking. Approval aborted."}), 404

    # Step 3: Re-extend the hold to secure the dates for an additional 15 minutes (900 seconds)
    h_status, h_data = call_service("put", f"{AVAILABILITY_SERVICE_URL}/availability/holds/{holdId}/extend", {"ttlSeconds": 900})
    
    # Step 3 & 4 Validation:
    # If 404, the hold has already expired. We abort.
    # We must receive 200 OK to verify the hold is still active and secured.
    if h_status == 404:
        return jsonify({"code": 404, "error": "Hold has expired or was removed. Approval aborted to prevent invalid payment capture."}), 404
    
    if h_status != 200:
        return jsonify({"code": h_status, "error": f"Failed to verify/extend hold: {h_data.get('message', 'unknown error')}. Approval aborted."}), h_status

    print(f"[DEBUG] Hold {holdId} verified and extended for payment capture phase.", flush=True)

    # Step 5: Call POST to Payment Gateway to capture payment
    capture_status, capture_data = call_service("post", f"{PAYMENT_GATEWAY_URL}/gateway/capture", {
        "bookingId": bookingId,
        "paymentTxnId": paymentTxnId,
        "amount": bookingAmount,
        "idempotencyKey": f"approve-{bookingId}"
    })
    
    # Step 7: Verify capture was successful
    if capture_status != 200:
        return jsonify({
            "code": capture_status, 
            "error": f"Payment capture failed: {capture_data.get('message', 'unknown error')}. Approval aborted."
        }), capture_status

    print(f"[DEBUG] Payment capture successful for booking {bookingId}.", flush=True)

    # Step 8: Publish events to RabbitMQ
    publish_event("payment.captured", {
        "bookingId": bookingId,
        "paymentTxnId": paymentTxnId,
        "amount": bookingAmount,
        "status": "SUCCESS"
    })
    
    if depositTxnId:
        publish_event("deposit.held", {
            "bookingId": bookingId,
            "depositTxnId": depositTxnId,
            "amount": depositAmount,
            "status": "HELD"
        })

    # Step 9: Call PUT /bookings/{id} on Booking Detail Service to update status to CONFIRMED
    print(f"[DEBUG] Step 9: Updating booking {bookingId} status to CONFIRMED...", flush=True)
    b_up_status, b_up_data = call_service("put", f"{BOOKING_DETAIL_SERVICE_URL}/bookings/{bookingId}", {
        "status": "CONFIRMED"
    })
    print(f"[DEBUG] Step 9 Response: {b_up_status} {b_up_data}", flush=True)

    # Step 10: Upgrade the hold to CONFIRMED_HOLD with expiresAt=null.
    # This permanently blocks the dates in availability checks without creating a separate
    # Reservation entity — availability-service manages only the Hold entity.
    print(f"[DEBUG] Step 10: Upgrading hold {holdId} to CONFIRMED_HOLD (permanent block)...", flush=True)
    h_up_status, h_up_data = call_service("put", f"{AVAILABILITY_SERVICE_URL}/holds/{holdId}", {
        "status": "CONFIRMED_HOLD",
        "expiresAt": None
    })
    print(f"[DEBUG] Step 10 Response: {h_up_status} {h_up_data}", flush=True)
    if h_up_status not in (200, 201):
        # Non-fatal: log the failure but do not abort — booking is already captured and confirmed.
        # The hold will eventually be cleaned up, but the booking status is already CONFIRMED.
        print(f"[WARN] Step 10 Failed to upgrade hold to CONFIRMED_HOLD: {h_up_status} {h_up_data}. Continuing...", flush=True)

    # Step 11: Call POST to Stay Service to initialise the stay lifecycle
    print(f"[DEBUG] Step 11: Initialising stay for booking {bookingId}...", flush=True)
    s_status, s_data = call_service("post", f"{STAY_SERVICE_URL}/stays", {
         "bookingId": bookingId,
         "guestId": guestId,
         "hostId": hostId,
         "listingId": listingId,
         "checkInDate": checkInDate,
         "checkOutDate": checkOutDate,
         "depositTxnId": depositTxnId,
         "depositAmount": depositAmount
    })
    print(f"[DEBUG] Step 11 Response: {s_status} {s_data}", flush=True)
    if s_status != 201:
        return jsonify({"code": s_status, "error": f"Failed to initialise stay: {s_data.get('message', 'unknown error')}. Approval completed except for stay creation."}), s_status

    # Step 12: Retrieve guest and host contact details from the User Service
    print(f"[DEBUG] Step 12: Fetching contacts for guest {guestId} and host {hostId}...", flush=True)
    g_cont_status, g_res = call_service("get", f"{USERS_SERVICE_URL}/users/{guestId}/contact")
    guestContact = g_res.get("data", {}) if g_res else {}
    h_cont_status, h_res = call_service("get", f"{USERS_SERVICE_URL}/users/{hostId}/contact")
    hostContact = h_res.get("data", {}) if h_res else {}
    print(f"[DEBUG] Step 12: Guest info: {g_cont_status}, Host info: {h_cont_status}", flush=True)

    # Step 13: Publish BookingConfirmed event to RabbitMQ
    # Notification Gateway consumes this to send SMS (Step 14)
    print(f"[DEBUG] Step 13: Publishing booking.confirmed event...", flush=True)
    publish_event(EVENT_BOOKING_CONFIRMED, {
         "bookingId": bookingId,
         "guestId": guestId,
         "hostId": hostId,
         "listingId": listingId,
         "checkInDate": checkInDate,
         "checkOutDate": checkOutDate,
         "guestContact": guestContact,
         "hostContact": hostContact
    })
    print(f"[DEBUG] Step 13 Success: Event published.", flush=True)

    # Step 15: Return 200 OK
    return jsonify({
        "code": 200,
        "message": "success",
        "data": {"bookingId": bookingId, "status": "CONFIRMED"}
    }), 200
