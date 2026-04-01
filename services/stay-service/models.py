import uuid
from datetime import datetime
from db import db

class Stay(db.Model):
    __tablename__ = 'stay'
    __table_args__ = {"schema": "stay_db"}
    
    stay_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    booking_id = db.Column(db.String(36), nullable=False, unique=True)
    guest_id = db.Column(db.String(36), nullable=False)
    host_id = db.Column(db.String(36), nullable=False)
    listing_id = db.Column(db.String(36), nullable=False)
    check_in_date = db.Column(db.Date, nullable=False)
    check_out_date = db.Column(db.Date, nullable=False)
    deposit_txn_id = db.Column(db.String(100))
    deposit_amount = db.Column(db.Numeric(10, 2))
    deposit_status = db.Column(db.Enum('HELD', 'RELEASED', 'CAPTURED', 'RESOLVED', name='deposit_status_enum'), nullable=False, default='HELD')
    checkout_time = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "stayId": self.stay_id,
            "bookingId": self.booking_id,
            "guestId": self.guest_id,
            "hostId": self.host_id,
            "listingId": self.listing_id,
            "checkInDate": self.check_in_date.isoformat() if self.check_in_date else None,
            "checkOutDate": self.check_out_date.isoformat() if self.check_out_date else None,
            "depositTxnId": self.deposit_txn_id,
            "depositAmount": float(self.deposit_amount) if self.deposit_amount is not None else None,
            "depositStatus": self.deposit_status,
            "checkoutTime": self.checkout_time.isoformat() if self.checkout_time else None,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None
        }
