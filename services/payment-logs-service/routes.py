import os
import uuid
from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError
from models import PaymentLog
from db import db
from shared.constants import *

main = Blueprint('main', __name__)

@main.route('/health', methods=['GET'])
def health():
    return jsonify({
        "code": 200,
        "data": {
            "status": "ok",
            "service": os.environ.get('SERVICE_NAME', 'payment-logs-service')
        },
        "message": "success"
    }), 200

@main.route('/', methods=['POST'])
@main.route('/payment-logs', methods=['POST'])
def create_payment_log():
    data = request.json or {}
    
    booking_id = data.get('bookingId')
    txn_id = data.get('txnId') or data.get('paymentTxnId') or data.get('depositTxnId')
    log_type = data.get('logType') or data.get('type')
    amount = data.get('amount') or data.get('bookingAmount') or data.get('depositAmount')
    status = data.get('status')
    idempotency_key = data.get('idempotencyKey')
    
    if not all([booking_id, txn_id, log_type, amount, status]):
        return jsonify({
            "code": 400, 
            "data": {}, 
            "message": "Missing required fields (bookingId, txnId, logType, amount, status)"
        }), 400
        
    record = PaymentLog(
        log_id=str(uuid.uuid4()),
        booking_id=booking_id,
        txn_id=txn_id,
        log_type=log_type,
        amount=amount,
        status=status,
        idempotency_key=idempotency_key
    )
    
    try:
        db.session.add(record)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"code": 409, "data": {}, "message": "Idempotency key already exists"}), 409
    except Exception as e:
        db.session.rollback()
        return jsonify({"code": 500, "data": {}, "message": str(e)}), 500

    return jsonify({
        "code": 201,
        "data": record.to_dict(),
        "message": f"Payment log created successfully"
    }), 201

# Add common GET for easy debugging in Supabase
@main.route('/bookings/<booking_id>', methods=['GET'])
def get_logs_by_booking(booking_id):
    records = PaymentLog.query.filter_by(booking_id=booking_id).all()
    return jsonify({
        "code": 200,
        "data": [r.to_dict() for r in records],
        "message": "success"
    }), 200
