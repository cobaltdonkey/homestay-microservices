import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load connection string from .env if available
load_dotenv('../../.env') 
DATABASE_URL = os.environ.get('AVAILABILITY_DB_URL')

if not DATABASE_URL:
    print("[ERROR] AVAILABILITY_DB_URL not found in environment.")
    exit(1)

# Clean up URL for SQLAlchemy if needed
if "postgresql://" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://")

print(f"[INFO] Connecting to database...")
engine = create_engine(DATABASE_URL)

sql = "ALTER TABLE availability_db.hold ALTER COLUMN ttl_seconds DROP NOT NULL;"

try:
    with engine.connect() as conn:
        print(f"[INFO] Running migration: {sql}")
        conn.execute(text(sql))
        conn.commit()
        print("[SUCCESS] Migration completed successfully. 'ttl_seconds' is now nullable.")
        
        # Verification query
        verify_sql = """
            SELECT column_name, is_nullable 
            FROM information_schema.columns 
            WHERE table_schema = 'availability_db' 
              AND table_name = 'hold' 
              AND column_name = 'ttl_seconds';
        """
        result = conn.execute(text(verify_sql)).fetchone()
        if result:
            print(f"[VERIFY] Column: {result[0]}, Is Nullable: {result[1]}")
except Exception as e:
    print(f"[ERROR] Migration failed: {e}")
    exit(1)
