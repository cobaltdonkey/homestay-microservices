import os
import psycopg2
from datetime import date, timedelta

def get_env_var(name):
    # Try environment variables first (in container)
    val = os.environ.get(name)
    if val: return val
    # Fallback to .env file (local host)
    path = ".env"
    if not os.path.exists(path): return None
    with open(path, "r") as f:
        for line in f:
            if line.startswith(f"{name}="):
                return line.strip().split("=", 1)[1].strip().strip('"').strip("'")
    return None

def seed():
    REF = get_env_var("SUPABASE_PROJECT_REF")
    PASS = get_env_var("SUPABASE_DB_PASSWORD")
    if not REF or not PASS:
        print("Error: SUPABASE_PROJECT_REF or SUPABASE_DB_PASSWORD missing.")
        return

    # VERIFIED POOLER CONNECTION (Mumbai)
    host = "aws-1-ap-south-1.pooler.supabase.com"
    port = 6543
    user = f"postgres.{REF}"
    
    print(f"Connecting to verified POOLER: {host}:{port}...")
    try:
        conn = psycopg2.connect(host=host, port=port, user=user, password=PASS, dbname="postgres", sslmode="require")
        cur = conn.cursor()
    except Exception as e:
        print(f"\n[CONNECTION ERROR] {e}")
        return

    print("Success: Connected. Seeding data...")
    
    # 1. USERS
    cur.execute("""
        INSERT INTO user_profile (user_id, name, email, phone_number, role, password) 
        VALUES 
        ('guest-uuid-111', 'Alice Guest', 'alice@demo.com', '+6591234567', 'guest', 'scrypt:32768:8:1$x0AHIwJEZXAhnVgE$fc911469564a24c6b28a26fef1d67a499da5134cedfe416d032b7844345d03807b9c0256321945407f1df4c7d2e5c97b7d770dc83cf6925cb843731b17c8cf8a'),
        ('guest-uuid-112', 'Alice Extra', 'alice2@demo.com', '+6591234568', 'guest', 'scrypt:32768:8:1$x0AHIwJEZXAhnVgE$fc911469564a24c6b28a26fef1d67a499da5134cedfe416d032b7844345d03807b9c0256321945407f1df4c7d2e5c97b7d770dc83cf6925cb843731b17c8cf8a'),
        ('host-uuid-222', 'Bob Host', 'bob@demo.com', '+6598765432', 'host', 'scrypt:32768:8:1$x0AHIwJEZXAhnVgE$fc911469564a24c6b28a26fef1d67a499da5134cedfe416d032b7844345d03807b9c0256321945407f1df4c7d2e5c97b7d770dc83cf6925cb843731b17c8cf8a')
        ON CONFLICT (user_id) DO NOTHING;
    """)
    
    # 2. LISTINGS
    listings = [
        ('1', 'host-uuid-222', 'Stunning Bungalow', 'Sentosa, Singapore', 580.0, 'ACTIVE', 'INSTANT'),
        ('2', 'host-uuid-222', 'Elegant Home', 'Orchard Road, Singapore', 740.0, 'ACTIVE', 'REQUEST'),
        ('3', 'host-uuid-222', 'Charming Flat', 'Tiong Bahru, Singapore', 280.0, 'ACTIVE', 'INSTANT'),
        ('4', 'host-uuid-222', 'Modern Loft', 'Bugis, Singapore', 320.0, 'ACTIVE', 'REQUEST'),
        ('7', 'host-uuid-222', 'Luxurious Penthouse', 'Marina Bay, Singapore', 1200.0, 'ACTIVE', 'INSTANT')
    ]
    for l in listings:
        cur.execute("INSERT INTO property_details (listing_id, host_id, title, location, price_per_night, status, booking_mode) VALUES (%s, %s, %s, %s, %s, %s, %s) ON CONFLICT (listing_id) DO NOTHING;", l)
        cur.execute("INSERT INTO listing_index (listing_id, host_id, title, location, price_per_night, availability_status, booking_mode) VALUES (%s, %s, %s, %s, %s, 'AVAILABLE', %s) ON CONFLICT (listing_id) DO NOTHING;", (l[0], l[1], l[2], l[3], l[4], l[6]))

    # 3. BOOKINGS & RESERVATIONS
    today = date.today()
    cur.execute("INSERT INTO booking (booking_id, guest_id, host_id, listing_id, check_in_date, check_out_date, payment_method_id, payment_txn_id, booking_mode, status) VALUES ('bkg-active-001', 'guest-uuid-111', 'host-uuid-222', '1', %s, %s, 'pm_card_visa', 'txn_001', 'INSTANT', 'CONFIRMED') ON CONFLICT (booking_id) DO NOTHING;", (today, today + timedelta(days=3)))
    cur.execute("INSERT INTO booking (booking_id, guest_id, host_id, listing_id, check_in_date, check_out_date, payment_method_id, booking_mode, status) VALUES ('bkg-pending-002', 'guest-uuid-111', 'host-uuid-222', '2', %s, %s, 'pm_card_visa', 'REQUEST', 'PENDING_HOST') ON CONFLICT (booking_id) DO NOTHING;", (today + timedelta(days=10), today + timedelta(days=15)))
    cur.execute("INSERT INTO reservation (reservation_id, listing_id, booking_id, guest_id, check_in_date, check_out_date) VALUES ('res-001', '1', 'bkg-active-001', 'guest-uuid-111', %s, %s) ON CONFLICT (reservation_id) DO NOTHING;", (today, today + timedelta(days=3)))

    conn.commit()
    cur.close()
    conn.close()
    print("Success: Database seeded.")

if __name__ == "__main__":
    seed()
