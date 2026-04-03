import os
import sqlalchemy
from sqlalchemy import create_engine, text

DB_URL = "postgresql+psycopg2://postgres.sxrxbmiefwwidmewntmi:Homestay123456789%21@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require"

def check_hold():
    engine = create_engine(DB_URL)
    with engine.connect() as conn:
        # Check all holds regardless of schema prefix in search_path (just use fully qualified)
        res = conn.execute(text("SELECT hold_id, booking_id, status FROM availability_db.hold"))
        rows = res.fetchall()
        print(f"Total holds: {len(rows)}")
        for r in rows:
            print(f"Hold: {r.hold_id} | Booking: {r.booking_id} | Status: {r.status}")

if __name__ == "__main__":
    check_hold()
