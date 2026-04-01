import uuid
from datetime import datetime
from db import db
from sqlalchemy import Numeric, String, Date, DateTime

class BookingDetail(db.Model):
    __tablename__ = 'booking'
    __table_args__ = {'schema': 'booking_db', 'extend_existing': True}

    booking_id = db.Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    status = db.Column(String(30))
    payment_txn_id = db.Column(String(100))
    deposit_txn_id = db.Column(String(100))
    booking_amount = db.Column(Numeric(10, 2))
    deposit_amount = db.Column(Numeric(10, 2))
    
    # Existing fields that might be non-nullable in the DB table
    guest_id = db.Column(String(36), default="dummy-guest", nullable=True)
    host_id = db.Column(String(36), default="dummy-host", nullable=True)
    listing_id = db.Column(String(36), default="dummy-listing", nullable=True)
    check_in_date = db.Column(Date, default=datetime.utcnow().date, nullable=True)
    check_out_date = db.Column(Date, default=datetime.utcnow().date, nullable=True)
    payment_method_id = db.Column(String(100), default="dummy-method", nullable=True)
    booking_mode = db.Column(String(20), default="instant", nullable=True)
    listing_title = db.Column(String(255), nullable=True)
    listing_image = db.Column(String(500), nullable=True)
    total_amount = db.Column(Numeric(10, 2), nullable=True)
    guests = db.Column(db.Integer, nullable=True)
    created_at = db.Column(DateTime, default=datetime.utcnow)
    updated_at = db.Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
