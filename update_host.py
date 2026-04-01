"""
update_host.py
Updates all listings in listings_db.property_details and search_db.listing_index
to be owned by LA VAN (host_id = b15f973c-d174-41b6-95d1-9be0095db62c).
"""

import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

LA_VAN_HOST_ID = "b15f973c-d174-41b6-95d1-9be0095db62c"

# Build connection string from .env
DB_URL = os.environ.get("LISTINGS_DB_URL") or os.environ.get("SEARCH_DB_URL")

def get_conn():
    return psycopg2.connect(
        host=os.environ.get("SUPABASE_DB_HOST"),
        port=int(os.environ.get("SUPABASE_DB_PORT", 6543)),
        dbname=os.environ.get("SUPABASE_DB_NAME", "postgres"),
        user=os.environ.get("SUPABASE_DB_USER"),
        password=os.environ.get("SUPABASE_DB_PASSWORD"),
        sslmode="require"
    )

def update_all_listings():
    conn = get_conn()
    cur = conn.cursor()

    # 1. Update listings_db.property_details
    cur.execute(
        "UPDATE listings_db.property_details SET host_id = %s",
        (LA_VAN_HOST_ID,)
    )
    listings_updated = cur.rowcount
    print(f"[listings_db] Updated {listings_updated} rows in property_details.")

    # 2. Update search_db.listing_index
    cur.execute(
        "UPDATE search_db.listing_index SET host_id = %s",
        (LA_VAN_HOST_ID,)
    )
    search_updated = cur.rowcount
    print(f"[search_db] Updated {search_updated} rows in listing_index.")

    conn.commit()
    cur.close()
    conn.close()
    print(f"\nDone! All listings now owned by LA VAN ({LA_VAN_HOST_ID}).")

if __name__ == "__main__":
    update_all_listings()
