from datetime import datetime
from db import db

class ListingIndex(db.Model):
    __tablename__ = 'property_details'
    __table_args__ = {"schema": "listings_db"}

    listing_id = db.Column(db.String(36), primary_key=True)
    host_id = db.Column(db.String(36), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    location = db.Column(db.String(300), nullable=False)
    region = db.Column(db.String(50), nullable=False)
    price_per_night = db.Column(db.Numeric(10, 2), nullable=False)
    image_url = db.Column(db.Text)
    status = db.Column(db.String(20), nullable=False, default='ACTIVE')
    booking_mode = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "listingId": self.listing_id,
            "hostId": self.host_id,
            "title": self.title,
            "location": self.location,
            "region": self.region,
            "pricePerNight": float(self.price_per_night) if self.price_per_night is not None else None,
            "imageUrl": self.image_url,
            "bookingMode": self.booking_mode,
            "status": self.status,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None
        }
