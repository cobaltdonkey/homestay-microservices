from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta, date
import uuid
from models import db, Booking
from helpers import publish_event, call_service
from shared.constants import *

bp = Blueprint('main', __name__)


@bp.route('/health', methods=['GET'])
@bp.route('/bookings/health', methods=['GET'])
def health():
    return jsonify({"code": 200,
        "data": {"status": "ok", "service": "booking-service"},
        "message": "success"}), 200


@bp.route('/initiate', methods=['POST'])
@bp.route('/bookings/initiate', methods=['POST'])
def initiate_booking():
    body = request.get_json() or {}
    listingId = body.get('listingId')
    guestId = body.get('guestId')
    checkInDate = body.get('checkInDate')
    checkOutDate = body.get('checkOutDate')
    paymentMethodId = body.get('paymentMethodId')
    bookingMode = body.get('bookingMode')
    
    # Optional fields for My Trips
    listingTitle = body.get('listingTitle')
    listingImage = body.get('listingImage')
    totalAmount = body.get('totalAmount')
    guests = body.get('guests')

    # Step 1 — Validate listing
    status_code, data = call_service("get",
        f"{LISTINGS_SERVICE_URL}/listings/{listingId}")
    if status_code != 200:
        return jsonify({"code": 400, "data": None, "message": "Listing not found"}), 400
    listing = data["data"]
    if listing["status"] != "ACTIVE":
        return jsonify({"code": 400, "data": None, "message": "Listing not available"}), 400
    hostId = listing["hostId"]
    pricePerNight = float(listing["pricePerNight"])

    # Step 2 — Check availability
    status_code, data = call_service("get",
        f"{AVAILABILITY_SERVICE_URL}/availability"
        f"?listingId={listingId}&checkInDate={checkInDate}&checkOutDate={checkOutDate}")
    if status_code != 200 or not data["data"]["available"]:
        return jsonify({"code": 409, "data": None, "message": "Dates not available"}), 409

    # Step 3 — Create hold
    status_code, data = call_service("post",
        f"{AVAILABILITY_SERVICE_URL}/holds",
        {"listingId": listingId, "guestId": guestId,
         "checkInDate": checkInDate, "checkOutDate": checkOutDate,
         "ttlSeconds": 900})
    if status_code != 201:
        return jsonify({"code": 503, "data": None, "message": "Could not hold dates"}), 503
    holdId = data["data"]["holdId"]

    # Step 4 — Calculate amounts
    ci = date.fromisoformat(checkInDate)
    co = date.fromisoformat(checkOutDate)
    nights = (co - ci).days
    amount = round(pricePerNight * nights, 2)
    depositAmount = round(pricePerNight * 0.5, 2)

    # Step 5 — Insert Booking
    bookingId = str(uuid.uuid4())
    booking = Booking(
        booking_id=bookingId,
        guest_id=guestId,
        host_id=hostId,
        listing_id=listingId,
        check_in_date=ci,
        check_out_date=co,
        payment_method_id=paymentMethodId,
        payment_due_at=datetime.utcnow() + timedelta(minutes=15),
        hold_id=holdId,
        booking_mode=bookingMode,
        status=BOOKING_STATUS_AWAITING_PAYMENT,
        listing_title=listingTitle,
        listing_image=listingImage,
        total_amount=totalAmount if totalAmount is not None else amount,
        guests=guests
    )
    db.session.add(booking)
    db.session.commit()

    # Step 6 — Payment
    if bookingMode == BOOKING_MODE_INSTANT:
        pay_status, pay_data = call_service("post",
            f"{PAYMENT_GATEWAY_URL}/gateway/capture",
            {"bookingId": bookingId, "amount": amount,
             "paymentMethodId": paymentMethodId,
             "idempotencyKey": f"capture-{bookingId}"})
    else:
        pay_status, pay_data = call_service("post",
            f"{PAYMENT_GATEWAY_URL}/gateway/authorise",
            {"bookingId": bookingId, "amount": amount,
             "paymentMethodId": paymentMethodId,
             "idempotencyKey": f"auth-{bookingId}"})

    # Step 7 — Deposit pre-auth
    dep_status, dep_data = call_service("post",
        f"{PAYMENT_GATEWAY_URL}/gateway/pre-auth",
        {"bookingId": bookingId, "depositAmount": depositAmount,
         "paymentMethodId": paymentMethodId,
         "idempotencyKey": f"deposit-{bookingId}"})

    # Step 8 — Handle failure
    if pay_status != 200 or dep_status != 200:
        booking.status = BOOKING_STATUS_FAILED_PAYMENT
        db.session.commit()
        call_service("delete",
            f"{AVAILABILITY_SERVICE_URL}/holds/{holdId}")
        publish_event(EVENT_PAYMENT_ERROR,
            {"bookingId": bookingId, "amount": amount,
             "status": "FAILED_PAYMENT", "reason": "PAYMENT_FAILED"})
        return jsonify({"code": 402, "data": None, "message": "Payment failed"}), 402

    paymentTxnId = pay_data["data"].get("paymentTxnId") or pay_data["data"].get("depositTxnId")
    depositTxnId = dep_data["data"].get("depositTxnId")
    booking.payment_txn_id = paymentTxnId
    booking.deposit_txn_id = depositTxnId
    db.session.commit()

    # Step 9a — INSTANT success
    if bookingMode == BOOKING_MODE_INSTANT:
        booking.status = BOOKING_STATUS_CONFIRMED
        db.session.commit()
        call_service("post", f"{STAY_SERVICE_URL}/stays",
            {"bookingId": bookingId, "guestId": guestId,
             "hostId": hostId, "listingId": listingId,
             "checkInDate": checkInDate, "checkOutDate": checkOutDate,
             "depositTxnId": depositTxnId, "depositAmount": depositAmount})
        _, g = call_service("get", f"{USERS_SERVICE_URL}/users/{guestId}/contact")
        _, h = call_service("get", f"{USERS_SERVICE_URL}/users/{hostId}/contact")
        guestContact = g.get("data", {})
        hostContact = h.get("data", {})
        publish_event(EVENT_BOOKING_CONFIRMED,
            {"bookingId": bookingId, "guestId": guestId,
             "hostId": hostId, "listingId": listingId,
             "checkInDate": checkInDate, "checkOutDate": checkOutDate,
             "guestContact": guestContact, "hostContact": hostContact})
        publish_event(EVENT_PAYMENT_SUCCESS,
            {"bookingId": bookingId, "paymentTxnId": paymentTxnId,
             "transactionType": TXN_TYPE_BOOKING_CAPTURE,
             "amount": amount, "status": PAYMENT_STATUS_SUCCESS})
        return jsonify({"code": 201,
            "data": {"bookingId": bookingId, "status": "CONFIRMED"},
            "message": "success"}), 201

    # Step 9b — REQUEST success
    else:
        booking.status = BOOKING_STATUS_PAID
        db.session.commit()
        call_service("put",
            f"{AVAILABILITY_SERVICE_URL}/holds/{holdId}/extend",
            {"ttlSeconds": 86400, "reason": "PENDING_HOST"})
        booking.status = BOOKING_STATUS_PENDING_HOST
        db.session.commit()
        _, g = call_service("get", f"{USERS_SERVICE_URL}/users/{guestId}/contact")
        _, h = call_service("get", f"{USERS_SERVICE_URL}/users/{hostId}/contact")
        guestContact = g.get("data", {})
        hostContact = h.get("data", {})
        publish_event(EVENT_BOOKING_REQUESTED,
            {"bookingId": bookingId, "guestId": guestId,
             "hostId": hostId, "listingId": listingId,
             "checkInDate": checkInDate, "checkOutDate": checkOutDate,
             "guestContact": guestContact, "hostContact": hostContact})
        publish_event(EVENT_PAYMENT_HELD,
            {"bookingId": bookingId, "paymentTxnId": paymentTxnId,
             "transactionType": TXN_TYPE_BOOKING_AUTHORIZE,
             "amount": amount, "status": PAYMENT_STATUS_AUTHORIZED})
        return jsonify({"code": 201,
            "data": {"bookingId": bookingId, "status": "PENDING_HOST"},
            "message": "success"}), 201


@bp.route('/<bookingId>', methods=['GET'])
@bp.route('/bookings/<bookingId>', methods=['GET'])
def get_booking(bookingId):
    booking = Booking.query.get(bookingId)
    if not booking:
        return jsonify({"code": 404, "data": None, "message": "Booking not found"}), 404
    return jsonify({"code": 200, "data": booking.to_dict(), "message": "success"}), 200


@bp.route('', methods=['GET'])
@bp.route('/bookings', methods=['GET'])
def list_bookings():
    guestId = request.args.get('guestId')
    hostId = request.args.get('hostId')
    
    query = Booking.query
    if guestId:
        query = query.filter_by(guest_id=guestId)
    if hostId:
        query = query.filter_by(host_id=hostId)
        
    bookings = query.order_by(Booking.created_at.desc()).all()
    return jsonify({
        "code": 200,
        "data": [b.to_dict() for b in bookings],
        "message": "success"
    }), 200


@bp.route('/listings/<listingId>/booked-dates', methods=['GET'])
@bp.route('/bookings/listings/<listingId>/booked-dates', methods=['GET'])
def get_booked_dates(listingId):
    """Return all booked date ranges for a listing to prevent double-booking."""
    active_statuses = [
        BOOKING_STATUS_AWAITING_PAYMENT,
        BOOKING_STATUS_PAID,
        BOOKING_STATUS_CONFIRMED,
        BOOKING_STATUS_PENDING_HOST,
    ]
    bookings = Booking.query.filter(
        Booking.listing_id == listingId,
        Booking.status.in_(active_statuses)
    ).all()
    
    booked_ranges = [
        {
            "checkInDate": b.check_in_date.isoformat(),
            "checkOutDate": b.check_out_date.isoformat(),
        }
        for b in bookings
    ]
    return jsonify({
        "code": 200,
        "data": booked_ranges,
        "message": "success"
    }), 200


@bp.route('/<bookingId>/approve', methods=['POST'])
@bp.route('/bookings/<bookingId>/approve', methods=['POST'])
def approve_booking(bookingId):
    booking = Booking.query.get(bookingId)
    if not booking:
        return jsonify({"code": 404, "data": None, "message": "Not found"}), 404
    if booking.status != BOOKING_STATUS_PENDING_HOST:
        return jsonify({"code": 400, "data": None, "message": "Booking is not pending host approval"}), 400
    if booking.payment_due_at < datetime.utcnow():
        return jsonify({"code": 400, "data": None, "message": "Booking request has expired"}), 400

    _, listing_data = call_service("get",
        f"{LISTINGS_SERVICE_URL}/listings/{booking.listing_id}")
    pricePerNight = float(listing_data["data"]["pricePerNight"])
    nights = (booking.check_out_date - booking.check_in_date).days
    amount = round(pricePerNight * nights, 2)

    # Step 1 — Capture payment
    call_service("post",
        f"{PAYMENT_GATEWAY_URL}/gateway/capture",
        {"bookingId": bookingId,
         "paymentTxnId": booking.payment_txn_id,
         "amount": amount,
         "idempotencyKey": f"approve-{bookingId}"})

    # Step 2 — Confirm booking
    booking.status = BOOKING_STATUS_CONFIRMED
    db.session.commit()

    # Step 3 — Confirm hold → reservation
    call_service("put",
        f"{AVAILABILITY_SERVICE_URL}/holds/{booking.hold_id}/confirm")

    # Step 4 — Create stay
    call_service("post", f"{STAY_SERVICE_URL}/stays",
        {"bookingId": bookingId,
         "guestId": booking.guest_id,
         "hostId": booking.host_id,
         "listingId": booking.listing_id,
         "checkInDate": booking.check_in_date.isoformat(),
         "checkOutDate": booking.check_out_date.isoformat(),
         "depositTxnId": booking.deposit_txn_id,
         "depositAmount": round(pricePerNight * 0.5, 2)})

    # Step 5 — Fetch contacts
    _, g = call_service("get",
        f"{USERS_SERVICE_URL}/users/{booking.guest_id}/contact")
    _, h = call_service("get",
        f"{USERS_SERVICE_URL}/users/{booking.host_id}/contact")
    guestContact = g.get("data", {})
    hostContact = h.get("data", {})

    # Step 6 — Publish event
    publish_event(EVENT_BOOKING_CONFIRMED,
        {"bookingId": bookingId,
         "guestId": booking.guest_id,
         "hostId": booking.host_id,
         "listingId": booking.listing_id,
         "checkInDate": booking.check_in_date.isoformat(),
         "checkOutDate": booking.check_out_date.isoformat(),
         "guestContact": guestContact,
         "hostContact": hostContact})

    return jsonify({"code": 200,
        "data": {"bookingId": bookingId, "status": "CONFIRMED"},
        "message": "success"}), 200


@bp.route('/<bookingId>/reject', methods=['POST'])
@bp.route('/bookings/<bookingId>/reject', methods=['POST'])
def reject_booking(bookingId):
    booking = Booking.query.get(bookingId)
    if not booking or booking.status != BOOKING_STATUS_PENDING_HOST:
        return jsonify({"code": 400, "data": None, "message": "Cannot reject this booking"}), 400

    # Step 1 — Mark rejected
    booking.status = BOOKING_STATUS_REJECTED
    db.session.commit()

    # Step 2 — Release availability hold
    call_service("delete",
        f"{AVAILABILITY_SERVICE_URL}/holds/{booking.hold_id}")

    # Step 3 — Void payment authorization
    call_service("post",
        f"{PAYMENT_GATEWAY_URL}/gateway/void",
        {"paymentTxnId": booking.payment_txn_id,
         "reason": "HOST_REJECTED",
         "idempotencyKey": f"void-{bookingId}"})

    # Step 4 — Release deposit hold
    call_service("post",
        f"{PAYMENT_GATEWAY_URL}/gateway/deposits/release",
        {"depositTxnId": booking.deposit_txn_id,
         "reason": "HOST_REJECTED",
         "idempotencyKey": f"dep-void-{bookingId}"})

    # Step 5 — Fetch alternatives
    _, listing_data = call_service("get",
        f"{LISTINGS_SERVICE_URL}/listings/{booking.listing_id}")
    location = listing_data["data"].get("location", "")
    _, search_data = call_service("get",
        f"{LISTINGS_SEARCH_SERVICE_URL}/search/listings?location={location}&limit=3")
    alternatives = search_data.get("data", [])

    # Step 6 — Fetch guest contact
    _, g = call_service("get",
        f"{USERS_SERVICE_URL}/users/{booking.guest_id}/contact")
    guestContact = g.get("data", {})

    # Step 7 — Publish event
    publish_event(EVENT_BOOKING_DECLINED,
        {"bookingId": bookingId,
         "guestId": booking.guest_id,
         "listingId": booking.listing_id,
         "checkInDate": booking.check_in_date.isoformat(),
         "checkOutDate": booking.check_out_date.isoformat(),
         "reason": "HOST_REJECTED",
         "guestContact": guestContact,
         "alternativeListings": alternatives})

    return jsonify({"code": 200,
        "data": {"bookingId": bookingId, "status": "REJECTED"},
        "message": "success"}), 200


@bp.route('/<bookingId>/payment-timeout', methods=['POST'])
@bp.route('/bookings/<bookingId>/payment-timeout', methods=['POST'])
def payment_timeout(bookingId):
    booking = Booking.query.get(bookingId)
    if not booking:
        return jsonify({"code": 404, "data": None, "message": "Not found"}), 404
    if booking.status != BOOKING_STATUS_AWAITING_PAYMENT:
        return jsonify({"code": 200,
            "data": {"bookingId": bookingId, "status": booking.status},
            "message": "Already processed"}), 200

    booking.status = BOOKING_STATUS_FAILED_PAYMENT
    db.session.commit()
    if booking.hold_id:
        call_service("delete",
            f"{AVAILABILITY_SERVICE_URL}/holds/{booking.hold_id}")
    return jsonify({"code": 200,
        "data": {"bookingId": bookingId, "status": "FAILED_PAYMENT"},
        "message": "success"}), 200


@bp.route('/<bookingId>/expire', methods=['POST'])
@bp.route('/bookings/<bookingId>/expire', methods=['POST'])
def expire_booking(bookingId):
    booking = Booking.query.get(bookingId)
    if not booking:
        return jsonify({"code": 404, "data": None, "message": "Not found"}), 404
    if booking.status != BOOKING_STATUS_PENDING_HOST:
        return jsonify({"code": 200,
            "data": {"bookingId": bookingId, "status": booking.status},
            "message": "Already processed"}), 200

    # Step 1 — Mark expired
    booking.status = BOOKING_STATUS_EXPIRED
    db.session.commit()

    # Step 2 — Release availability hold
    call_service("delete",
        f"{AVAILABILITY_SERVICE_URL}/holds/{booking.hold_id}")

    # Step 3 — Void payment authorization
    call_service("post",
        f"{PAYMENT_GATEWAY_URL}/gateway/void",
        {"paymentTxnId": booking.payment_txn_id,
         "reason": "HOST_NO_RESPONSE",
         "idempotencyKey": f"void-exp-{bookingId}"})

    # Step 4 — Release deposit hold
    call_service("post",
        f"{PAYMENT_GATEWAY_URL}/gateway/deposits/release",
        {"depositTxnId": booking.deposit_txn_id,
         "reason": "HOST_NO_RESPONSE",
         "idempotencyKey": f"dep-exp-{bookingId}"})

    # Step 5 — Fetch alternatives
    _, listing_data = call_service("get",
        f"{LISTINGS_SERVICE_URL}/listings/{booking.listing_id}")
    location = listing_data["data"].get("location", "")
    _, search_data = call_service("get",
        f"{LISTINGS_SEARCH_SERVICE_URL}/search/listings?location={location}&limit=3")
    alternatives = search_data.get("data", [])

    # Step 6 — Fetch guest contact
    _, g = call_service("get",
        f"{USERS_SERVICE_URL}/users/{booking.guest_id}/contact")
    guestContact = g.get("data", {})

    # Step 7 — Publish event
    publish_event(EVENT_BOOKING_EXPIRED,
        {"bookingId": bookingId,
         "guestId": booking.guest_id,
         "listingId": booking.listing_id,
         "reason": "HOST_NO_RESPONSE",
         "guestContact": guestContact,
         "alternativeListings": alternatives})

    # Step 8 — Return
    return jsonify({"code": 200,
        "data": {"bookingId": bookingId, "status": "EXPIRED"},
        "message": "success"}), 200
