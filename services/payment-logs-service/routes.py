import os
import uuid
from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError
from models import PaymentTransaction, DepositHold
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
    type_ = data.get('type')
    
    if type_ == "PAYMENT":
        booking_id = data.get('bookingId')
        payment_txn_id = data.get('paymentTxnId')
        transaction_type = data.get('transactionType')
        amount = data.get('amount')
        status = data.get('status')
        idempotency_key = data.get('idempotencyKey')
        
        if not all([booking_id, payment_txn_id, transaction_type, amount, status]):
            return jsonify({"code": 400, "data": {}, "message": "Missing required fields for PAYMENT"}), 400
            
        record = PaymentTransaction(
            log_id=str(uuid.uuid4()),
            booking_id=booking_id,
            payment_txn_id=payment_txn_id,
            transaction_type=transaction_type,
            amount=amount,
            status=status,
            idempotency_key=idempotency_key
        )
        
    elif type_ == "DEPOSIT":
        booking_id = data.get('bookingId')
        deposit_txn_id = data.get('depositTxnId')
        transaction_type = data.get('transactionType')
        deposit_amount = data.get('depositAmount')
        status = data.get('status')
        reason = data.get('reason')
        idempotency_key = data.get('idempotencyKey')
        
        if not all([booking_id, deposit_txn_id, transaction_type, deposit_amount, status]):
            return jsonify({"code": 400, "data": {}, "message": "Missing required fields for DEPOSIT"}), 400
            
        record = DepositHold(
            log_id=str(uuid.uuid4()),
            booking_id=booking_id,
            deposit_txn_id=deposit_txn_id,
            transaction_type=transaction_type,
            deposit_amount=deposit_amount,
            status=status,
            reason=reason,
            idempotency_key=idempotency_key
        )
    else:
        return jsonify({"code": 400, "data": {}, "message": "Invalid type, must be PAYMENT or DEPOSIT"}), 400

    try:
        db.session.add(record)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"code": 409, "data": {}, "message": "Idempotency key already exists (duplicate request)"}), 409
    except Exception as e:
        db.session.rollback()
        return jsonify({"code": 500, "data": {}, "message": str(e)}), 500

    return jsonify({
        "code": 201,
        "data": record.to_dict(),
        "message": f"{type_} log created successfully"
    }), 201
