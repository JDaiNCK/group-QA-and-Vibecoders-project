# Personal Expense Tracker

A decoupled web application: a **Vue 3 + TypeScript** single-page app talking to a
**Laravel** JSON API, verified end to end with **Playwright**.

```
web-tech/
├── backend/            Laravel API (PHP 8.3, SQLite, Sanctum)
├── frontend/           Vue 3 + Vite + TypeScript SPA
├── tests/              Playwright end-to-end suite
├── scripts/            dev.mjs (npm start, artisan, composer, e2e API)
├── tools/              Portable PHP + Composer (gitignored, repo-local)
└── playwright.config.ts
```

## Requirements

Node 22+ and npm. PHP and Composer are **not** required on the host: the project
carries a portable PHP 8.3 runtime under `tools/`, installed by the script below.

## Setup

```powershell
# 1. Portable PHP 8.3 + Composer into tools/  (skip if tools/php already exists)
npm run setup:php

# 2. Laravel dependencies, schema and seed data
npm run setup:composer
npm run db:migrate

# 3. Frontend dependencies
npm --prefix frontend install

# 4. Playwright + Chromium
npm install
npx playwright install chromium
```

## Running the application

```bash
npm start
```

That single command starts both servers and prints the URLs:

```
  App   http://127.0.0.1:5173
  API   http://127.0.0.1:8000/api
  Sign in with  tester@example.com / password
```

Output from each server is colour-tagged (`api` / `web`) so the two streams stay
distinguishable. Press `Ctrl+C` to stop both.

`npm start` targets the **development** database
(`backend/database/database.sqlite`). The Playwright suite uses a separate
database and starts its own servers, so the two never interfere.

### Available scripts

| Script                   | Purpose                                       |
| ------------------------ | --------------------------------------------- |
| `npm start` / `npm dev`  | Run the API and web app together              |
| `npm run setup:php`      | Install the portable PHP + Composer runtime   |
| `npm run setup:composer` | Install Laravel's PHP dependencies            |
| `npm run db:migrate`     | Migrate and seed the dev database             |
| `npm run db:fresh`       | Drop, re-migrate and re-seed the dev database |
| `npm run db:reset`       | Delete all expenses                           |
| `npm run artisan -- ...` | Run any Artisan command                       |
| `npm test`               | Full Playwright suite (starts its own servers)|
| `npm run typecheck`      | Typecheck the tests and build the frontend    |

### Running the two servers separately

```bash
# Terminal 1 - API on http://127.0.0.1:8000
npm run artisan -- serve

# Terminal 2 - SPA on http://127.0.0.1:5173
npm --prefix frontend run dev
```

The `npm run artisan --` prefix routes through `scripts/dev.mjs`, which uses the
portable PHP in `tools/` so no global PHP is required.

Vite proxies `/api/*` to the Laravel server, so both share an origin in dev.

## API

All expense routes require a Sanctum bearer token.

`GET /` returns a small JSON pointer to the API and the SPA. This backend is
API-only — the interface is the Vue app in `frontend/`, so there is no Blade
view and no separate Laravel asset build.

| Method | Path             | Purpose                          |
| ------ | ---------------- | -------------------------------- |
| `POST` | `/api/login`     | Issue a bearer token             |
| `POST` | `/api/logout`    | Revoke the current token         |
| `GET`  | `/api/user`      | The authenticated user           |
| `GET`  | `/api/expenses`  | List the user's expenses, newest first |
| `POST` | `/api/expenses`  | Create an expense                |

Validation (`app/Http/Requests/StoreExpenseRequest.php`):

| Field      | Rules                                  |
| ---------- | -------------------------------------- |
| `amount`   | `required`, `numeric`, `min:0.01`      |
| `category` | `required`, `in:Food,Transport,School` |
| `date`     | `required`, `date`                     |

Invalid input returns **422** with a field-keyed `errors` object, which the Vue
form renders inline against the matching field.

## Tests

```bash
npm test                    # full suite
npm run test:functional     # functional behaviour only
npm run test:ui             # UI validation only
npm run report              # open the HTML report
```

Playwright starts both servers itself, so nothing needs to be running first.

### Test isolation

The suite uses a **dedicated** SQLite database,
`backend/database/expense_tracker_test.sqlite`, and never touches
`database/database.sqlite`. Each test resets the `expenses` table through the
application's own `app:reset-test-expenses` Artisan command — there are no
test-only HTTP routes in the application.

### Structure

```
tests/
├── functional/expense-tracker.spec.ts   # 16 functional scenarios
├── ui/expense-tracker-ui.spec.ts        # 28 UI + responsive checks
├── fixtures/expense-data.ts             # deterministic expense data
├── helpers/                             # env paths, API client, sign-in, UI actions
└── global-setup.ts                      # migrate + seed + reset before the suite
```

44 tests in total. The UI file covers the desktop and tablet viewports
(1280x720, 768x1024) plus a mobile pass (390x844) that asserts content stays
visible and nothing overflows horizontally.

The Vue components carry stable `data-testid` attributes. No `nth-child`,
generated class selectors, deep CSS paths or XPath are used, and there are no
`waitForTimeout` calls — synchronisation is on real network and UI conditions.
