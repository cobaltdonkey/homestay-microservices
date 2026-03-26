# Homestay Microservices Platform

Airbnb-inspired homestay booking platform built on a microservices architecture.
IS213 Enterprise Solution Development — SMU.

---

## Prerequisites

- Docker Desktop (running)
- Python 3.11 with requests library (`pip install requests`)
- Ports free: `8000`, `5672`, `15672`

---

## Quick Start

```bash
git clone <repo-url>
cd <repo>
docker compose up --build
```

Wait until all containers show as healthy — approximately 2 minutes.

```bash
python seed_data.py
```

Run the unified React frontend for both guest and host workflows:


```bash
cd frontend/lovable-home-haven
npm install
npm run dev
```

Then open the Vite app URL shown in your terminal (defaults to `http://localhost:8080`). Use `/` for the guest experience, `/trips` for booking lookup/history, and `/host` for the host workspace.

---

## Demo IDs

Fill these in after running `seed_data.py`:

| Field            | Value |
|------------------|-------|
| Guest ID         | `___________________________` |
| Host ID          | `___________________________` |
| Instant Listing  | `___________________________` |
| Request Listing  | `___________________________` |
| Alt Listing      | `___________________________` |

---

## Scenario Walkthroughs

### Scenario 1.1 — Instant Booking

1. Open the React app at `/`
2. Search for `Singapore` and choose the Orchard Road listing card
3. Select check-in and check-out dates from the listing detail page
4. Click **Check availability** → should show green success text
5. Continue through guest info + payment
6. Submit the booking → confirmation page shows `CONFIRMED`
7. Check Docker logs for `[DEMO SMS]` confirmation messages

### Scenario 1.2 — Request Booking + Host Approve

1. Guest: same flow but choose the Marina Bay request-booking listing → confirmation shows `PENDING_HOST`
2. Copy the Booking ID
3. Open the React app at `/host`, paste Booking ID, click **Load booking**
4. Click **✓ Approve** → status changes to `CONFIRMED`

### Scenario 2.2 — Host Reject

1. Same as 1.2 up to step 3
2. Click **✗ Reject** instead of Approve
3. Docker logs show `[DEMO SMS]` with alternative listings

### Scenario 3.1.1 — Post-Stay Inspection (Good)

1. Find a `stayId` (from booking logs or `stay_db`)
2. Open the React app at `/host` and use the **Submit inspection** section
3. Enter stayId, select **GOOD**, add notes
4. Click **Submit Inspection**
5. Result shows `action=RELEASE`
6. Docker logs show `[DEMO SMS]` deposit released

### Scenario 3.1.2 — Post-Stay Inspection (Bad)

1. Same as above but select **BAD**
2. Result shows `action=CAPTURE`
3. Docker logs show `[DEMO SMS]` deposit charged

### Scenario 3.2 — Auto-Release (48h no report)

1. Set deposit-expirer sleep to 30s for testing:
   change `time.sleep(300)` to `time.sleep(30)` in `workers/deposit-expirer/expirer.py`
2. Manually set a stay's `checkout_time` to 49 hours ago in MySQL
3. Wait one expirer cycle
4. Docker logs show `[DEP-EXPIRER] Auto-release` triggered

---

## Switching to Live Mode (Final Demo Only)

In `docker-compose.yml`, change:

```yaml
STRIPE_DEMO_MODE: "false"
STRIPE_SECRET_KEY: sk_test_<your-key>
TWILIO_DEMO_MODE: "false"
TWILIO_ACCOUNT_SID: <your-sid>
TWILIO_AUTH_TOKEN: <your-token>
TWILIO_FROM_NUMBER: <your-twilio-number>
```

Then:

```bash
docker compose up --build
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Container exits immediately | `docker compose logs <service-name>` |
| Port 8000 refused | Kong takes ~30s after MySQL/RabbitMQ are ready — wait and retry |
| Table doesn't exist | `docker compose down -v && docker compose up --build` |
| RabbitMQ consumer not receiving | Check `rabbitmq-setup` container exited with code 0. If not: `docker compose restart rabbitmq-setup` |

---

## Architecture

[Brief paragraph — write your own for the report]

See `/docs/api-contracts.md` for all endpoint schemas.
See `/docs/event-schemas.md` for all AMQP event payloads.

---

## Service Registry

| Service | Port | Database |
|---------|------|----------|
| booking-service | 5001 | booking_db |
| deposit-resolution | 5002 | deposit_db |
| users-service | 5003 | user_db |
| listings-service | 5004 | listings_db |
| availability-service | 5005 | availability_db |
| stay-service | 5006 | stay_db |
| inspection-service | 5007 | inspection_db |
| payment-logs-service | 5008 | payment_logs_db |
| listings-search-service | 5009 | search_db |
| payment-gateway-wrapper | 5010 | — |
| notification-gateway | 5011 | notification_db |
| Kong (proxy) | 8000 | — |
| Kong (admin) | 8001 | — |
| RabbitMQ (AMQP) | 5672 | — |
| RabbitMQ (management UI) | 15672 | — |

