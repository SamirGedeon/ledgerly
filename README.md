# Ledgerly

**Financial clarity for small businesses.** Track income and expenses, follow monthly budgets, and import transaction data without creating duplicates.

Ruby on Rails API · React · TypeScript · PostgreSQL

![Ledgerly dashboard](docs/screenshots/dashboard-desktop.png)

## Features

- **Monthly overview:** income, expenses, period balance, margin, daily cash-flow chart and spending breakdown.
- **Transaction history:** server-side search, category/type filters and pagination (20 records per page).
- **Exact money handling:** amounts are persisted as integer BRL cents; CSV decimal values are parsed with BigDecimal.
- **Monthly category budgets:** create or update limits, inspect expense-only usage and highlight overruns.
- **Atomic CSV imports:** stable external references, duplicate detection, conflicting-data rejection and complete rollback when any row fails.
- **CSV reports:** export the selected month and filters with spreadsheet-formula neutralization.
- **Preserved history:** void transactions instead of deleting them; voided records no longer affect totals and cannot be restored by reimport.
- **Workspace isolation:** owners manage data; viewers can read reports and export but cannot write.
- **Authentication:** BCrypt passwords, opaque expiring sessions, logout revocation and login throttling.
- **Responsive interface:** Portuguese UI, mobile navigation, loading/error/empty states and keyboard-accessible dialogs.

All demo names and financial transactions are fictional. This application tracks recorded cash flow; it does not connect to bank accounts, execute payments or provide an accounting certification.

## Preview

| Desktop | Mobile |
| --- | --- |
| ![Overview](docs/screenshots/dashboard-desktop.png) | ![Mobile overview](docs/screenshots/dashboard-mobile.png) |

## Run with Docker

Requirements: Docker Engine/Desktop and Docker Compose.

```sh
git clone https://github.com/SamirGedeon/ledgerly.git
cd ledgerly
cp .env.example .env
docker compose up --build
```

Open **http://localhost:5174**. API process health: **http://localhost:3001/up**.

| Account | Password | Role |
| --- | --- | --- |
| owner@ledgerly.test | Ledgerly-demo-2026! | Owner |
| viewer@ledgerly.test | Ledgerly-demo-2026! | Read-only viewer |

Seeds create sample data and budgets for the current month in America/Sao_Paulo. The local login page offers a demo autofill button. Demo seeds are disabled in production. DEMO_PASSWORD affects newly created demo accounts only.

Compose uses development mode and loopback-bound ports. The PostgreSQL volume persists across restarts; `docker compose down` stops services without removing it. This configuration is for local development, not a public production deployment.

## Native setup

Install Ruby 3.3, PostgreSQL 16, Node 22.12+ and npm. Native gems may require a compiler, libpq/libyaml headers and pkg-config. Provision a local database login with permission to create the development/test databases.

```sh
export DATABASE_URL=postgres://ledgerly:ledgerly@localhost:5432/ledgerly_development
export TEST_DATABASE_URL=postgres://ledgerly:ledgerly@localhost:5432/ledgerly_test
cd backend
bundle install
bundle exec rails db:prepare db:seed
bundle exec rails server -p 3001
```

In another terminal, from the repository root:

```sh
cd frontend
npm ci
npm run dev
```

Vite proxies `/api` to localhost:3001. Override API_PROXY_TARGET when needed. Database records are stored in PostgreSQL; sessionStorage holds only the browser session token.

## CSV import contract

[Download the example](frontend/public/example-import.csv), adjust its dates and use categories that already exist in your workspace.

```csv
external_id,date,description,kind,amount,category
invoice-1001,2026-11-12,Software license,expense,49.90,Software
invoice-1002,2026-11-13,Completed project,income,1500.00,Projetos
```

- UTF-8, comma-separated, exact six headers, up to **200,000 bytes and 500 data rows**.
- external_id: stable reference, 1–100 ASCII letters/digits or `. _ : -`, starting with a letter or digit.
- date: valid YYYY-MM-DD. kind: income or expense. amount: positive BRL decimal with a dot and up to two decimal places; maximum R$ 10,000,000.00.
- category: existing workspace category name (case-sensitive, outer whitespace ignored).
- An identical external_id and payload is skipped. The same external_id with changed data rejects the file. Reference uniqueness is scoped to a workspace and enforced by PostgreSQL.
- An invalid row rolls back every new record from that import. Import results report created/skipped counts.
- Voided records keep their references. Reimporting the original row skips it and preserves the void.

Exports contain active records only and are capped at 5,000 matching rows. They neutralize formula-like descriptions/category names for spreadsheet safety. Those protected cells gain a leading apostrophe, so export is a reporting format and is not a guaranteed byte-for-byte round-trip import backup.

## Quality checks

Backend:

```sh
cd backend
RAILS_ENV=test bundle exec rails db:prepare
bundle exec rspec
bundle exec rails zeitwerk:check
```

With Docker: `docker compose exec -e RAILS_ENV=test api bundle exec rails db:prepare`, then `docker compose exec api bundle exec rspec`.

Frontend:

```sh
cd frontend
npm ci
npm run format:check
npm run build
npx playwright install chromium
npm run test:e2e
```

Browser tests require a running development Rails API and seeded demo accounts. They create uniquely named test data in the development database; use a dedicated local/CI database. Playwright starts Vite automatically if needed.

[Verification evidence](docs/VERIFICATION.md) distinguishes checks actually executed from production/deployment preparation. GitHub Actions runs backend checks, formatting/build and real browser integration tests on pushes and pull requests.

## Architecture

```mermaid
flowchart LR
  Browser[React + TypeScript] -->|same-origin /api| Proxy[Vite proxy / production reverse proxy]
  Proxy --> API[Rails API]
  API --> DB[(PostgreSQL)]
  CSV[CSV import] --> Import[Validated atomic import]
  Import --> DB
```

[Architecture and decisions](docs/ARCHITECTURE.md) · [OpenAPI specification](docs/openapi.json) · [Research](docs/RESEARCH.md) · [Deployment notes](docs/DEPLOYMENT.md).

## Stack

Ruby 3.3, Rails 7.2, Active Record, PostgreSQL 16, RSpec, React 19, TypeScript, Vite, Tailwind CSS 4 and custom CSS, React Router, TanStack Query, Luxon, Lucide icons, Playwright, Docker and GitHub Actions.

## Scope

This release implements a single-currency recorded cash-flow workspace. Bank synchronization, payment execution, invoice generation, double-entry accounting, tax calculations, recurring jobs, multi-currency conversion, customer self-signup and password reset are outside its scope. Redis/Sidekiq are not needed for the bounded synchronous import.

A recorded transaction may use a future date; totals reflect records in the selected period, not a verified bank balance. Margin is `(income - expenses) / income` for the selected month and is omitted when income is zero. KPI/chart totals cover the entire month, while transaction search/type/category filters affect the table and CSV export.

MIT license.
