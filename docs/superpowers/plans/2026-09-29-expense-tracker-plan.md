# Personal Expense Tracker Implementation Plan

> **Status: complete.** All four tasks are implemented and verified. See the
> "Verification" section at the bottom for the final run results.

**Goal:** Build a decoupled Personal Expense Tracker MVP with Vue.js frontend and Laravel API backend, fully tested with Playwright.

**Architecture:** Decoupled. Vue.js SPA talks to Laravel API endpoints. Playwright verifies the integration.

**Tech Stack:** Vue.js 3, Laravel 13, SQLite, TypeScript, Playwright.

> **Note:** `laravel/laravel` now resolves to Laravel 13, superseding the
> Laravel 11 originally specified. The API surface, FormRequest validation and
> Eloquent resource conventions are unchanged.

**Spec:** `docs/superpowers/specs/2026-09-29-expense-tracker-design.md`

## Global Constraints
- Laravel 13
- Vue.js 3
- SQLite
- REST API
- Playwright E2E

## Review Focus
- Invalid amounts (negative, zero, string) — expect 422 error
- Missing required fields — expect 422 error
- Invalid date format — expect 422 error
- Large number input — expect 422 error (if max amount enforced)
- Network failure/server 500 — UI should display generic error message

---

### Task 1: Backend Setup & API (Laravel)

**Files:**
- Modify: `routes/api.php`
- Modify: `app/Http/Controllers/ExpenseController.php`
- Modify: `app/Models/Expense.php`
- Modify: `database/migrations/YYYY_MM_DD_create_expenses_table.php`

**Interfaces:**
- Produces: `POST /api/expenses`, `GET /api/expenses`

- [x] **Step 1: Create migration and model**
- [x] **Step 2: Implement Controller with validation**
- [x] **Step 3: Define routes**
- [x] **Step 4: Commit**

### Task 2: Frontend Setup & Expense Form (Vue.js)

**Files:**
- Create: `src/components/ExpenseForm.vue`
- Create: `src/views/DashboardView.vue`
- Modify: `src/router/index.ts`

**Interfaces:**
- Consumes: `POST /api/expenses`

- [x] **Step 1: Scaffold Vue project and Axios**
- [x] **Step 2: Build ExpenseForm with data-testid**
- [x] **Step 3: Implement POST request with validation handling**
- [x] **Step 4: Commit**

### Task 3: Dashboard & Expense History (Frontend)

**Files:**
- Create: `src/components/ExpenseList.vue`
- Create: `src/components/TotalSpending.vue`

**Interfaces:**
- Consumes: `GET /api/expenses`

- [x] **Step 1: Implement TotalSpending component**
- [x] **Step 2: Implement ExpenseList component**
- [x] **Step 3: Integrate into DashboardView**
- [x] **Step 4: Commit**

### Task 4: Playwright E2E Setup & Tests

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/functional/expense-tracker.spec.ts`
- Create: `tests/ui/expense-tracker-ui.spec.ts`

- [x] **Step 1: Install Playwright and setup config**
- [x] **Step 2: Functional tests (Add, Validate, Persist)**
- [x] **Step 3: UI tests (Responsive, Visibility)**
- [x] **Step 4: Run tests and verify**
- [x] **Step 5: Commit**

---

## Verification

| Suite                        | Tests | Result                |
| ---------------------------- | ----- | --------------------- |
| Playwright functional        | 16    | all passing           |
| Playwright UI validation     | 28    | all passing           |
| Laravel PHPUnit (API)       | 17    | all passing           |

Run them with:

```bash
npm test                                    # 44 Playwright tests
cd backend && php artisan test --compact    # 17 API tests
```

## Out-of-Scope Items From Review Focus

- **Large number input** — no maximum amount is enforced. `amount` is a
  `decimal(12,2)` column, so the database, not the validator, defines the
  ceiling. A max rule was deliberately not added because the spec did not
  define one.
- **Network failure / server 500 generic message** — the form surfaces a
  message when a save fails without a 422 body, and the dashboard and history
  pages render a load error. This path is implemented but is not covered by an
  end-to-end test, since forcing a real 500 requires fault injection.
