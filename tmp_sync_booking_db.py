import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def sync_schema():
    db_url = os.environ.get('BOOKING_DB_URL')
    if not db_url:
        print("Error: BOOKING_DB_URL not found in .env")
        return

    # Convert SQLAlchemy URL to psycopg2 DSN
    # Handles: postgresql+psycopg2://user:pass@host:port/db
    dsn = db_url.replace("postgresql+psycopg2://", "postgresql://")
    
    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = True
        cur = conn.cursor()
        
        columns_to_add = [
            ("listing_title", "VARCHAR(255)"),
            ("listing_image", "VARCHAR(500)"),
            ("total_amount", "NUMERIC(10, 2)"),
            ("guests", "INTEGER"),
            ("payment_due_at", "TIMESTAMP")
        ]
        
        for col_name, col_type in columns_to_add:
            try:
                cur.execute(f"ALTER TABLE booking_db.booking ADD COLUMN {col_name} {col_type};")
                print(f"Added column: {col_name}")
            except psycopg2.Error as e:
                if "already exists" in str(e):
                    print(f"Column {col_name} already exists, skipping.")
                    conn.rollback()
                else:
                    print(f"Error adding {col_name}: {e}")
                    conn.rollback()
        
        cur.close()
        conn.close()
        print("Schema sync completed.")
        
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    sync_schema()
