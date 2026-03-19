import time
import os
import pika

def run_worker():
    print("Starting booking-expirer polling loop...")
    while True:
        try:
            # Poll booking_db
            # If PENDING_HOST and expired -> send booking.expired -> update DB to EXPIRED
            pass
        except Exception as e:
            print(f"Error: {e}")
        time.sleep(60)

if __name__ == "__main__":
    run_worker()
