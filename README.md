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

Seed the database with verified demo data (listings, users, check-ins):

```bash
# Option A: Run from your host machine (requires python + requests)
python infra/seed_supabase.py

# Option B: Run from within the Docker container (no host dependencies)
docker exec homestay-microservices-listings-service-1 python /app/infra/seed_supabase.py
```

Run the unified React frontend for both guest and host workflows:


```bash
cd frontend/figma-frontend
npm install
npm run dev
```

<<<<<<< HEAD
Then open the Vite app URL shown in your terminal (defaults to `http://localhost:5173`). Use `/` for the guest experience, `/my-trips` for booking lookup/history, and `/host/dashboard` for the host workspace.

---

## Supabase Migration (New)

The project has been migrated to Supabase. Please follow these steps:

1. Create a project at [Supabase](https://supabase.com).
2. Run the SQL script found in `infra/init-db/supabase_init.sql` (includes table creation and permissions).
3. Update `frontend/figma-frontend/.env` with your Supabase URL and Anon Key.
=======
Then open the Vite app URL shown in your terminal (defaults to `http://localhost:5173`). The app provides a integrated experience for both guests (landing page, search, bookings) and hosts (dashboard hub).
>>>>>>> origin/fix/supabase-link

---

## Demo Credentials

The platform is pre-seeded with the following test account:

- **Email**: `alice2@demo.com`
- **Password**: `password123`
- **Role**: `guest`

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
3. Open the React app at `/host/dashboard`, paste Booking ID, click **Load booking**
4. Click **✓ Approve** → status changes to `CONFIRMED`

### Scenario 2.2 — Host Reject

1. Same as 1.2 up to step 3
2. Click **✗ Reject** instead of Approve
3. Docker logs show `[DEMO SMS]` with alternative listings

### Scenario 3.1.1 — Post-Stay Inspection (Good)

1. Find a `stayId` (from booking logs or `stay_db`)
2. Open the React app at `/host/dashboard` and use the **Submit inspection** section
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
2. Manually set a stay's `checkout_time` to 49 hours ago in PostgreSQL
3. Wait one expirer cycle
4. Docker logs show `[DEP-EXPIRER] Auto-release` triggered

---

## Switching to Live Mode (Final Demo Only)

API configuration is handled via the `.env` file in the root directory.

To use your own keys, update `.env`:
- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `STRIPE_DEMO_MODE`: Set to `false` for live calls
- `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN`: Your Twilio credentials
- `TWILIO_DEMO_MODE`: Set to `false` for live SMS

Then restart the stack:

```bash
docker compose up -d
```

---

## Troubleshooting

| Symptom | Fix |
|-------|----------|
| Container exits immediately | `docker compose logs <service-name>` |
| Port 8000 refused | Kong takes ~30s after MySQL/RabbitMQ are ready — wait and retry |
| Table doesn't exist | `docker compose down -v && docker compose up --build` |
| RabbitMQ consumer not receiving | Check `rabbitmq-setup` container exited with code 0. If not: `docker compose restart rabbitmq-setup` |

---

## Architecture

The platform follows a **Microservices Architecture** with a **Shared Database (Supabase PostgreSQL)** and **Event-Driven Notifications (RabbitMQ)**.

- **Kong Gateway**: Handles all incoming API requests (Port 8000), routing to internal services and managing CORS/DNS.
- **Atomic Services**: `users`, `listings`, `stay`, etc. manage individual business domains.
- **Composite Services**: `booking-service` orchestrates complex flows across multiple atomic services.
- **Workers**: `booking-expirer` and `deposit-expirer` handle time-based events (e.g., releasing deposits after 48h).
- **Communication**: Services use synchronous REST for queries and asynchronous RabbitMQ topics for side effects (SMS).

See `/docs/api-contracts.md` for all endpoint schemas.
See `/docs/event-schemas.md` for all AMQP event payloads.

---

## Service Registry

| Service | Port | Database (Supabase) |
|---------|------|---------------------|
| booking-service | 5001 | Shared `postgres` |
| deposit-resolution | 5002 | Shared `postgres` |
| users-service | 5003 | Shared `postgres` |
| listings-service | 5004 | Shared `postgres` |
| availability-service | 5005 | Shared `postgres` |
| stay-service | 5006 | Shared `postgres` |
| inspection-service | 5007 | Shared `postgres` |
| payment-logs-service | 5008 | Shared `postgres` |
| listings-search-service | 5009 | Shared `postgres` |
| payment-gateway-wrapper | 5010 | — |
<<<<<<< HEAD
| notification-gateway | 5011 | notification_db |
| Kong (proxy) | 8000 | — |
| Kong (admin) | 8001 | — |
| RabbitMQ (AMQP) | 5672 | — |
| RabbitMQ (management UI) | 15672 | — |
=======
| notification-gateway | 5011 | Shared `postgres` |
| Kong (API Gateway) | 8000 | — |
| RabbitMQ (Events) | 5672 | — |

>>>>>>> origin/fix/supabase-link
