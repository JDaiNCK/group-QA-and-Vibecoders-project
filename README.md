# Personal Expense Tracker

A decoupled web application: a **Vue 3 + TypeScript** single-page app talking to a
**Laravel** JSON API, verified end to end with **Playwright**.

```
web-tech/
├── backend/            Laravel API (PHP 8.3, SQLite, Sanctum)
├── frontend/           Vue 3 + Vite + TypeScript SPA
├── tests/              Playwright end-to-end suite
├── scripts/            start-backend.mjs (used by Playwright's webServer)
├── tools/              Portable PHP + Composer (gitignored, repo-local)
└── playwright.config.ts
```

## Requirements

Node 22+ and npm. PHP and Composer are **not** required on the host: the project
carries a portable PHP 8.3 runtime under `tools/`, installed by the script below.

## Setup

```powershell
# 1. Portable PHP 8.3 + Composer into tools/  (skip if tools/php already exists)
powershell -ExecutionPolicy Bypass -File tools\setup-php.ps1

# 2. Laravel dependencies and database
$env:PATH = "$PWD\tools\bin;$env:PATH"
cd backend
php artisan migrate --seed
cd ..

# 3. Frontend dependencies
cd frontend; npm install; cd ..

# 4. Playwright + Chromium
npm install
npx playwright install chromium
```

## Running the application

Two processes, two terminals:

```powershell
# Terminal 1 — Laravel API on http://127.0.0.1:8000
cd backend
php artisan serve

# Terminal 2 — Vue dev server on http://127.0.0.1:5173
cd frontend
npm run dev
```

Vite proxies `/api/*` to the Laravel server, so both share an origin in dev.
Open <http://127.0.0.1:5173> and sign in with `tester@example.com` / `password`.

## API

All expense routes require a Sanctum bearer token.

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
├── ui/expense-tracker-ui.spec.ts        # 24 UI validation checks
├── fixtures/expense-data.ts             # deterministic expense data
├── helpers/                             # env paths, API client, sign-in, UI actions
└── global-setup.ts                      # migrate + seed + reset before the suite
```

The Vue components carry stable `data-testid` attributes. No `nth-child`,
generated class selectors, deep CSS paths or XPath are used, and there are no
`waitForTimeout` calls — synchronisation is on real network and UI conditions.
