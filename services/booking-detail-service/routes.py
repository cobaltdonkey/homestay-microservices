from flask import Blueprint, jsonify, request
from db import db
from models import BookingDetail
import uuid
import sys

main = Blueprint('main', __name__)

@main.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"}), 200

@main.route('/bookings', methods=['POST'])
def create_booking():
    data = request.json or {}
    try:
        new_booking = BookingDetail(
            booking_id=data.get('bookingId', str(uuid.uuid4())),
            status=data.get('status', 'PENDING'),
            payment_txn_id=data.get('paymentTxnId'),
            deposit_txn_id=data.get('depositTxnId'),
            booking_amount=data.get('bookingAmount'),
            deposit_amount=data.get('depositAmount'),
        )
        # Pass dummy requirements if present
        if 'guestId' in data: new_booking.guest_id = data['guestId']
        if 'hostId' in data: new_booking.host_id = data['hostId']
        if 'listingId' in data: new_booking.listing_id = data['listingId']
        if 'checkInDate' in data: new_booking.check_in_date = data['checkInDate']
        if 'checkOutDate' in data: new_booking.check_out_date = data['checkOutDate']
        if 'paymentMethodId' in data: new_booking.payment_method_id = data['paymentMethodId']
        if 'bookingMode' in data: new_booking.booking_mode = data['bookingMode']
        
        db.session.add(new_booking)
        db.session.commit()
        
        return jsonify({"bookingId": new_booking.booking_id}), 201
    except Exception as e:
        db.session.rollback()
        # for debugging on local terminal
        print("Error creating booking:", e, file=sys.stderr)
        return jsonify({"error": str(e)}), 400

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
