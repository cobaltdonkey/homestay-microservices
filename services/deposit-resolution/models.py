import uuid
from datetime import datetime
from db import db
from shared.constants import *


class DepositResolution(db.Model):
    __tablename__ = 'deposit_resolution'
    __table_args__ = {"schema": "deposit_db"}

    resolution_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    stay_id = db.Column(db.String(36), nullable=False)
    guest_id = db.Column(db.String(36), nullable=False)
    host_id = db.Column(db.String(36), nullable=False)
    deposit_txn_id = db.Column(db.String(100), nullable=True)
    amount = db.Column(db.Numeric(10, 2), nullable=True)
    action = db.Column(db.String(20), nullable=False)
    reason = db.Column(db.String(30), nullable=False)
    status = db.Column(db.String(20), nullable=False, default='RESOLVED')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "resolutionId": self.resolution_id,
            "stayId": self.stay_id,
            "guestId": self.guest_id,
            "hostId": self.host_id,
            "depositTxnId": self.deposit_txn_id,
            "amount": float(self.amount) if self.amount is not None else None,
            "action": self.action,
            "reason": self.reason,
            "status": self.status,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }
