import uuid
from datetime import datetime
from db import db

class PropertyDetails(db.Model):
    __tablename__ = 'property_details'
    __table_args__ = {"schema": "listings_db"}
    
    listing_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    host_id = db.Column(db.String(36), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    location = db.Column(db.String(300), nullable=False)
    price_per_night = db.Column(db.Numeric(10, 2), nullable=False)
    status = db.Column(db.Enum('ACTIVE', 'INACTIVE', 'SUSPENDED', name='listing_statuses'), nullable=False, default='ACTIVE')
    booking_mode = db.Column(db.Enum('INSTANT', 'REQUEST', name='booking_modes'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "listingId": self.listing_id,
            "hostId": self.host_id,
            "title": self.title,
            "location": self.location,
            "pricePerNight": float(self.price_per_night) if self.price_per_night is not None else None,
            "status": self.status,
            "bookingMode": self.booking_mode,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None
        }
