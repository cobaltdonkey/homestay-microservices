import uuid
from datetime import datetime
from db import db

class Hold(db.Model):
    __tablename__ = 'hold'
    __table_args__ = {'schema': 'availability_db'}

    hold_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    listing_id = db.Column(db.String(36), nullable=False)
    booking_id = db.Column(db.String(36))
    guest_id = db.Column(db.String(36), nullable=False)
    check_in_date = db.Column(db.Date, nullable=False)
    check_out_date = db.Column(db.Date, nullable=False)
    ttl_seconds = db.Column(db.Integer, nullable=False, default=900)
    expires_at = db.Column(db.DateTime, nullable=False)
    reason = db.Column(db.String(100))
    status = db.Column(db.Enum('HELD', 'PENDING_HOST', 'EXPIRED', 'CONFIRMED', 'RELEASED', name='status_enum'), nullable=False, default='HELD')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "holdId": self.hold_id,
            "listingId": self.listing_id,
            "bookingId": self.booking_id,
            "guestId": self.guest_id,
            "checkInDate": self.check_in_date.isoformat() if self.check_in_date else None,
            "checkOutDate": self.check_out_date.isoformat() if self.check_out_date else None,
            "ttlSeconds": self.ttl_seconds,
            "expiresAt": self.expires_at.isoformat() if self.expires_at else None,
            "reason": self.reason,
            "status": self.status,
            "createdAt": self.created_at.isoformat() if self.created_at else None
        }

class Reservation(db.Model):
    __tablename__ = 'reservation'
    __table_args__ = {'schema': 'availability_db'}

    reservation_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    listing_id = db.Column(db.String(36), nullable=False)
    booking_id = db.Column(db.String(36), nullable=False)
    guest_id = db.Column(db.String(36), nullable=False)
    check_in_date = db.Column(db.Date, nullable=False)
    check_out_date = db.Column(db.Date, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "reservationId": self.reservation_id,
            "listingId": self.listing_id,
            "bookingId": self.booking_id,
            "guestId": self.guest_id,
            "checkInDate": self.check_in_date.isoformat() if self.check_in_date else None,
            "checkOutDate": self.check_out_date.isoformat() if self.check_out_date else None,
            "createdAt": self.created_at.isoformat() if self.created_at else None
        }
