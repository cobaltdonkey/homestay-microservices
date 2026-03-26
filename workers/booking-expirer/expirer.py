import os
import time
import requests
from sqlalchemy import create_engine, text

DATABASE_URL = os.environ.get("DATABASE_URL", "")

# Ensure sslmode is in the URL (psycopg2 needs it in the connection string, not connect_args)
if DATABASE_URL and "sslmode" not in DATABASE_URL:
    sep = "&" if "?" in DATABASE_URL else "?"
    DATABASE_URL = f"{DATABASE_URL}{sep}sslmode=require"

BOOKING_SERVICE_URL = os.environ.get("BOOKING_SERVICE_URL", "http://booking-service:5001")


def wait_for_db():
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL is not set")
    print(f"[EXPIRER] Connecting to DB (host: {DATABASE_URL.split('@')[-1].split('/')[0]})", flush=True)
    engine = create_engine(DATABASE_URL)
    for attempt in range(1, 21):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            print("DB ready.", flush=True)
            return engine
        except Exception as e:
            print(f"DB not ready (attempt {attempt}/20): {e}", flush=True)
            time.sleep(5)
    raise Exception("Could not connect to DB after 20 attempts")


def run_cycle(engine):
    with engine.connect() as conn:

        # Cycle 1 — payment timeouts (AWAITING_PAYMENT past due)
        result = conn.execute(text(
            "SELECT booking_id FROM booking "
            "WHERE status='AWAITING_PAYMENT' "
            "AND payment_due_at < CURRENT_TIMESTAMP "
            "LIMIT 100"
        ))
        for row in result.fetchall():
            bid = row[0]
            try:
                r = requests.post(f"{BOOKING_SERVICE_URL}/bookings/{bid}/payment-timeout", timeout=10)
                print(f"[EXPIRER] Payment timeout {bid}: {r.status_code}", flush=True)
            except Exception as e:
                print(f"[EXPIRER] Error for {bid}: {e}", flush=True)

        # Cycle 2 — host response timeouts (PENDING_HOST past due)
        result = conn.execute(text(
            "SELECT booking_id FROM booking "
            "WHERE status='PENDING_HOST' "
            "AND payment_due_at < CURRENT_TIMESTAMP "
            "LIMIT 100"
        ))
        for row in result.fetchall():
            bid = row[0]
            try:
                r = requests.post(f"{BOOKING_SERVICE_URL}/bookings/{bid}/expire", timeout=10)
                print(f"[EXPIRER] Expired {bid}: {r.status_code}", flush=True)
            except Exception as e:
                print(f"[EXPIRER] Error for {bid}: {e}", flush=True)


if __name__ == "__main__":
    engine = wait_for_db()
    print("[EXPIRER] Waiting 30s before first cycle...", flush=True)
    time.sleep(30)
    while True:
        try:
            run_cycle(engine)
        except Exception as e:
            print(f"[EXPIRER] Cycle error: {e}", flush=True)
        time.sleep(60)
