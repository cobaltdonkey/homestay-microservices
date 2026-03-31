"""
demo_flow.py — Automated Demo Flow for Homestay Platform

Usage:
  python demo_flow.py --guest <guestId> --listing <instantListingId>

Get IDs from: python infra/seed_supabase.py
"""

import requests
import argparse
import time
import sys

API_BASE  = "http://localhost:8000"
CHECK_IN  = "2025-12-01"
CHECK_OUT = "2025-12-04"


def step(label, fn):
    start = time.time()
    try:
        result  = fn()
        elapsed = round(time.time() - start, 2)
        print(f"✓ [{elapsed}s] {label}")
        return result
    except Exception as e:
        print(f"✗ {label} — ERROR: {e}")
        sys.exit(1)


def run_demo(guest_id, listing_id):
    print("\n=== SCENARIO 1.1: INSTANT BOOKING DEMO ===\n")
    demo_start = time.time()

    booking_id = None

    # S1: Check availability (expect True)
    def s1():
        r = requests.get(f"{API_BASE}/availability",
            params={"listingId": listing_id,
                    "checkInDate": CHECK_IN,
                    "checkOutDate": CHECK_OUT})
        assert r.json()["data"]["available"] == True, \
            f"Expected available=True, got: {r.json()}"
        return r.json()["data"]

    step("Check availability — expect True", s1)

    # S2: Initiate instant booking
    def s2():
        nonlocal booking_id
        r = requests.post(f"{API_BASE}/bookings/initiate",
            json={"listingId": listing_id,
                  "guestId": guest_id,
                  "checkInDate": CHECK_IN,
                  "checkOutDate": CHECK_OUT,
                  "paymentMethodId": "pm_card_visa",
                  "bookingMode": "INSTANT"})
        assert r.status_code == 201, \
            f"Expected 201, got {r.status_code}: {r.text}"
        data = r.json()["data"]
        booking_id = data["bookingId"]
        print(f"  → Booking ID: {booking_id}")
        print(f"  → Status: {data['status']}")
        return data

    step("Initiate instant booking", s2)

    # S3: Check availability again (expect False)
    def s3():
        r = requests.get(f"{API_BASE}/availability",
            params={"listingId": listing_id,
                    "checkInDate": CHECK_IN,
                    "checkOutDate": CHECK_OUT})
        assert r.json()["data"]["available"] == False, \
            f"Expected available=False, got: {r.json()}"
        return r.json()["data"]

    step("Check availability — expect False (dates now held)", s3)

    # S4: Verify booking status
    def s4():
        r = requests.get(f"{API_BASE}/bookings/{booking_id}")
        data = r.json()["data"]
        assert data["status"] == "CONFIRMED", \
            f"Expected CONFIRMED, got: {data['status']}"
        return data

    step("Verify booking status is CONFIRMED", s4)

    # S5: Stay record hint
    def s5():
        print(f"  → Check stay_db manually for stay record")
        print(f"  → Or query GET /stays/by-booking/{booking_id} "
              "if endpoint exists")
        return None

    step("Locate stay record (manual step)", s5)

    # S6: Skip auto-inspection (stayId required)
    def s6():
        print("  → Skipping auto-inspection: "
              "stayId required from stay_db")
        print("  → Use the React host workspace at /host to submit inspection manually")
        return None

    step("Post-stay inspection (manual via /host workspace)", s6)

    # Summary
    total = round(time.time() - demo_start, 2)
    print(f"\n=== DEMO COMPLETE in {total}s ===")
    print(f"  Booking ID: {booking_id}")
    print(f"  Final status: CONFIRMED")
    print(f"  Next: open the React host workspace at /host to submit inspection for the stay")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Run the instant booking demo flow end-to-end.")
    parser.add_argument("--guest",   required=True,
        help="Guest user ID (from infra/seed_supabase.py output)")
    parser.add_argument("--listing", required=True,
        help="Instant listing ID (from infra/seed_supabase.py output)")
    args = parser.parse_args()

    run_demo(args.guest, args.listing)
