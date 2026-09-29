# Design: Personal Expense Tracker (Decoupled)

## 1. Overview

A decoupled application featuring a Vue.js 3 frontend and a Laravel API backend.

## 2. Architecture

- **Backend:** Laravel 13 (API)
  - Database: SQLite
  - Controllers: RESTful API for Expenses
  - Authentication: Laravel Sanctum (token-based)
- **Frontend:** Vue.js 3 (Vue Router, Axios)
- **Communication:** REST APIs (`/api/expenses`, `/api/login`)
- **Testing:** Playwright TypeScript E2E

### 2.1 Repository Layout

```
web-tech/
├── backend/            Laravel 13 API (PHP 8.3, SQLite)
├── frontend/           Vue 3 + Vite + TypeScript SPA
├── tests/
│   ├── functional/     expense-tracker.spec.ts
│   ├── ui/             expense-tracker-ui.spec.ts
│   ├── fixtures/       expense-data.ts
│   ├── helpers/        env.ts, api.ts, auth.ts, ui.ts
│   └── global-setup.ts
├── scripts/            start-backend.mjs
├── playwright.config.ts
└── tools/              Portable PHP + Composer (gitignored, not system-wide)
```

`laravel/laravel` now resolves to Laravel 13, which supersedes the Laravel 11
named in the original plan. The API surface, FormRequest validation and Eloquent
resource conventions are unchanged between the two.

The host environment has no package manager (no winget/choco/scoop) and no
preinstalled PHP or Composer. PHP 8.3.35 NTS and `composer.phar` are therefore
installed **repo-locally** under `tools/` by `tools/setup-php.ps1`. Nothing is
installed system-wide.

The API is exposed under `/api/*` without a version prefix, following the
existing `routes/api.php` convention in this application.

## 3. Workflows

- **Add & Save:** UI form -> Validate (Frontend/Backend) -> `POST /api/expenses` -> DB
- **Display:** `GET /api/expenses` -> Vue reactive state -> Render Dashboard/History
- **Validation:** 422 Response -> Vue error flash / input highlight

## 4. Components

- `ExpenseForm.vue`: Input amount, category, date
- `DashboardView.vue`: Summary tiles, list recent
- `HistoryView.vue`: Full table/list view
- `TotalSpending.vue`, `ExpenseList.vue`: Presentational children

## 5. Persistence

- Migration: `expenses` table (`id`, `amount`, `category`, `date`, `created_at`, `updated_at`)
- Model: `Expense` (fillable: `amount`, `category`, `date`)

### 5.1 Validation Rules (Laravel FormRequest `StoreExpenseRequest`)

| Field      | Rules                                  |
| ---------- | -------------------------------------- |
| `amount`   | `required`, `numeric`, `min:0.01`      |
| `category` | `required`, `in:Food,Transport,School` |
| `date`     | `required`, `date`                     |

Invalid input returns HTTP **422** with a field-keyed `errors` object. The Vue
form maps that object onto the corresponding field-level error messages.

`amount` is stored as a decimal, and **zero and negative amounts are rejected**
per the plan's review focus.

## 6. Authentication

Real Laravel Sanctum. No bypass, no test-only backdoor.

- `POST /api/login` with `email` + `password` returns a bearer token.
- A seeded test user (`tester@example.com`) is created by a database seeder.
- Playwright authenticates once per suite via `tests/helpers/auth.ts`, storing
  the resulting storage state on disk, and reuses it via `storageState`.
- Unauthenticated requests to protected endpoints are themselves tested and
  are expected to return **401**.

## 7. Test Isolation

- Dedicated test database: `expense_tracker_test.sqlite`, never the dev DB.
- A `test:reset-expenses` Artisan command truncates the `expenses` table. It
  lives in `backend/app/Console/Commands/` and is invoked by Playwright's
  `globalSetup`. It adds **no test-only HTTP routes** to application code.
- Each test that depends on a clean expense list resets the table in a
  `beforeEach`. Expense fixtures use a fixed amount/category/date so runs are
  deterministic and independent of execution order.

## 8. Selector Strategy

Stable selectors only: `data-testid`, `getByRole`, `getByLabel`,
`getByPlaceholder`, `getByText`. No `nth-child`, no generated Vue class
selectors, no deep CSS paths, no XPath.

`data-testid` attributes are added to the Vue components as part of this build
(the application is created here, so they are authored alongside the markup
rather than retrofitted).

## 9. Timing Policy

No arbitrary waits. Playwright never calls `page.waitForTimeout()`. Synchronisation
uses `page.waitForResponse()` against real API endpoints, web-first assertions
such as `expect(locator).toBeVisible()`, and router-driven URL assertions.

## 10. Responsive Testing

Verified at 1280x720 (desktop), 768x1024 (tablet), and 390x844 (mobile).
Each viewport asserts that primary content stays visible, that the Add Expense
button and form controls remain usable, and that the document does not overflow
horizontally (`documentElement.scrollWidth <= clientWidth`).

## 11. Test Suite Shape

- **Functional** (16 scenarios): app loads with no console errors, open form,
  enter amount, select category, select date, save expense, invalid data
  rejected, Laravel 422 surfaced, unknown category rejected, persistence across
  navigation/refresh, exact total calculation, recent expenses, expense
  history, multiple expenses, navigation, and auth enforcement.
- **UI validation** (28 checks): dashboard render, total visible, recent list
  visible, add button visible, empty/populated states, form fields visible,
  category option list, save button enabled/disabled, validation messages,
  error state, error clearing, server-side amount errors, history render,
  history records, empty history, and responsive behaviour across the three
  viewports for the dashboard, the form and the history list.

## 12. Backend Test Suite

The API is additionally covered by PHPUnit feature tests in
`backend/tests/Feature/ExpenseApiTest.php` (17 tests): authentication,
authorisation between users, creation, listing order, the full validation
matrix, and the unauthenticated-request contract both with and without a JSON
`Accept` header.

## 13. Defects Found by the Suite

The end-to-end run surfaced three real application defects, all fixed:

1. **Unauthenticated API requests returned 500, not 401.** `auth:sanctum`
   redirected guests to a named `login` route that does not exist in this
   API-only application. PHP feature tests did not catch it because
   `getJson()` sends `Accept: application/json`, which skips the redirect.
   Fixed with `Middleware::redirectGuestsTo()` returning `null` for `api/*`.
2. **The header navigation never appeared after sign-in.** `App.vue` read
   `localStorage` once during setup; `localStorage` is not reactive, so the
   component never re-evaluated. Fixed with a reactive `useAuth()` store.
3. **Expense categories were missing from every list.** Vue casts an absent
   `Boolean` prop to `false`, not `undefined`, so `showCategory !== false`
   evaluated to `false` and the category was never rendered. The unused prop
   was removed.

