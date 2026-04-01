import uuid
from datetime import datetime
from db import db

class PaymentLog(db.Model):
    __table_args__ = {"schema": "payment_logs_db"}
    __tablename__ = 'payment_log'
    
    log_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    booking_id = db.Column(db.String(36), nullable=False)
    
    # Financial IDs
    payment_txn_id = db.Column(db.String(100))
    deposit_txn_id = db.Column(db.String(100))
    
    transaction_type = db.Column(db.String(100), nullable=False)
    
    # Financial Amounts
    amount = db.Column(db.Numeric(10, 2))
    deposit_amount = db.Column(db.Numeric(10, 2))
    
    status = db.Column(db.String(50), nullable=False)
    reason = db.Column(db.String(255))
    idempotency_key = db.Column(db.String(100), unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "logId": self.log_id,
            "bookingId": self.booking_id,
            "paymentTxnId": self.payment_txn_id,
            "depositTxnId": self.deposit_txn_id,
            "transactionType": self.transaction_type,
            "amount": float(self.amount) if self.amount is not None else None,
            "depositAmount": float(self.deposit_amount) if self.deposit_amount is not None else None,
            "status": self.status,
            "reason": self.reason,
            "idempotencyKey": self.idempotency_key,
            "createdAt": self.created_at.isoformat() if self.created_at else None
        }
