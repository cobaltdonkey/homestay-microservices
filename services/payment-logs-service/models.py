import uuid
from datetime import datetime
from db import db

class PaymentTransaction(db.Model):
    __tablename__ = 'payment_transaction'
    
    log_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    booking_id = db.Column(db.String(36), nullable=False)
    payment_txn_id = db.Column(db.String(100), nullable=False)
    transaction_type = db.Column(db.String(50), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    status = db.Column(db.Enum('AUTHORIZED', 'CAPTURED', 'FAILED', 'VOIDED', name='payment_status_enum'), nullable=False)
    idempotency_key = db.Column(db.String(100), unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "logId": self.log_id,
            "bookingId": self.booking_id,
            "paymentTxnId": self.payment_txn_id,
            "transactionType": self.transaction_type,
            "amount": float(self.amount) if self.amount is not None else None,
            "status": self.status,
            "idempotencyKey": self.idempotency_key,
            "createdAt": self.created_at.isoformat() if self.created_at else None
        }

class DepositHold(db.Model):
    __tablename__ = 'deposit_hold'
    
    log_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    booking_id = db.Column(db.String(36), nullable=False)
    deposit_txn_id = db.Column(db.String(100), nullable=False)
    transaction_type = db.Column(db.String(50), nullable=False)
    deposit_amount = db.Column(db.Numeric(10, 2), nullable=False)
    status = db.Column(db.Enum('PREAUTHORIZED', 'RELEASED', 'CAPTURED', name='deposit_status_enum'), nullable=False)
    reason = db.Column(db.String(100))
    idempotency_key = db.Column(db.String(100), unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "logId": self.log_id,
            "bookingId": self.booking_id,
            "depositTxnId": self.deposit_txn_id,
            "transactionType": self.transaction_type,
            "depositAmount": float(self.deposit_amount) if self.deposit_amount is not None else None,
            "status": self.status,
            "reason": self.reason,
            "idempotencyKey": self.idempotency_key,
            "createdAt": self.created_at.isoformat() if self.created_at else None
        }
