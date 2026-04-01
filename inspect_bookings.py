import sqlalchemy
from sqlalchemy import create_engine, text

# URL from .env
db_url = "postgresql+psycopg2://postgres.sxrxbmiefwwidmewntmi:Homestay123456789%21@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require"

engine = create_engine(db_url)
with engine.connect() as conn:
    print("ALL Rows in booking.booking:")
    res = conn.execute(text("SELECT * FROM booking.booking;"))
    cols = res.keys()
    for row in res.fetchall():
        print(dict(zip(cols, row)))
