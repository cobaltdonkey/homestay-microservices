# Homestay Microservices Platform

Airbnb-inspired homestay booking platform built on a microservices architecture.
IS213 Enterprise Solution Development — SMU.

**For Evaluators:** API keys and credentials are provided in a separate `credentials.txt` file submitted alongside this project. Copy the values from that file into the root `.env` and `frontend/figma-frontend/.env` before starting.
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
SUPABASE_PROJECT_REF=your_project_ref
SUPABASE_DB_HOST=your_host
SUPABASE_DB_PORT=6543
SUPABASE_DB_PORT_DIRECT=5432
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=your_user
SUPABASE_DB_PASSWORD=your_password
SUPABASE_URL=your_supabase_url

BOOKING_DB_URL=your_booking_db_url
DEPOSIT_DB_URL=your_deposit_db_url
USER_DB_URL=your_user_db_url
LISTINGS_DB_URL=your_listings_db_url
AVAILABILITY_DB_URL=your_availability_db_url
STAY_DB_URL=your_stay_db_url
INSPECTION_DB_URL=your_inspection_db_url
PAYMENT_LOGS_DB_URL=your_payment_logs_db_url
SEARCH_DB_URL=your_search_db_url
NOTIFICATION_DB_URL=your_notification_db_url

VITE_SUPABASE_URL=your_public_supabase_url
VITE_SUPABASE_ANON_KEY=your_public_anon_key

BOOKING_EXPIRER_DB_URL=your_booking_expirer_db_url
DEPOSIT_EXPIRER_DB_URL=your_deposit_expirer_db_url

RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/

STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_DEMO_MODE=false

TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_FROM_NUMBER=your_twilio_from_number
TWILIO_DEMO_MODE=false

```

All `*_DB_URL` variables below are derived from these values. You do not need to edit them individually unless you have a custom setup.

Key toggles:

| Variable | Default | Description |
|---|---|---|
| `STRIPE_DEMO_MODE` | `false` | Set to `true` to skip live Stripe calls |
| `TWILIO_DEMO_MODE` | `false` | Set to `true` to print SMS to Docker logs instead |

### 2. Frontend `.env`

```env
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
VITE_STRIPE_PUBLISHABLE_KEY=your_key
```

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

This step is only needed for a fresh Supabase project or if the demo data is missing from your database.

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

### Guest Testing Account

Register/login for a new account, or use the following credentials:

- Email: `alice2@demo.com`
- Password: `password123`

### Host role account

- Email: `kelsey.la31@gmail.com`
- Password: `123`

### User Testing Account

To facilitate system testing and demonstration, a test user Gmail account has been created for evaluators:

- Email: `testsmu560@gmail.com`
- Password: `SMUESD123!`

This account can be used to access the system and simulate user interactions across the booking and deposit resolution workflows for Stripe and Supabase.

#### Stripe account

- Email: `testsmu560@gmail.com`
- Password: `SMUESD123!`

#### Supabase account

- Email: `testsmu560@gmail.com`
- Password: `SMUESD123!x`

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
| `/host/declined/:id` | Host — confirmation page for rejected booking |

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
4. Click **✓ Approve** → status changes to `CONFIRMED`. Behind the scenes, `approve-booking-service` orchestrates payment capture and stay creation.

### Scenario 2.2 — Host Reject

1. Follow Scenario 1.2 up to step 3
2. Click **✗ Reject** instead of Approve
3. User is redirected to `/host/declined/:id` and booking status becomes `REJECTED`.
4. Docker logs show `[DEMO SMS]` with alternative listing suggestions.

### Scenario 3.1.1 — Post-Stay Inspection (Good)

1. Find a `stayId` from booking logs or the `stays` table in Supabase
2. Open `/host/dashboard` and use the **Submit inspection** section
3. Enter the `stayId`, select **GOOD**, add notes
4. Click **Submit Inspection** → result shows `action=RELEASE`
5. Docker logs show `[DEMO SMS]` deposit released (Reason: `HOST_REPORT`)

### Scenario 3.1.2 — Post-Stay Inspection (Bad)

1. Same as above but select **BAD**
2. Result shows `action=CAPTURE`
3. Docker logs show `[DEMO SMS]` deposit charged (Reason: `DAMAGE`)

### Scenario 3.2 — Auto-Release (48h no report)

1. For testing, change `time.sleep(300)` → `time.sleep(30)` in `workers/deposit-expirer/expirer.py`
2. In Supabase, manually set a stay's `checkout_time` to 49 hours ago
3. Wait one expirer cycle
4. Docker logs show `[DEP-EXPIRER] Auto-release` triggered (Reason: `NO_RESPONSE_AUTO_RELEASE`)

---

## Architecture

The platform follows a **Microservices Architecture** backed by a **Shared Supabase PostgreSQL** database and **Event-Driven Notifications** via RabbitMQ.

```mermaid
graph TD
    User((User/Guest))
    Host((Host))
    Frontend[Frontend React App]
    Kong[Kong API Gateway :8000]

    subgraph "Orchestration Layer"
        BookingSvc[Booking Service :5001]
        ApproveSvc[Approve Booking :5013]
        RejectSvc[Reject Booking :5014]
        DepRes[Deposit Resolution :5002]
    end

    subgraph "Domain & Data Services"
        UserSvc[Users Service :5003]
        ListingSvc[Listings Service :5004]
        AvailSvc[Availability Service :5005]
        StaySvc[Stay Service :5006]
        InspSvc[Inspection Service :5007]
        PayLogSvc[Payment Logs :5008]
        BookDetailSvc[Booking Detail :5012]
        SearchSvc[Listings Search :5009]
    end

    subgraph "Wrappers & External"
        PayGW[Payment Gateway :5010]
        NotifGW[Notification Gateway :5011]
        Stripe((Stripe API))
        Twilio((Twilio API))
    end

    subgraph "Event Bus & Workers"
        RMQ[(RabbitMQ)]
        BookExp[Booking Expirer]
        DepExp[Deposit Expirer]
    end

    User --> Frontend
    Host --> Frontend
    Frontend --> Kong
    Kong --> BookingSvc
    Kong -- "/approve" --> ApproveSvc
    Kong -- "/reject" --> RejectSvc
    Kong -- "/deposit-resolutions" --> DepRes
    Kong -- "/search" --> SearchSvc
    Kong -- "/listings" --> ListingSvc
    Kong -- "/users" --> UserSvc

    BookingSvc --> BookDetailSvc
    BookingSvc --> AvailSvc
    BookingSvc --> PayGW
    BookingSvc --> UserSvc

    ApproveSvc --> AvailSvc
    ApproveSvc --> PayGW
    ApproveSvc --> StaySvc
    ApproveSvc --> UserSvc

    RejectSvc --> AvailSvc
    RejectSvc --> PayGW
    RejectSvc --> UserSvc
    RejectSvc --> BookDetailSvc

    DepRes --> StaySvc
    DepRes --> InspSvc
    DepRes --> PayGW
    DepRes --> UserSvc
    DepRes --> BookDetailSvc
    DepRes --> PayLogSvc

    BookingSvc -.-> RMQ
    ApproveSvc -.-> RMQ
    RejectSvc -.-> RMQ
    DepRes -.-> RMQ
    RMQ -.-> NotifGW
    NotifGW --> Twilio
    PayGW --> Stripe

    BookExp --> BookingSvc
    BookExp --> RejectSvc
    DepExp --> DepRes
```

- **Kong Gateway** (port 8000): Routes all inbound API requests, handles CORS and internal DNS resolution.
- **Orchestrators**: `booking-service` handles initial booking; `approve-booking-service` / `reject-booking-service` handle host actions; `deposit-resolution` manages post-stay finances.
- **Domain Services**: `users`, `listings`, `availability`, `stay`, `inspection`, `payment-logs`, `listings-search`, `booking-detail` — each owns a set of domain tables.
- **Wrapper Services**: `payment-gateway-wrapper` (Stripe), `notification-gateway` (Twilio/SMS).
- **Workers**: `booking-expirer` (cancels stale requests); `deposit-expirer` (auto-releases deposits).
- **Communication**: Synchronous REST for queries; asynchronous RabbitMQ topics for side effects (SMS).

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
| booking-detail-service | 5012 | Supabase `postgres` |
| approve-booking-service | 5013 | — |
| reject-booking-service | 5014 | — |
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
| Twilio SMS not received | Trial accounts can only send to the verified number. Use `TWILIO_DEMO_MODE=true` and check `docker compose logs -f notification-gateway` instead |
