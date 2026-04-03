from sqlalchemy import create_engine, text

DB_URL = "postgresql+psycopg2://postgres.sxrxbmiefwwidmewntmi:Homestay123456789%21@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require"

def check_target():
    target_id = '32971136-1adf-47b9-a598-53f05de240ec'
    engine = create_engine(DB_URL)
    with engine.connect() as conn:
        res = conn.execute(text("SELECT hold_id, booking_id, status FROM availability_db.hold WHERE booking_id = :tid"), {"tid": target_id})
        rows = res.fetchall()
        print(f"Holds for {target_id}: {len(rows)}")
        for r in rows:
            print(f"Hold: {r.hold_id} | Status: {r.status}")

        # If not found, let's see why. Maybe the booking_id is NULL?
        res = conn.execute(text("SELECT hold_id, booking_id FROM availability_db.hold WHERE booking_id IS NULL"))
        null_rows = res.fetchall()
        print(f"Holds with NULL booking_id: {len(null_rows)}")

if __name__ == "__main__":
    check_target()
