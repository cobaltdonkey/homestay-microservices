import sqlalchemy
from sqlalchemy import create_engine, text

# Supabase Connection URL
db_url = "postgresql+psycopg2://postgres.sxrxbmiefwwidmewntmi:Homestay123456789%21@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require"

engine = create_engine(db_url)

def reset_data():
    with engine.connect() as conn:
        print("--- SUPABASE CLEANUP STARTED ---")
        
        # 1. Clear Booking Details (My Trips)
        print("Deleting all trip history from booking.booking...")
        conn.execute(text("TRUNCATE TABLE booking.booking CASCADE;"))
        
        # 2. Clear Availability Holds & Reservations
        print("Releasing all calendar holds from availability_db.hold...")
        conn.execute(text("TRUNCATE TABLE availability_db.hold CASCADE;"))
        print("Deleting all reservations from availability_db.reservation...")
        conn.execute(text("TRUNCATE TABLE availability_db.reservation CASCADE;"))
        
        # 3. Clear Stays
        print("Resetting stay service records in stay_db.stay...")
        conn.execute(text("TRUNCATE TABLE stay_db.stay CASCADE;"))
        
        conn.execute(text("COMMIT;"))
        print("--- SUPABASE CLEANUP SUCCESSFUL ---")

if __name__ == "__main__":
    try:
        reset_data()
    except Exception as e:
        print(f"FAILED: {e}")
