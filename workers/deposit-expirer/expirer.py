import os
import time
import requests
from sqlalchemy import create_engine, text

DATABASE_URL = os.environ.get("DATABASE_URL")
DEPOSIT_RESOLUTION_URL = os.environ.get("DEPOSIT_RESOLUTION_URL", "http://deposit-resolution:5002")
INSPECTION_SERVICE_URL = os.environ.get("INSPECTION_SERVICE_URL", "http://inspection-service:5007")


def wait_for_db():
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
        result = conn.execute(text(
            "SELECT stay_id FROM stay "
            "WHERE deposit_status = 'HELD' "
            "AND checkout_time + INTERVAL '48 hours' < CURRENT_TIMESTAMP "
            "LIMIT 50"
        ))
        rows = result.fetchall()
        for row in rows:
            sid = row[0]
            try:
                # Check if inspection report already exists
                r = requests.get(
                    f"{INSPECTION_SERVICE_URL}/inspections/by-stay/{sid}",
                    timeout=10)
                if r.status_code == 200:
                    print(f"[DEP-EXPIRER] Inspection exists for {sid}, skipping.", flush=True)
                    continue

                # No report filed — trigger auto-release
                r = requests.post(
                    f"{DEPOSIT_RESOLUTION_URL}/deposit-resolutions/{sid}/auto-release",
                    timeout=10)
                print(f"[DEP-EXPIRER] Auto-release {sid}: {r.status_code}", flush=True)
            except Exception as e:
                print(f"[DEP-EXPIRER] Error for {sid}: {e}", flush=True)


if __name__ == "__main__":
    engine = wait_for_db()
    print("[DEP-EXPIRER] Waiting 45s before first cycle...", flush=True)
    time.sleep(45)
    while True:
        try:
            run_cycle(engine)
        except Exception as e:
            print(f"[DEP-EXPIRER] Cycle error: {e}", flush=True)
        time.sleep(300)
