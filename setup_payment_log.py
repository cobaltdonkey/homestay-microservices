import os
import uuid
from sqlalchemy import create_engine, Column, String, Numeric, DateTime, text, MetaData
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

metadata = MetaData(schema="payment_logs_db")
Base = declarative_base(metadata=metadata)

class PaymentLog(Base):
    __tablename__ = 'payment_log'
    log_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    booking_id = Column(String(36), nullable=False)
    
    # Unified transaction IDs
    payment_txn_id = Column(String(100))
    deposit_txn_id = Column(String(100))
    
    transaction_type = Column(String(100), nullable=False) # e.g. "BOOKING_PAYMENT_AUTHORIZE"
    
    # Unified amounts
    amount = Column(Numeric(10, 2))
    deposit_amount = Column(Numeric(10, 2))
    
    status = Column(String(50), nullable=False)
    reason = Column(String(255))
    idempotency_key = Column(String(100), unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)

def setup_db():
    database_url = os.environ.get('PAYMENT_LOGS_DB_URL')
    if not database_url:
        print("Error: PAYMENT_LOGS_DB_URL not found in .env")
        return

    if "postgresql+psycopg2" in database_url:
        database_url = database_url.replace("postgresql+psycopg2", "postgresql")

    engine = create_engine(database_url)
    
    with engine.connect() as conn:
        print("--- CLEANUP & INITIALIZATION ---")
        
        # 1. Drop the old tables
        print("Dropping old tables: 'deposit_hold' and 'payment_transaction'...")
        conn.execute(text("DROP TABLE IF EXISTS payment_logs_db.deposit_hold CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS payment_logs_db.payment_transaction CASCADE"))
        
        # 2. Drop and recreate 'payment_log' to ensure all columns are fresh
        print("Recreating 'payment_log' with full columns...")
        conn.execute(text("DROP TABLE IF EXISTS payment_logs_db.payment_log CASCADE"))
        conn.commit()
        
        # 3. Create fresh table
        Base.metadata.create_all(engine)
        print("SUCCESS: Unified 'payment_log' re-created with full column support.")

if __name__ == "__main__":
    setup_db()
