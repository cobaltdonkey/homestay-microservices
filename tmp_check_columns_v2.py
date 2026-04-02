import sqlalchemy
from sqlalchemy import create_engine, text

db_url = "postgresql+psycopg2://postgres.sxrxbmiefwwidmewntmi:Homestay123456789%21@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require"
engine = create_engine(db_url)

with engine.connect() as conn:
    print("Column data in booking_db.booking:")
    res = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'booking_db' AND table_name = 'booking';"))
    for r in res.fetchall():
        print(f"{r[0]}: {r[1]}")
