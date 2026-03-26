import os
import uuid
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from models import Hold, Reservation
from db import db

main = Blueprint('main', __name__)

@main.route('/health', methods=['GET'])
def health():
    return jsonify({
        "code": 200,
        "data": {
            "status": "ok",
            "service": os.environ.get('SERVICE_NAME', 'availability-service')
        },
        "message": "success"
    }), 200

def check_availability(listing_id, check_in_date, check_out_date):
    now = datetime.utcnow()
    
    # 1. Check hold table
    active_holds = Hold.query.filter(
        Hold.listing_id == listing_id,
        Hold.status.in_(['HELD', 'PENDING_HOST']),
        Hold.expires_at > now,
        check_in_date < Hold.check_out_date,
        check_out_date > Hold.check_in_date
    ).all()

    if active_holds:
        return False

    # 2. Check reservation table
    active_reservations = Reservation.query.filter(
        Reservation.listing_id == listing_id,
        check_in_date < Reservation.check_out_date,
        check_out_date > Reservation.check_in_date
    ).all()

    if active_reservations:
        return False

    return True

@main.route('/availability', methods=['GET'])
@main.route('/', methods=['GET'])
def get_availability():
    listing_id = request.args.get('listingId')
    check_in_str = request.args.get('checkInDate')
    check_out_str = request.args.get('checkOutDate')

    if not all([listing_id, check_in_str, check_out_str]):
        return jsonify({"code": 400, "data": {}, "message": "Missing required query parameters"}), 400

    try:
        check_in_date = datetime.strptime(check_in_str, '%Y-%m-%d').date()
        check_out_date = datetime.strptime(check_out_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({"code": 400, "data": {}, "message": "Invalid date format, use YYYY-MM-DD"}), 400

    is_available = check_availability(listing_id, check_in_date, check_out_date)

    return jsonify({
        "code": 200,
        "data": {"available": is_available},
        "message": "success"
    }), 200

@main.route('/availability/hold', methods=['POST'])
@main.route('/holds', methods=['POST'])
def create_hold():
    data = request.json or {}
    listing_id = data.get('listingId')
    guest_id = data.get('guestId')
    check_in_str = data.get('checkInDate')
    check_out_str = data.get('checkOutDate')
    ttl_seconds = data.get('ttlSeconds', 900)
    booking_id = data.get('bookingId')
    reason = data.get('reason')

    if not all([listing_id, guest_id, check_in_str, check_out_str]):
        return jsonify({"code": 400, "data": {}, "message": "Missing required fields"}), 400

    try:
        check_in_date = datetime.strptime(check_in_str, '%Y-%m-%d').date()
        check_out_date = datetime.strptime(check_out_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({"code": 400, "data": {}, "message": "Invalid date format, use YYYY-MM-DD"}), 400

    is_available = check_availability(listing_id, check_in_date, check_out_date)
    if not is_available:
        return jsonify({"code": 409, "data": {}, "message": "Dates are unavailable"}), 409

    hold_id = str(uuid.uuid4())
    expires_at = datetime.utcnow() + timedelta(seconds=ttl_seconds)

    new_hold = Hold(
        hold_id=hold_id,
        listing_id=listing_id,
        booking_id=booking_id,
        guest_id=guest_id,
        check_in_date=check_in_date,
        check_out_date=check_out_date,
        ttl_seconds=ttl_seconds,
        expires_at=expires_at,
        reason=reason,
        status='HELD'
    )

    try:
        db.session.add(new_hold)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"code": 500, "data": {}, "message": str(e)}), 500

    return jsonify({
        "code": 201,
        "data": new_hold.to_dict(),
        "message": "Hold created successfully"
    }), 201

@main.route('/holds/<string:hold_id>/extend', methods=['PUT'])
def extend_hold(hold_id):
    data = request.json or {}
    ttl_seconds = data.get('ttlSeconds')
    reason = data.get('reason')

    if not ttl_seconds:
        return jsonify({"code": 400, "data": {}, "message": "ttlSeconds is required"}), 400

    hold = Hold.query.get(hold_id)
    if not hold:
        return jsonify({"code": 404, "data": {}, "message": "Hold not found"}), 404

    try:
        hold.ttl_seconds = ttl_seconds
        hold.expires_at = datetime.utcnow() + timedelta(seconds=ttl_seconds)
        if reason:
            hold.reason = reason
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"code": 500, "data": {}, "message": str(e)}), 500

    return jsonify({
        "code": 200,
        "data": hold.to_dict(),
        "message": "success"
    }), 200

@main.route('/holds/<string:hold_id>/confirm', methods=['PUT'])
def confirm_hold(hold_id):
    hold = Hold.query.get(hold_id)
    if not hold:
        return jsonify({"code": 404, "data": {}, "message": "Hold not found"}), 404

    booking_id = hold.booking_id
    if not booking_id:
        return jsonify({"code": 400, "data": {}, "message": "Hold doesn't have an associated bookingId to reserve."}), 400

    reservation_id = str(uuid.uuid4())
    reservation = Reservation(
        reservation_id=reservation_id,
        listing_id=hold.listing_id,
        booking_id=booking_id,
        guest_id=hold.guest_id,
        check_in_date=hold.check_in_date,
        check_out_date=hold.check_out_date
    )

    try:
        db.session.add(reservation)
        db.session.delete(hold)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"code": 500, "data": {}, "message": str(e)}), 500

    return jsonify({
        "code": 200,
        "data": {"reservationId": reservation.reservation_id},
        "message": "success"
    }), 200

@main.route('/holds/<string:hold_id>', methods=['DELETE'])
def delete_hold(hold_id):
    hold = Hold.query.get(hold_id)
    if not hold:
        return jsonify({"code": 404, "data": {}, "message": "Hold not found"}), 404

    try:
        db.session.delete(hold)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"code": 500, "data": {}, "message": str(e)}), 500

    return jsonify({
        "code": 200,
        "data": {},
        "message": "Hold deleted successfully"
    }), 200
