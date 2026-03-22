"""
seed_data.py — Homestay Platform Demo Seed Script

Usage:
  python seed_data.py           # seed fresh data
  python seed_data.py --reset   # reset then seed
                                # (requires ALLOW_RESET=true on each service)
"""

import requests
import sys
import json
import argparse

API_BASE = "http://localhost:8000"


def seed_all():
    print("\n[SEED] Starting seed...\n")

    # Step 1 — Create guest user
    r = requests.post(f"{API_BASE}/users",
        json={"name": "Alice Tan", "email": "alice@demo.com",
              "phoneNumber": "+6591234567", "role": "guest"})
    r.raise_for_status()
    guest_id = r.json()["data"]["userId"]
    print(f"Guest ID: {guest_id}")

    # Step 2 — Create host user
    r = requests.post(f"{API_BASE}/users",
        json={"name": "Bob Lim", "email": "bob@demo.com",
              "phoneNumber": "+6598765432", "role": "host"})
    r.raise_for_status()
    host_id = r.json()["data"]["userId"]
    print(f"Host ID: {host_id}")

    # Step 3 — Create 3 listings
    listings_to_create = [
        {"title": "Cozy Studio in Orchard",
         "location": "Orchard Road, Singapore",
         "pricePerNight": 150.00, "bookingMode": "INSTANT"},
        {"title": "Modern Condo in Marina Bay",
         "location": "Marina Bay, Singapore",
         "pricePerNight": 250.00, "bookingMode": "REQUEST"},
        {"title": "Charming Room in Tiong Bahru",
         "location": "Tiong Bahru, Singapore",
         "pricePerNight": 100.00, "bookingMode": "INSTANT"},
    ]

    listing_ids = []
    for l in listings_to_create:
        l["hostId"] = host_id
        r = requests.post(f"{API_BASE}/listings", json=l)
        r.raise_for_status()
        lid = r.json()["data"]["listingId"]
        listing_ids.append(lid)
        print(f"Listing '{l['title']}': {lid}")

    # Step 4 — Index listings in search
    for i, lid in enumerate(listing_ids):
        l = listings_to_create[i]
        r = requests.post(f"{API_BASE}/search/listings/index",
            json={"listingId": lid, "hostId": host_id,
                  "title": l["title"], "location": l["location"],
                  "pricePerNight": l["pricePerNight"],
                  "bookingMode": l["bookingMode"]})
        r.raise_for_status()

    # Step 5 — Print summary
    print("\n=== SEED COMPLETE ===")
    print(f"Guest ID:           {guest_id}")
    print(f"Host ID:            {host_id}")
    print(f"Instant Listing ID: {listing_ids[0]}")
    print(f"Request Listing ID: {listing_ids[1]}")
    print(f"Alt Listing ID:     {listing_ids[2]}")
    print("\nUse these IDs in the React frontend routes `/`, `/trips`, and `/host`.")
    print(f"Host workspace reads the host from booking/stay data automatically (seeded host: {host_id})")


def reset_all():
    """
    Calls DELETE /all on each atomic service to wipe all rows.
    Requires ALLOW_RESET=true to be set on each service.
    This is a destructive operation — use only in dev/demo environments.
    """
    print("\n[RESET] WARNING: This will delete all data from all services.")
    print("[RESET] Requires ALLOW_RESET=true environment variable on each service.")
    confirm = input("[RESET] Type 'yes' to confirm: ").strip().lower()
    if confirm != "yes":
        print("[RESET] Aborted.")
        sys.exit(0)

    services = [
        ("users",         f"{API_BASE}/users/all"),
        ("listings",      f"{API_BASE}/listings/all"),
        ("availability",  f"{API_BASE}/availability/all"),
        ("stays",         f"{API_BASE}/stays/all"),
        ("inspections",   f"{API_BASE}/inspections/all"),
        ("payment-logs",  f"{API_BASE}/payment-logs/all"),
        ("search",        f"{API_BASE}/search/listings/all"),
    ]

    for name, url in services:
        try:
            r = requests.delete(url, timeout=10)
            print(f"[RESET] {name}: HTTP {r.status_code}")
        except Exception as e:
            print(f"[RESET] {name}: ERROR — {e}")

    print("[RESET] Done.\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Seed demo data for the Homestay microservices platform.")
    parser.add_argument("--reset", action="store_true",
        help="Wipe existing data before seeding (requires ALLOW_RESET=true on services)")
    args = parser.parse_args()

    if args.reset:
        reset_all()

    seed_all()
