# Event Booking System

A small full-stack event booking system built for the Wenexus take-home assignment.

- **Backend:** NestJS (TypeScript) + PostgreSQL (TypeORM) + Redis/BullMQ
- **Frontend:** Next.js (React + TypeScript)

## Project layout

```
.
├── backend/          NestJS API + queue worker
├── frontend/          Next.js dashboard
└── docker-compose.yml Postgres + Redis for local dev
```

---

## 1. Prerequisites

- Node.js 18+ and npm
- Docker (for Postgres + Redis) — or your own local Postgres 16 / Redis 7 instances

---

## 2. Start Postgres and Redis

From the repo root:

```bash
docker compose up -d
```

This starts:
- Postgres on `localhost:5432` (db `wenexus`, user/pass `wenexus`/`wenexus`)
- Redis on `localhost:6379`

---

## 3. Backend setup

```bash
cd backend
cp .env.example .env
npm install
npm run migration:run   # creates events & bookings tables
npm run seed             # inserts 3 sample events
npm run start:dev        # http://localhost:3001
```

You should see `Backend listening on http://localhost:3001`.

### Verify it works

```bash
curl http://localhost:3001/events
```

You should get back 3 seeded events with `availableSeats`.

```bash
curl -X POST http://localhost:3001/bookings \
  -H "Content-Type: application/json" \
  -d '{"requestId":"demo-1","eventId":1,"customerName":"Rahim Uddin","customerEmail":"rahim@example.com","seats":2}'
```

You get an immediate `202 Accepted` with a `bookingReference` and `status: PENDING`. A moment later, `GET /bookings` will show it as `CONFIRMED` (processed by the queue worker, which runs in the same Nest process).

Submit the exact same request again (same `requestId`) — you'll get back the **same** booking reference instead of a new booking.

---

## 4. Frontend setup

In a second terminal:

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev              # http://localhost:3000
```

Open http://localhost:3000. You'll see:
- A form to create a new booking (event dropdown, seats, name, email)
- A table of bookings with reference, event, customer, seats, and status
- Filters by event and by status, plus pagination
- The table polls the API every 4 seconds, so a `PENDING` booking will flip to `CONFIRMED`/`FAILED` automatically once the worker processes it

---

## 5. Running tests (bonus)

```bash
cd backend
npm test
```

7 unit tests cover:
- Idempotent booking creation (existing `requestId` returns the same booking, no duplicate created)
- 404 when booking against a non-existent event
- Safe handling of a DB-level unique-constraint race on `requestId`
- The queue worker's overbooking logic: confirms when seats are available, fails cleanly with a reason when not, and safely no-ops if a job is retried after already succeeding

---

## 6. Key design decisions

### Fast response, async processing
`POST /bookings` immediately inserts a `PENDING` booking row and returns `202 Accepted` with a booking reference — it does **not** wait for seat validation. A job (`{ bookingId }`) is pushed onto a BullMQ queue (`bookings`), and a separate worker (`BookingsProcessor`) does the actual seat check and confirmation. This keeps the API responsive even under load, and the queue gives us retries or backoff for transient failures independent of the request/response cycle.

### Preventing overbooking
Each event has an `available_seats` column that is the single source of truth for remaining capacity. The worker processes each job inside **one Postgres transaction** that:
1. `SELECT ... FOR UPDATE` locks the booking row and checks it's still `PENDING` (so a retried job after a crash is a safe no-op, not a double-deduction).
2. `SELECT ... FOR UPDATE` locks the **event** row.
3. Checks `available_seats >= requested seats`.
4. If there's capacity: decrements `available_seats` and marks the booking `CONFIRMED`, in the same transaction.
5. If not: marks the booking `FAILED` with a reason (e.g. "Sold out"), without touching seats.

Because the event row is locked for the duration of the transaction, if two bookings for the same event are being processed concurrently, the second worker blocks on the row lock until the first transaction commits — so it always sees the updated seat count before deciding. This makes "seats never go negative" a database guarantee, not something enforced only in application code (a `CHECK (available_seats >= 0)` constraint would be a reasonable defense-in-depth addition).

### Preventing duplicate bookings
`bookings.request_id` has a **unique index**. On `POST /bookings`, we first look up an existing row for that `requestId` (fast path for legitimate retries/refreshes). If two identical requests race each other and both pass that check, the second `INSERT` fails with Postgres error `23505` (unique violation), which we catch and turn into "return the row that won the race" instead of erroring out. So duplicate prevention is guaranteed at the database level, not just by the initial `findOne` check.

### Database design
- `events`: `id, name, date, total_seats, available_seats, price_cents`
- `bookings`: `id (uuid), request_id (unique), booking_reference (unique), event_id (FK, RESTRICT), customer_name, customer_email, seats, status (enum), failure_reason, created_at, updated_at`
- Indexes on `event_id` and `status` support the `GET /bookings` filters efficiently.
- Migrations are plain TypeORM migration files (`npm run migration:run` / `migration:revert`), not `synchronize: true`, so schema changes are explicit and reproducible.

### Validation
All inputs go through NestJS DTOs (`class-validator`), with a global `ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true })`, so unexpected fields are rejected and types are coerced/validated automatically (e.g. query string `page`/`limit` become numbers).

---

## 7. What I'd improve with more time

- Add a Postgres `CHECK (available_seats >= 0)` constraint as defense-in-depth alongside the transactional locking.
- Move the BullMQ worker into its own process/deployment (currently it runs in the same Nest process as the API for simplicity).
- Add a dead-letter queue / alerting for jobs that exhaust their retries.
- WebSocket or SSE push for booking status updates instead of polling.
- E2E tests against a real Postgres/Redis (e.g. via `testcontainers`) exercising true concurrency (fire N simultaneous bookings against a low-seat event and assert exactly the right number confirm).
- Auth (none is implemented; anyone can call the API).
- Nicer UI/UX (explicitly out of scope per the assignment).
