from flask import Blueprint, request, jsonify
from helpers import call_service, publish_event
import os
import sys

# Assume constants are accessible or just redefine needed URLs
AVAILABILITY_SERVICE_URL = os.environ.get("AVAILABILITY_SERVICE_URL", "http://availability-service:5005")
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
    b_status, b_data = call_service("get", f"http://booking-detail-service:5012/bookings/{bookingId}")
    if b_status != 200:
        return jsonify({"error": "Booking not found"}), 404
        
    booking = b_data.get("data", {})
    current_status = booking.get("status")
    
    # 2. Validate current status
    if current_status != "PENDING_HOST":
        return jsonify({"error": f"Invalid booking status: {current_status}. Must be PENDING_HOST."}), 400

    paymentTxnId = booking.get("paymentTxnId")
    depositTxnId = booking.get("depositTxnId")
    bookingAmount = booking.get("bookingAmount")
    depositAmount = booking.get("depositAmount")

    # Self-hydrate
    guestId = body.get("guestId") or booking.get("guestId")
    hostId = body.get("hostId") or booking.get("hostId")
    listingId = body.get("listingId") or booking.get("listingId")
    checkInDate = body.get("checkInDate") or booking.get("checkInDate")
    checkOutDate = body.get("checkOutDate") or booking.get("checkOutDate")

    # Fetch holdId
    holdId = body.get("holdId")
    if not holdId:
        _, h_data = call_service("get", f"{AVAILABILITY_SERVICE_URL}/holds/booking/{bookingId}")
        holdId = (h_data.get("data") or {}).get("hold_id")

    # Step 2: Call PUT /availability/hold/{holdId} on Availability Service to re-extend by 15 mins (900 seconds)
    h_status, h_data = call_service("put", f"{AVAILABILITY_SERVICE_URL}/holds/{holdId}/extend", {"ttlSeconds": 900})
    
    # Step 3: If Availability Service returns 404, abort and return error
    if h_status == 404:
        return jsonify({"code": 404, "error": "Hold not found or expired"}), 404

    # Step 4: Call POST to Payment Gateway to capture payment
    # In earlier endpoints: amount / paymentTxnId / idempotencyKey
    call_service("post", f"{PAYMENT_GATEWAY_URL}/gateway/capture", {
        "bookingId": bookingId,
        "paymentTxnId": paymentTxnId,
        "amount": bookingAmount,
        "idempotencyKey": f"approve-{bookingId}"
    })

    # Step 5: Call PUT /bookings/{id} on Booking Detail Service to update status to CONFIRMED
    call_service("put", f"http://booking-detail-service:5012/bookings/{bookingId}", {
        "status": "CONFIRMED"
    })

    # Step 6: Call PUT /availability/hold/{holdId} on Availability Service to upgrade to CONFIRMED_HOLD
    # The existing route was `/holds/{holdId}/confirm`, mapping to this requirement.
    call_service("put", f"{AVAILABILITY_SERVICE_URL}/holds/{holdId}/confirm")

    # Step 7: Call POST to Stay Service to initialise the stay record
    call_service("post", f"{STAY_SERVICE_URL}/stays", {
         "bookingId": bookingId,
         "guestId": guestId,
         "hostId": hostId,
         "listingId": listingId,
         "checkInDate": checkInDate,
         "checkOutDate": checkOutDate,
         "depositTxnId": depositTxnId,
         "depositAmount": depositAmount
    })

    # Step 8: Call GET to User Service to retrieve guest and host contact details
    _, g_res = call_service("get", f"{USERS_SERVICE_URL}/users/{guestId}/contact")
    guestContact = g_res.get("data", {}) if g_res else {}
    _, h_res = call_service("get", f"{USERS_SERVICE_URL}/users/{hostId}/contact")
    hostContact = h_res.get("data", {}) if h_res else {}

    # Step 9: Publish BookingConfirmed event to RabbitMQ
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

    # Step 10: Return 200 OK
    return jsonify({
        "code": 200,
        "message": "success",
        "data": {"bookingId": bookingId, "status": "CONFIRMED"}
    }), 200
