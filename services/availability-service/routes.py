import os
import uuid
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from models import Hold, Reservation
from db import db

main = Blueprint('main', __name__)

@main.route('/health', methods=['GET'])
def health():
    # Proactive cleanup of expired holds on every heartbeat
    try:
        Hold.query.filter(Hold.expires_at <= datetime.utcnow()).delete()
        db.session.commit()
    except:
        db.session.rollback()

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
    
    # 0. Clean up any expired holds to allow others to book immediately
    try:
        # Delete EXPIRED holds regardless of status if they have passed their deadline
        Hold.query.filter(
            Hold.expires_at <= now
        ).delete()
        db.session.commit()
        print(f"[CLEANUP] Deleted expired holds at {now}", flush=True)
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] Hold cleanup failed: {e}", flush=True)

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
@main.route('/availability/', methods=['GET'])
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

@main.route('/availability/holds', methods=['POST'])
@main.route('/availability/hold', methods=['POST'])
@main.route('/holds', methods=['POST'])
@main.route('/hold', methods=['POST'])
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
        booking_id=str(booking_id) if booking_id else None,
        guest_id=guest_id,
        check_in_date=check_in_date,
        check_out_date=check_out_date,
        ttl_seconds=ttl_seconds,
        expires_at=expires_at,
        reason=str(reason) if reason else None,
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
    print(f"[AVAILABILITY] Extending hold {hold_id} with data: {data}", flush=True)
    ttl_seconds = data.get('ttlSeconds')
    booking_id = data.get('bookingId')
    reason = data.get('reason')

    if not any([ttl_seconds, booking_id, reason]):
        return jsonify({"code": 400, "data": {}, "message": "At least one of [ttlSeconds, bookingId, reason] is required"}), 400

    hold = Hold.query.get(hold_id)
    if not hold:
        return jsonify({"code": 404, "data": {}, "message": "Hold not found"}), 404

    try:
        if ttl_seconds:
            hold.ttl_seconds = int(ttl_seconds)
            hold.expires_at = datetime.utcnow() + timedelta(seconds=int(ttl_seconds))
        if booking_id:
            print(f"[AVAILABILITY] Linking hold {hold_id} to booking {booking_id}", flush=True)
            hold.booking_id = str(booking_id)
        if reason:
            hold.reason = str(reason)
        
        db.session.add(hold)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"[AVAILABILITY] Error extending hold: {e}", flush=True)
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

@main.route('/availability/holds/<string:hold_id>', methods=['DELETE'])
@main.route('/holds/<string:hold_id>', methods=['DELETE'])
def delete_hold(hold_id):
    print(f"[AVAILABILITY] Deleting hold {hold_id}", flush=True)
    hold = Hold.query.get(hold_id)
    if not hold:
        print(f"[AVAILABILITY] Hold {hold_id} not found for deletion", flush=True)
        return jsonify({"code": 404, "data": {}, "message": "Hold not found"}), 404

    try:
        db.session.delete(hold)
        db.session.commit()
        print(f"[AVAILABILITY] Successfully deleted hold {hold_id}", flush=True)
    except Exception as e:
        db.session.rollback()
        print(f"[AVAILABILITY] Error deleting hold {hold_id}: {e}", flush=True)
        return jsonify({"code": 500, "data": {}, "message": str(e)}), 500

    return jsonify({
        "code": 200,
        "data": {},
        "message": "Hold deleted successfully"
    }), 200

@main.route('/reservations', methods=['POST'])
def create_reservation():
    data = request.json or {}
    listing_id = data.get('listingId')
    booking_id = data.get('bookingId')
    guest_id = data.get('guestId')
    check_in_str = data.get('checkInDate')
    check_out_str = data.get('checkOutDate')

    if not all([listing_id, booking_id, guest_id, check_in_str, check_out_str]):
        return jsonify({"code": 400, "data": {}, "message": "Missing required fields"}), 400

    try:
        check_in_date = datetime.strptime(check_in_str, '%Y-%m-%d').date()
        check_out_date = datetime.strptime(check_out_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({"code": 400, "data": {}, "message": "Invalid date format, use YYYY-MM-DD"}), 400

    reservation_id = str(uuid.uuid4())
    new_reservation = Reservation(
        reservation_id=reservation_id,
        listing_id=listing_id,
        booking_id=booking_id,
        guest_id=guest_id,
        check_in_date=check_in_date,
        check_out_date=check_out_date
    )

    try:
        db.session.add(new_reservation)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"code": 500, "data": {}, "message": str(e)}), 500

    return jsonify({
        "code": 201,
        "data": new_reservation.to_dict(),
        "message": "Reservation created successfully"
    }), 201

@main.route('/holds/booking/<string:booking_id>', methods=['GET'])
@main.route('/availability/holds/booking/<string:booking_id>', methods=['GET'])
def get_hold_by_booking(booking_id):
    print(f"[AVAILABILITY] Fetching hold for booking {booking_id}", flush=True)
    hold = Hold.query.filter_by(booking_id=booking_id).first()
    if not hold:
        print(f"[AVAILABILITY] No hold found for booking {booking_id}", flush=True)
        return jsonify({"code": 404, "data": {}, "message": "Hold not found"}), 404

    return jsonify({
        "code": 200,
        "data": hold.to_dict(),
        "message": "success"
    }), 200

@main.route('/reservations/booking/<string:booking_id>', methods=['DELETE'])
def delete_reservation_by_booking(booking_id):
    reservation = Reservation.query.filter_by(booking_id=booking_id).first()
    if not reservation:
        return jsonify({"code": 404, "data": {}, "message": "Reservation not found"}), 404

    try:
        db.session.delete(reservation)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"code": 500, "data": {}, "message": str(e)}), 500

    return jsonify({
        "code": 200,
        "data": {},
        "message": "Reservation deleted successfully"
    }), 200
