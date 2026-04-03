from sqlalchemy import create_engine, text

DB_URL = "postgresql+psycopg2://postgres.sxrxbmiefwwidmewntmi:Homestay123456789%21@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require"

def check_target_full():
    target_id = '32971136-1adf-47b9-a598-53f05de240ec'
    engine = create_engine(DB_URL)
    with engine.connect() as conn:
        res = conn.execute(text("SELECT listing_id, check_in_date, check_out_date FROM booking.booking WHERE booking_id = :tid"), {"tid": target_id})
        booking = res.fetchone()
        if booking:
            print(f"Booking: {booking}")
            # Find a hold that matches these dates and listing
            res = conn.execute(text("SELECT hold_id, booking_id FROM availability_db.hold WHERE listing_id = :lid AND check_in_date = :ci AND check_out_date = :co"), 
                               {"lid": booking.listing_id, "ci": booking.check_in_date, "co": booking.check_out_date})
            hold = res.fetchone()
            if hold:
                print(f"Matching Hold Found: {hold.hold_id} | Currently linked to: {hold.booking_id}")
                if hold.booking_id is None:
                    print("Linking it now...")
                    conn.execute(text("UPDATE availability_db.hold SET booking_id = :tid WHERE hold_id = :hid"), {"tid": target_id, "hid": hold.hold_id})
                    conn.commit()
                    print("Linked!")
            else:
                print("No matching hold found by dates/listing.")
        else:
            print("Booking record not found.")

if __name__ == "__main__":
    check_target_full()
