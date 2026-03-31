# Homestay Microservices Platform

Airbnb-inspired homestay booking platform built on a microservices architecture.
IS213 Enterprise Solution Development — SMU.

---

## Prerequisites

- Docker Desktop (running)
- Node.js 18+ and npm (for the frontend)
- Ports free: `8000`, `8001`, `5672`, `15672`

---

## Environment Setup

All backend configuration lives in the root `.env` file. The frontend reads its own `frontend/figma-frontend/.env`.

### 1. Root `.env` (backend + workers)

The `.env` file is pre-filled with a shared Supabase project for demo use. To point to your own Supabase project, update the following fields:

```env
SUPABASE_PROJECT_REF=<your-project-ref>
SUPABASE_DB_HOST=<your-pooler-host>
SUPABASE_DB_PASSWORD=<your-db-password>
```

All `*_DB_URL` variables below are derived from these values. You do not need to edit them individually unless you have a custom setup.

Key toggles:

| Variable | Default | Description |
|---|---|---|
| `STRIPE_DEMO_MODE` | `false` | Set to `true` to skip live Stripe calls |
| `TWILIO_DEMO_MODE` | `false` | Set to `true` to print SMS to Docker logs instead |

### 2. Frontend `.env`

```bash
cp frontend/figma-frontend/.env.example frontend/figma-frontend/.env
```

The example file is pre-filled with the demo Supabase project's public anon key. Update `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` if using your own project.

### 3. Supabase database initialisation

If using a fresh Supabase project, run the SQL script to create all tables:

1. Open your Supabase project → **SQL Editor**
2. Paste and run `infra/init-db/supabase_init.sql`

---

## Quick Start

```bash
git clone <repo-url>
cd <repo>
docker compose up --build
```

Wait until all containers are healthy — approximately 2–3 minutes. Kong and RabbitMQ will be the last to become ready.

### Seed demo data

```bash
# Option A: from your host machine
python infra/seed_supabase.py

# Option B: from inside a running container (no local Python needed)
docker exec homestay-microservices-listings-service-1 python /app/infra/seed_supabase.py
```

### Start the frontend

```bash
cd frontend/figma-frontend
npm install
npm run dev
```

Open the URL shown in your terminal (defaults to `http://localhost:5173`).

The Vite dev server proxies all API calls (`/users`, `/listings`, `/search`, `/availability`, `/bookings`, `/gateway`, `/stays`, `/notifications`) to Kong on port 8000 — no extra configuration needed.

---

## Demo Credentials

| Field | Value |
|---|---|
| Email | `alice2@demo.com` |
| Password | `password123` |
| Role | Guest |

---

## Frontend Routes

| Route | Description |
|---|---|
| `/` | Landing page — browse and search listings |
| `/search` | Search results |
| `/listing/:id` | Listing detail + date selection |
| `/booking/confirm-and-pay/:id` | Instant booking checkout |
| `/booking/confirmed/:id` | Booking confirmation |
| `/booking/authorise-and-request/:id` | Request-to-book checkout |
| `/booking/request-sent/:id` | Request submitted confirmation |
| `/booking/declined` | Booking rejected page |
| `/booking/expired` | Booking expired page |
| `/my-trips` | Guest — booking history |
| `/host/dashboard` | Host — approve/reject pending bookings, submit inspections |
| `/host/active-stays` | Host — current active stays |
| `/host/active-listings` | Host — manage listings |
| `/host/upcoming-guests` | Host — confirmed upcoming bookings |
| `/host/rejected-bookings` | Host — rejected booking history |
| `/host/past-stays` | Host — completed stays |

---

## Scenario Walkthroughs

### Scenario 1.1 — Instant Booking

1. Open `/`
2. Search for `Singapore` and choose the **Orchard Road** listing card
3. Select check-in and check-out dates from the listing detail page
4. Click **Check availability** → should show green success text
5. Continue through guest info + payment
6. Submit the booking → confirmation page shows `CONFIRMED`
7. Check Docker logs for `[DEMO SMS]` confirmation messages (if `TWILIO_DEMO_MODE=true`)

### Scenario 1.2 — Request Booking + Host Approve

1. Guest: same flow but choose the **Marina Bay** listing → confirmation shows `PENDING_HOST`
2. Copy the Booking ID shown on the confirmation page
3. Open `/host/dashboard`, paste the Booking ID, click **Load booking**
4. Click **✓ Approve** → status changes to `CONFIRMED`

### Scenario 2.2 — Host Reject

1. Follow Scenario 1.2 up to step 3
2. Click **✗ Reject** instead of Approve
3. Docker logs show `[DEMO SMS]` with alternative listing suggestions

### Scenario 3.1.1 — Post-Stay Inspection (Good)

1. Find a `stayId` from booking logs or the `stays` table in Supabase
2. Open `/host/dashboard` and use the **Submit inspection** section
3. Enter the `stayId`, select **GOOD**, add notes
4. Click **Submit Inspection** → result shows `action=RELEASE`
5. Docker logs show `[DEMO SMS]` deposit released

### Scenario 3.1.2 — Post-Stay Inspection (Bad)

1. Same as above but select **BAD**
2. Result shows `action=CAPTURE`
3. Docker logs show `[DEMO SMS]` deposit charged

### Scenario 3.2 — Auto-Release (48h no report)

1. For testing, change `time.sleep(300)` → `time.sleep(30)` in `workers/deposit-expirer/expirer.py`
2. In Supabase, manually set a stay's `checkout_time` to 49 hours ago
3. Wait one expirer cycle
4. Docker logs show `[DEP-EXPIRER] Auto-release` triggered

---

## Architecture

The platform follows a **Microservices Architecture** backed by a **Shared Supabase PostgreSQL** database and **Event-Driven Notifications** via RabbitMQ.

- **Kong Gateway** (port 8000): Routes all inbound API requests, handles CORS and internal DNS resolution.
- **Atomic Services**: `users`, `listings`, `availability`, `stay`, `inspection`, `payment-logs`, `listings-search` — each owns a set of domain tables.
- **Composite Services**: `booking-service` orchestrates multi-service booking flows; `deposit-resolution` resolves deposit capture/release.
- **Wrapper Services**: `payment-gateway-wrapper` (Stripe), `notification-gateway` (Twilio/SMS).
- **Workers**: `booking-expirer` expires stale pending requests; `deposit-expirer` auto-releases deposits after 48 h with no inspection report.
- **Communication**: Synchronous REST for queries; asynchronous RabbitMQ topics for side effects (SMS notifications).

See `infra/kong.yml` for the full routing configuration.

---

## Service Registry

| Service | Internal Port | Database |
|---|---|---|
| booking-service | 5001 | Supabase `postgres` |
| deposit-resolution | 5002 | Supabase `postgres` |
| users-service | 5003 | Supabase `postgres` |
| listings-service | 5004 | Supabase `postgres` |
| availability-service | 5005 | Supabase `postgres` |
| stay-service | 5006 | Supabase `postgres` |
| inspection-service | 5007 | Supabase `postgres` |
| payment-logs-service | 5008 | Supabase `postgres` |
| listings-search-service | 5009 | Supabase `postgres` |
| payment-gateway-wrapper | 5010 | — |
| notification-gateway | 5011 | Supabase `postgres` |
| Kong (proxy) | 8000 | — |
| Kong (admin) | 8001 | — |
| RabbitMQ (AMQP) | 5672 | — |
| RabbitMQ (management UI) | 15672 | — |

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Container exits immediately | `docker compose logs <service-name>` |
| Port 8000 refused | Kong takes ~30 s after RabbitMQ is ready — wait and retry |
| Table doesn't exist | `docker compose down -v && docker compose up --build`, then re-run the seed script |
| RabbitMQ consumer not receiving | Check that `rabbitmq-setup` exited with code 0; if not: `docker compose restart rabbitmq-setup` |
| Supabase connection refused | Confirm `SUPABASE_DB_PASSWORD` in `.env` is correct and the project is not paused |
| Frontend shows no listings | Ensure the seed script has run and Kong is healthy; check browser console for proxy errors |
