import uuid
from datetime import datetime
from db import db
from shared.constants import *


class Booking(db.Model):
    __tablename__ = 'booking'
    __table_args__ = {'schema': 'booking'}

    booking_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    guest_id = db.Column(db.String(36), nullable=False)
    host_id = db.Column(db.String(36), nullable=False)
    listing_id = db.Column(db.String(36), nullable=False)
    check_in_date = db.Column(db.Date, nullable=False)
    check_out_date = db.Column(db.Date, nullable=False)
    payment_method_id = db.Column(db.String(100), nullable=False)
    payment_due_at = db.Column(db.DateTime, nullable=True)
    hold_id = db.Column(db.String(36), nullable=True)
    payment_txn_id = db.Column(db.String(100), nullable=True)
    deposit_txn_id = db.Column(db.String(100), nullable=True)
    booking_mode = db.Column(db.String(20), nullable=False)
    status = db.Column(db.String(30), nullable=False, default=BOOKING_STATUS_AWAITING_PAYMENT)
    
    # New fields for My Trips
    listing_title = db.Column(db.String(255), nullable=True)
    listing_image = db.Column(db.Text, nullable=True)
    total_amount = db.Column(db.Numeric(10, 2), nullable=True)
    guests = db.Column(db.Integer, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "bookingId": self.booking_id,
            "guestId": self.guest_id,
            "hostId": self.host_id,
            "listingId": self.listing_id,
            "checkInDate": self.check_in_date.isoformat() if self.check_in_date else None,
            "checkOutDate": self.check_out_date.isoformat() if self.check_out_date else None,
            "paymentMethodId": self.payment_method_id,
            "paymentDueAt": self.payment_due_at.isoformat() if self.payment_due_at else None,
            "holdId": self.hold_id,
            "paymentTxnId": self.payment_txn_id,
            "depositTxnId": self.deposit_txn_id,
            "bookingMode": self.booking_mode,
            "status": self.status,
            "listingTitle": self.listing_title,
            "listingImage": self.listing_image,
            "totalAmount": float(self.total_amount) if self.total_amount is not None else 0,
            "guests": self.guests or 0,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }
