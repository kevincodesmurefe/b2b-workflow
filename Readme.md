# Wholesale & Distribution Management Platform

A multi-tenant B2B REST API for wholesale distribution businesses. A distributor buys products in bulk and supplies shops, restaurants, and other businesses out of multiple warehouses. The system tracks per-warehouse inventory, B2B customer orders through a full lifecycle, invoices, payments, customer credit balances, and deliveries.

> **Status: In development.** This is a learning project built to go from JavaScript to production-grade TypeScript backend engineering. Not yet deployed.

## Why this project exists

This is a follow-up to a previously built [multi-tenant Liquor Store Business Management API](#) (Node.js/Express/JavaScript). This project intentionally goes one level up in complexity to learn:

- **TypeScript** (primary goal — coming from JavaScript)
- **Redis** — caching and rate limiting
- **BullMQ** — background job processing
- **Payment webhooks & idempotency**
- **Order state machines** enforced at both the database and application layer
- **Docker** and **GitHub Actions CI/CD**
- **Zod** for runtime validation
- A proper **services layer architecture**: Route → Controller → Service → Database

## Core workflow

```
Customer places order → confirmed → packed → dispatched → delivered
                                                    ↓
                                     payment recorded → customer ledger updated
```

## Tech stack

| Layer | Technology |
|---|---|
| Language | TypeScript |
| Runtime / Framework | Node.js, Express |
| Database | PostgreSQL |
| Caching / Queues | Redis, BullMQ |
| Validation | Zod |
| Auth | JWT (access + refresh), bcrypt |
| Email | Nodemailer |
| Testing | Vitest, Supertest |
| Containerization | Docker |
| CI/CD | GitHub Actions |

## Architecture

Multi-tenant from the ground up — every tenant-owned table carries a `tenant_id`, and every query is scoped to it. No cross-tenant data access is possible at the query level.

```
src/
├── config/        # env, db pool, third-party client setup
├── controllers/    # HTTP layer — request/response only, no business logic
├── services/        # business logic and orchestration
├── models/           # database queries
├── routes/            # route definitions
├── middleware/         # auth, RBAC, error handling, validation
├── validators/          # Zod schemas
├── types/                # shared TypeScript types
├── jobs/                  # BullMQ job definitions
├── workers/                # BullMQ job processors
└── utils/                    # shared helpers (token generation, etc.)
```

**Roles:** `super_admin`, `business_admin`, `warehouse_manager`, `sales_rep`, `delivery_agent`. Users are provisioned by admins — there is no public self-registration.

## Features

### ✅ Built so far
- Full relational schema — tenants, users, sessions, warehouses, products, inventory, stock movements, inventory transfers, customers, orders, order items, invoices, payments, payment webhook events, customer ledger, deliveries, delivery events — with tenant-scoped composite indexes throughout
- JWT authentication: short-lived access tokens (15 min) + database-backed refresh tokens (7 days) with per-session revocation
- Session rotation with instant invalidation of superseded access tokens (token versioning)
- Role-based access control middleware
- Centralized error handling — custom `AppError` class, JWT error handling, Postgres constraint error mapping (unique violations, foreign key violations)
- Tenant management (CRUD)
- User management (CRUD), with password hashes stripped from every API response
- Self-service password reset flow (request + confirm, one-time hashed tokens, email delivery via Nodemailer)

### 🚧 In progress / planned
- Warehouses, products, per-warehouse inventory
- Transactional inventory transfers between warehouses
- B2B customers with credit limits and balances
- Orders, order items, and the enforced order state machine
- Invoices generated from historical order data
- Payments (cash / mobile money / bank transfer) and idempotent payment webhook processing
- Customer ledger
- Deliveries and delivery tracking
- Redis caching and rate limiting
- BullMQ background jobs (order notifications, low-stock alerts)
- Docker + GitHub Actions CI/CD pipeline

## Getting started

```bash
# Clone and install
git clone <repo-url>
cd wholesale-platform
npm install

# Configure environment
cp .env.example .env
# Fill in DATABASE_URL, JWT secrets, SMTP credentials, etc.

# Run the schema against your Postgres database
psql -d your_database -f schema.sql

# Start the dev server
npm run dev
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled production build |
| `npm run typecheck` | Type-check without emitting files |

## Design notes worth knowing

- **Money** is stored as `NUMERIC`, never floating point.
- **Order line item prices are snapshotted** at order time, not pulled live from the product table — so a later price change never rewrites historical invoices.
- **Payment webhook idempotency** is enforced at two layers: a raw webhook event log keyed on the provider's event ID, plus a unique constraint on payment records — so the same webhook delivered twice is processed once.
- **Admin-initiated password reset** for other users (temporary password issuance) was deliberately deferred past MVP — it doesn't block any other feature, and self-service reset covers the core use case.