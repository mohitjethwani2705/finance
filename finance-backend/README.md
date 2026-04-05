# Finance Data Processing and Access Control Backend

A RESTful API backend for a multi-role finance dashboard system. Built with Node.js, Express, and SQLite.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Runtime | Node.js + Express | Lightweight, great middleware composability for RBAC |
| Database | SQLite via `sqlite` + `sqlite3` | Zero-config file-based DB — good fit for this scope |
| Auth | JWT (access) + opaque refresh tokens | Stateless access + revocable sessions |
| Validation | `express-validator` | Declarative, per-field error messages |
| Security | `helmet`, `cors`, `express-rate-limit` | Standard Express security hardening |

---

## Project Structure

```
finance-backend/
├── src/
│   ├── config/
│   │   ├── database.js          # SQLite connection, schema init, WAL mode
│   │   └── constants.js         # Roles, enums, pagination limits
│   ├── middleware/
│   │   ├── auth.js              # JWT verification → sets req.user
│   │   ├── rbac.js              # authorize(...roles) factory
│   │   └── errorHandler.js      # Global error → consistent JSON response
│   ├── modules/
│   │   ├── auth/                # register, login, refresh, logout, me
│   │   ├── users/               # list, get, update, delete (admin-managed)
│   │   ├── records/             # financial records CRUD + filtering
│   │   └── dashboard/           # aggregated analytics endpoints
│   ├── validators/              # Input validation rules per module
│   ├── utils/
│   │   ├── ApiError.js          # Operational error class (statusCode + message)
│   │   ├── ApiResponse.js       # Consistent response envelope
│   │   └── asyncHandler.js      # Wraps async controllers, forwards errors to next()
│   └── app.js                   # Express setup: middleware, routes, 404 handler
├── db/
│   ├── schema.sql               # All CREATE TABLE + index statements
│   └── seed.js                  # Creates 3 test users + 25 sample records
├── data/                        # SQLite .db file (auto-created on first run)
├── .env.example
└── server.js                    # Entry point
```

Each module follows the same layered structure:
- **Routes** — maps HTTP verb + path to controller, applies auth/rbac middleware
- **Controller** — parses request, calls service, sends response
- **Service** — all business logic and database access

This separation ensures business rules are testable independently of HTTP concerns.

---

## Setup

### 1. Clone and install
```bash
cd finance-backend
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Defaults work out of the box for local dev
```

### 3. Seed test data (recommended)
```bash
npm run seed
```

### 4. Start the server
```bash
npm run dev    # development with auto-reload
npm start      # production
```

Server: `http://localhost:3000`  
Health check: `http://localhost:3000/health`

---

## Test Credentials (after seeding)

| Email | Password | Role | Permissions |
|---|---|---|---|
| admin@example.com | Admin123! | admin | Full access |
| analyst@example.com | Analyst123! | analyst | Read + write records |
| viewer@example.com | Viewer123! | viewer | Read only |

---

## Database Schema

### `users`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | Auto-increment |
| name | TEXT | Display name |
| email | TEXT UNIQUE | Login identifier |
| password | TEXT | bcrypt hash (12 rounds) |
| role | TEXT | `viewer` / `analyst` / `admin` |
| is_active | INTEGER | 1 = active, 0 = deactivated |
| created_at | TEXT | ISO 8601 timestamp |
| updated_at | TEXT | ISO 8601 timestamp |

### `financial_records`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | Auto-increment |
| title | TEXT | Short description |
| amount | REAL | Must be > 0 |
| type | TEXT | `income` or `expense` |
| category | TEXT | e.g. Salary, Rent, Utilities |
| date | TEXT | ISO 8601 date (YYYY-MM-DD) |
| description | TEXT | Optional long-form notes |
| created_by | INTEGER FK | References users.id |
| created_at | TEXT | ISO 8601 timestamp |
| updated_at | TEXT | ISO 8601 timestamp |

### `refresh_tokens`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| user_id | INTEGER FK | References users.id (CASCADE DELETE) |
| token | TEXT UNIQUE | Random 64-byte hex string |
| expires_at | TEXT | 7 days from issuance |

**Indexes:** `date`, `type`, `category`, `created_by` on financial_records for fast filtering.

---

## API Reference

### Response Envelope

All responses follow this shape:

**Success:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Records retrieved successfully.",
  "data": [...],
  "pagination": { "total": 25, "page": 1, "limit": 20, "totalPages": 2 }
}
```

**Error:**
```json
{
  "success": false,
  "statusCode": 422,
  "message": "Validation failed",
  "errors": [{ "field": "amount", "message": "Amount must be a positive number" }]
}
```

---

### Auth — `/api/auth`

#### `POST /api/auth/register`
Create a new account. Default role is `viewer`.

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Password123!"
}
```
Password rules: min 8 chars, 1 uppercase, 1 number.

---

#### `POST /api/auth/login`
Returns a short-lived access token (15 min) and a refresh token (7 days).

```json
{ "email": "admin@example.com", "password": "Admin123!" }
```

Response:
```json
{
  "data": {
    "user": { "id": 1, "name": "Alice Admin", "role": "admin" },
    "accessToken": "eyJ...",
    "refreshToken": "abc123..."
  }
}
```

---

#### `POST /api/auth/refresh`
Exchange a refresh token for a new access token. Old refresh token is invalidated (rotation).

```json
{ "refreshToken": "abc123..." }
```

---

#### `POST /api/auth/logout`
Invalidates the provided refresh token server-side.

```json
{ "refreshToken": "abc123..." }
```

---

#### `GET /api/auth/me` 🔒
Returns the authenticated user's profile.

---

### Users — `/api/users` 🔒

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/api/users` | admin | List all users (paginated) |
| GET | `/api/users/:id` | admin or self | Get a single user |
| PATCH | `/api/users/:id` | admin | Update name, role, or is_active |
| DELETE | `/api/users/:id` | admin | Delete a user |

**PATCH body** (all fields optional):
```json
{ "name": "New Name", "role": "analyst", "is_active": false }
```

---

### Financial Records — `/api/records` 🔒

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/api/records` | viewer+ | List with filters and pagination |
| GET | `/api/records/:id` | viewer+ | Get one record |
| POST | `/api/records` | analyst+ | Create a record |
| PUT | `/api/records/:id` | analyst+ | Update a record |
| DELETE | `/api/records/:id` | admin | Delete a record |

#### Filter & Pagination Query Params

| Param | Example | Description |
|---|---|---|
| `type` | `income` | Filter by type |
| `category` | `Rent` | Partial category match |
| `startDate` | `2026-01-01` | Records on or after |
| `endDate` | `2026-03-31` | Records on or before |
| `minAmount` | `100` | Min amount |
| `maxAmount` | `5000` | Max amount |
| `search` | `salary` | Search title, description, category |
| `page` | `1` | Page number (default: 1) |
| `limit` | `20` | Items per page (default: 20, max: 100) |
| `sortBy` | `amount` | `date` / `amount` / `category` / `title` |
| `sortOrder` | `asc` | `asc` or `desc` (default: `desc`) |

#### POST /api/records body
```json
{
  "title": "April Salary",
  "amount": 5200,
  "type": "income",
  "category": "Salary",
  "date": "2026-04-01",
  "description": "April paycheck"
}
```

---

### Dashboard — `/api/dashboard` 🔒

All roles can view dashboard data.

| Endpoint | Description |
|---|---|
| `GET /api/dashboard/summary` | Total income, expenses, net balance, record count |
| `GET /api/dashboard/trends?period=monthly` | Income/expense by month or week (last 12 periods) |
| `GET /api/dashboard/categories` | Totals broken down by category and type |
| `GET /api/dashboard/recent?limit=5` | Most recent N records |
| `GET /api/dashboard/top-categories?limit=5` | Top N categories by total amount |

**Summary response:**
```json
{
  "data": {
    "total_income": 19700,
    "total_expenses": 9525,
    "net_balance": 10175,
    "total_records": 25
  }
}
```

**Trends response:**
```json
{
  "data": [
    { "period": "2026-01", "income": 6700, "expenses": 2900, "net": 3800 },
    { "period": "2026-02", "income": 5800, "expenses": 3165, "net": 2635 }
  ]
}
```

---

## Access Control Matrix

| Action | Viewer | Analyst | Admin |
|---|---|---|---|
| Register / Login | Public | Public | Public |
| View own profile | ✓ | ✓ | ✓ |
| List all users | — | — | ✓ |
| Update user roles / status | — | — | ✓ |
| Delete users | — | — | ✓ |
| View financial records | ✓ | ✓ | ✓ |
| Create / update records | — | ✓ | ✓ |
| Delete records | — | — | ✓ |
| View dashboard | ✓ | ✓ | ✓ |

Access control is enforced through two middleware layers:
1. `authenticate` — verifies JWT, checks user exists and is active
2. `authorize(...roles)` — checks the user's role against the allowlist

---

## HTTP Status Codes

| Code | When used |
|---|---|
| 200 | Successful GET, PATCH, DELETE, logout |
| 201 | Resource created (POST) |
| 400 | Bad request (no fields to update, self-delete) |
| 401 | Missing, expired, or invalid token |
| 403 | Authenticated but insufficient role |
| 404 | Resource not found |
| 409 | Conflict (duplicate email) |
| 422 | Validation failed — includes per-field errors |
| 429 | Rate limit exceeded (100 req/15 min per IP) |
| 500 | Unexpected server error |

---

## Assumptions & Design Decisions

1. **Default role is `viewer`** — least-privilege principle. Admins explicitly promote users.
2. **Refresh token rotation** — each `/auth/refresh` call invalidates the previous token and issues a new one. This limits the window of exposure if a token is leaked.
3. **Records are not soft-deleted** — hard delete keeps the schema simple. A `deleted_at` column could be added later with minimal changes to the service layer.
4. **`created_by` is set on creation and never changed** — it's an audit trail, not an ownership/permission field. Any analyst or admin can edit any record.
5. **Flat role system** — roles are: viewer < analyst < admin. No per-record ownership or team scoping, which would require a more complex permission model.
6. **SQLite is sufficient here** — the project uses WAL mode for better concurrency. Migrating to Postgres would only require swapping the DB driver calls in the service layer; all business logic stays the same.
7. **Rate limiting** — 100 requests per 15-minute window per IP, configurable via `.env`.
8. **Sort field is allowlisted** — the `sortBy` query parameter is validated against a fixed list before being interpolated into SQL, preventing SQL injection.
9. **Passwords are hashed with bcrypt** — 12 rounds by default. Lower to 10 in `.env` for faster seeding in development.

## Tradeoffs

- **SQLite vs Postgres**: SQLite is simpler to set up but doesn't support concurrent writes well at scale. For this assignment, it's a reasonable choice.
- **In-memory token blacklist vs DB tokens**: Refresh tokens are stored in the database. This adds a DB lookup per refresh but enables server-side logout and token revocation.
- **No soft delete**: Simpler code, but deleted records can't be recovered. Acceptable for an assessment project.
