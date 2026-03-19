import time
import os
import pika

def run_worker():
    print("Starting deposit-expirer polling loop...")
    while True:
        try:
            # Poll stay_db
            # No report 48h: Auto RELEASE deposit hold via Deposit Expirer
            pass
        except Exception as e:
            print(f"Error: {e}")
        time.sleep(300)

if __name__ == "__main__":
    run_worker()
