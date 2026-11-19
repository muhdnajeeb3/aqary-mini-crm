# AQARY Mini CRM

A configurable Mini CRM built for the AQARY engineering candidate assignment. Administrators can configure dynamic lead forms, while Admin and Agent users can create, view and edit leads using the saved form schema.

## Technology Stack

- Next.js App Router (16)
- React 19
- Strict TypeScript
- Tailwind CSS 4
- TanStack Query
- Next.js Route Handlers
- Prisma + SQLite
- jose + bcryptjs (sessions and password hashing)
- @dnd-kit (form builder reordering)
- Zod (schema validation)
- Vitest + Testing Library

## Prerequisites

- **Node.js 20+** (`package.json` engines: `>=20`)
- **pnpm 12.21.0** (pinned through `packageManager`)
- No paid cloud services required

### Activate pnpm using Corepack

With Node.js 20+ installed, run:

```bash
corepack enable
corepack prepare pnpm@12.21.0 --activate
pnpm -v
```

## Application Root

Run all commands from the **application root**: the directory containing `package.json` and the `prisma/` folder.

If the application is nested inside a monorepo, navigate to that package first. If the repository root is the Mini CRM application, stay at the repository root.

## Fresh Setup

A fresh clone does not include `prisma/dev.db`, because the database file is gitignored. Prisma migrations create the SQLite database during initialization.

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Configure the following variables in `.env`:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | SQLite database path relative to `prisma/` (default: `file:./dev.db`) |
| `SESSION_SECRET` | Secret used to sign sessions; minimum 32 characters |

The example `SESSION_SECRET` is sufficient for local setup. Generate a unique secret for any shared or deployed environment:

```bash
openssl rand -base64 48
```

Never commit `.env` or real secrets.

### 3. Generate Prisma Client

```bash
pnpm db:generate
```

### 4. Create the database and apply migrations

```bash
pnpm db:migrate:deploy
```

### 5. Seed demo data

```bash
pnpm db:seed
```

This creates the Admin and Agent demo accounts, the default form definition and 24 demo leads across the four statuses.

### 6. Start the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

If port 3000 is already in use, Next.js will print the next available port.

## Demo Accounts

Both accounts use the password shown below.

| Role | Email | Password |
|---|---|---|
| Admin | `admin@aqary.demo` | `AqaryDemo!2026` |
| Agent | `agent@aqary.demo` | `AqaryDemo!2026` |

Authentication uses an HTTP-only cookie (`aqary_session`) signed with jose using HS256, with a seven-day expiry.

Role permissions are enforced on the server. There is no client-side role selector.

## Destructive Commands

The following commands are not intended for normal setup:

- **`pnpm db:reset`** — destructive. Runs Prisma migrate reset, drops existing data, reapplies migrations and runs the seed. Do not use for routine setup.
- **`pnpm db:migrate`** — runs interactive `prisma migrate dev`. For fresh reviewer setup and CI, use `pnpm db:migrate:deploy` instead.

## Quality Checks

Run these commands after database initialization:

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm lint
```

To start the production build locally:

```bash
pnpm start
```

## Test Database Isolation

Tests use a separate SQLite database so they do not modify the development database.

- `pnpm test` does not use `prisma/dev.db`.
- Vitest global setup applies migrations and seed data to `prisma/test.db`.
- The test database URL is `DATABASE_URL=file:./test.db`.
- Test setup forces this URL, preventing a developer `.env` configuration from redirecting tests to the development database.
- API tests can modify test data, including form versions and temporary leads. These changes remain isolated from the development database.
- `prisma/test.db` is gitignored and recreated/reseeded at the start of each test run.

## API Overview

All mutating routes require a same-origin `Origin` or `Referer` matching the request `Host`, providing CSRF protection alongside SameSite=Lax cookies.

| Method | Path | Authentication | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Sign in and set session cookie |
| `POST` | `/api/auth/logout` | Public (CSRF check) | Clear session |
| `GET` | `/api/auth/me` | Session | Return current user |
| `GET` | `/api/form-config` | Admin or Agent | Read saved form schema and version |
| `PUT` | `/api/form-config` | Admin only | Save schema and increment version; Agent receives 403 |
| `GET` | `/api/leads` | Session | List leads with search, status, page and pageSize parameters, plus matching total |
| `POST` | `/api/leads` | Session | Create a lead using values keyed by stable field IDs |
| `GET` | `/api/leads/[id]` | Session | Fetch one lead |
| `PATCH` | `/api/leads/[id]` | Session | Update a lead |

Validation errors return HTTP 400 with field details keyed by stable field ID where applicable.

Other relevant responses include:

- `401` — missing or invalid authentication
- `403` — insufficient permissions
- `404` — requested lead not found

## Architecture Overview

```text
app/                 App Router pages and Route Handlers
components/          UI components: shell, leads, dynamic form, form builder
hooks/               TanStack Query hooks
modules/
  auth/              Login, sessions and permission guards
  form-schema/       Types, defaults, visibility, validation and builder helpers
  leads/             Lead operations, mappers and DTOs
lib/                 Prisma client, API client, CSRF and HTTP helpers
prisma/              Database schema, migrations and seed
tests/               Vitest unit, API and UI tests
```

### Data Storage

- **Core lead fields:** `name`, `email`, `status` and `budget` are stored as columns on the `Lead` table.
- **Custom fields:** Stored in `Lead.customValues` as JSON.
- **Form definition:** A singleton `FormDefinition` record stores the saved schema and its monotonically increasing version.

Shared validation and visibility helpers (`validateFormConfig`, `validateLeadValues` and `isFieldVisible`) are used across the application to keep form behavior consistent.

## Key Design Decisions

1. **Stable field IDs:** Labels and field order can change without losing historical values because values are associated with stable IDs.
2. **Draft vs saved schema:** Form Builder edits a local draft. Preview uses the draft, while Save persists the configuration through `PUT /api/form-config`.
3. **Conditional visibility:** Hidden required fields do not block client-side or server-side submission.
4. **Core field protection:** Name, Email, Status and Budget cannot be removed or have their types or IDs changed. Status options remain New, Contacted, Qualified and Lost.
5. **Role permissions:** Admin can manage form configuration. Agent can manage leads and read the schema but cannot access the builder or save schema changes. Server-side permission checks enforce these restrictions.
6. **Prisma 6 + SQLite:** Provides a locally runnable database without external cloud dependencies.
7. **Isolated test database:** Vitest uses `prisma/test.db`, keeping automated tests separate from the development database.

## Known Limitations

- No registration, password reset, file uploads, external CRM synchronization or hosted deployment.
- Conditional visibility is limited to the assignment requirement: show a field when a dropdown equals a selected option. It is not a general workflow engine.
- Concurrent Admin schema saves use last-write-wins behavior; optimistic locking is not implemented.
- Search uses SQLite `contains`, with case sensitivity depending on SQLite collation.

## Screenshots

Application screenshots are available in `docs/screenshots/`:

- Leads dashboard
- Form Builder
- Dynamic Lead Form

## AI Assistance Disclosure

Cursor AI (Composer) was used during development to assist with architecture exploration, code generation, debugging, test implementation and documentation.

The implementation was iteratively developed against the AQARY assignment brief and UI reference. I am responsible for the submitted code and have tested the application workflows, reviewed the implementation and am prepared to explain and modify the solution.