from datetime import datetime
from db import db

class ListingIndex(db.Model):
    __tablename__ = 'listing_index'

    listing_id = db.Column(db.String(36), primary_key=True)
    host_id = db.Column(db.String(36), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    location = db.Column(db.String(300), nullable=False)
    price_per_night = db.Column(db.Numeric(10, 2), nullable=False)
    booking_mode = db.Column(db.Enum('INSTANT', 'REQUEST', name='booking_modes'), nullable=False)
    availability_status = db.Column(db.Enum('AVAILABLE', 'UNAVAILABLE', name='availability_enum'), nullable=False, default='AVAILABLE')
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "listingId": self.listing_id,
            "hostId": self.host_id,
            "title": self.title,
            "location": self.location,
            "pricePerNight": float(self.price_per_night) if self.price_per_night is not None else None,
            "bookingMode": self.booking_mode,
            "availabilityStatus": self.availability_status,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None
        }
