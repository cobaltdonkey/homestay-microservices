import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def check_db():
    urls = {
        "booking_db": os.environ.get("BOOKING_DB_URL"),
        "availability_db": os.environ.get("AVAILABILITY_DB_URL"),
        "payment_logs_db": os.environ.get("PAYMENT_LOGS_DB_URL")
    }
    
    for name, url in urls.items():
        print(f"--- Checking {name} ---")
        try:
            # Strip +psycopg2 if present
            clean_url = url.replace("+psycopg2", "")
            conn = psycopg2.connect(clean_url)
            cur = conn.cursor()
            
            if name == "booking_db":
                cur.execute("SELECT booking_id, status FROM booking.booking ORDER BY created_at DESC LIMIT 5;")
                rows = cur.fetchall()
                for row in rows:
                    print(f"Booking: {row[0]} | Status: {row[1]}")
            
            elif name == "availability_db":
                cur.execute("SELECT hold_id, booking_id, status FROM availability_db.hold LIMIT 5;")
                rows = cur.fetchall()
                for row in rows:
                    print(f"Hold: {row[0]} | Booking: {row[1]} | Status: {row[2]}")
            
            elif name == "payment_logs_db":
                cur.execute("SELECT log_id, booking_id, transaction_type, status FROM payment_logs_db.payment_log ORDER BY created_at DESC LIMIT 5;")
                rows = cur.fetchall()
                for row in rows:
                    print(f"Log: {row[0]} | Booking: {row[1]} | Type: {row[2]} | Status: {row[3]}")
            
            cur.close()
            conn.close()
        except Exception as e:
            print(f"Error checking {name}: {e}")

if __name__ == "__main__":
    check_db()
