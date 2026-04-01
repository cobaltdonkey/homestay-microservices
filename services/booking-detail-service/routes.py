from flask import Blueprint, jsonify, request
from db import db
from models import BookingDetail
import uuid
import sys

main = Blueprint('main', __name__)

@main.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"}), 200

@main.route('/bookings', methods=['GET'])
def list_bookings():
    guest_id = request.args.get('guestId')
    query = BookingDetail.query
    if guest_id:
        query = query.filter_by(guest_id=guest_id)
    
    bookings = query.order_by(BookingDetail.created_at.desc()).all()
    
    return jsonify({
        "code": 200,
        "data": [{
            "bookingId": b.booking_id,
            "status": b.status,
            "guestId": b.guest_id,
            "hostId": b.host_id,
            "listingId": b.listing_id,
            "checkInDate": str(b.check_in_date) if b.check_in_date else None,
            "checkOutDate": str(b.check_out_date) if b.check_out_date else None,
            "bookingAmount": float(b.booking_amount) if b.booking_amount is not None else None,
            "totalAmount": float(b.total_amount if b.total_amount is not None else b.booking_amount) if (b.total_amount is not None or b.booking_amount is not None) else None,
            "depositAmount": float(b.deposit_amount) if b.deposit_amount is not None else None,
            "listingTitle": b.listing_title,
            "listingImage": b.listing_image,
            "createdAt": b.created_at.isoformat() if b.created_at else None
        } for b in bookings],
        "message": "success"
    }), 200

@main.route('/bookings', methods=['POST'])
def create_booking():
    data = request.json or {}
    print(f"[BOOKING-DETAIL] Creating booking: {data}", file=sys.stderr)
    try:
        new_booking = BookingDetail(
            booking_id=data.get('bookingId', str(uuid.uuid4())),
            status=data.get('status', 'PENDING'),
            payment_txn_id=data.get('paymentTxnId'),
            deposit_txn_id=data.get('depositTxnId'),
            booking_amount=data.get('bookingAmount'),
            total_amount=data.get('totalAmount') or data.get('bookingAmount'), # support both
            deposit_amount=data.get('depositAmount'),
            guest_id=data.get('guestId'),
            host_id=data.get('hostId'),
            listing_id=data.get('listingId'),
            check_in_date=data.get('checkInDate'),
            check_out_date=data.get('checkOutDate'),
            payment_method_id=data.get('paymentMethodId'),
            booking_mode=data.get('bookingMode'),
            listing_title=data.get('listingTitle'),
            listing_image=data.get('listingImage'),
            guests=data.get('guests')
        )
        
        db.session.add(new_booking)
        db.session.commit()
        
        print(f"[BOOKING-DETAIL] Saved booking {new_booking.booking_id} for guest {new_booking.guest_id}", file=sys.stderr)
        return jsonify({"code": 201, "data": {"bookingId": new_booking.booking_id}, "message": "success"}), 201
    except Exception as e:
        db.session.rollback()
        print(f"[BOOKING-DETAIL] Error creating booking: {e}", file=sys.stderr)
        return jsonify({"code": 400, "data": None, "message": str(e)}), 400

@main.route('/bookings/<id>', methods=['GET'])
def get_booking(id):
    booking = BookingDetail.query.get(id)
    if not booking:
        return jsonify({"error": "Not found"}), 404
        
    return jsonify({
        "bookingId": booking.booking_id,
        "status": booking.status,
        "paymentTxnId": booking.payment_txn_id,
        "depositTxnId": booking.deposit_txn_id,
        "bookingAmount": float(booking.booking_amount) if booking.booking_amount is not None else None,
        "depositAmount": float(booking.deposit_amount) if booking.deposit_amount is not None else None
    }), 200

@main.route('/bookings/<id>', methods=['PUT'])
def update_booking(id):
    booking = BookingDetail.query.get(id)
    if not booking:
        return jsonify({"error": "Not found"}), 404
        
    data = request.json or {}
    try:
        if 'status' in data:
            booking.status = data['status']
        if 'paymentTxnId' in data:
            booking.payment_txn_id = data['paymentTxnId']
        if 'depositTxnId' in data:
            booking.deposit_txn_id = data['depositTxnId']
        if 'bookingAmount' in data:
            booking.booking_amount = data['bookingAmount']
        if 'depositAmount' in data:
            booking.deposit_amount = data['depositAmount']
            
        db.session.commit()
        return jsonify({"message": "OK"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400
