import sqlalchemy
from sqlalchemy import create_engine, text

# URL from .env
db_url = "postgresql+psycopg2://postgres.sxrxbmiefwwidmewntmi:Homestay123456789%21@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require"

engine = create_engine(db_url)
with engine.connect() as conn:
    print("Columns for listings_db.property_details:")
    res = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='listings_db' AND table_name='property_details';"))
    for row in res.fetchall():
        print(row)
        
    print("\nColumns for search_db.listing_index:")
    res2 = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='search_db' AND table_name='listing_index';"))
    for row in res2.fetchall():
        print(row)
