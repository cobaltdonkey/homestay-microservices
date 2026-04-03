import sys
import os
# Add current directory to path to find app, models, etc.
sys.path.append('.')
from db import db
from models import BookingDetail
from app import create_app

app = create_app()
with app.app_context():
    print("--- Database State ---")
    bookings = BookingDetail.query.order_by(BookingDetail.created_at.desc()).limit(10).all()
    for b in bookings:
        print(f"Booking: {b.booking_id} | Status: {b.status} | Guest: {b.guest_id} | Host: {b.host_id} | Created: {b.created_at}")
    
    pending = BookingDetail.query.filter_by(status='PENDING_HOST').first()
    if pending:
        print(f"\nVALID_PENDING_ID={pending.booking_id}")
    else:
        print("\nNO_PENDING_HOST_FOUND")
