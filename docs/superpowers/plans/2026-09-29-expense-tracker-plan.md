# Personal Expense Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a decoupled Personal Expense Tracker MVP with Vue.js frontend and Laravel API backend, fully tested with Playwright.

**Architecture:** Decoupled. Vue.js SPA talks to Laravel API endpoints. Playwright verifies the integration.

**Tech Stack:** Vue.js, Laravel 11, SQLite, TypeScript, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-29-expense-tracker-design.md`

## Global Constraints
- Laravel 11
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

- [ ] **Step 1: Create migration and model**
- [ ] **Step 2: Implement Controller with validation**
- [ ] **Step 3: Define routes**
- [ ] **Step 4: Commit**

### Task 2: Frontend Setup & Expense Form (Vue.js)

**Files:**
- Create: `src/components/ExpenseForm.vue`
- Create: `src/views/HomeView.vue`
- Modify: `src/router/index.ts`

**Interfaces:**
- Consumes: `POST /api/expenses`

- [ ] **Step 1: Scaffold Vue project and Axios**
- [ ] **Step 2: Build ExpenseForm with data-testid**
- [ ] **Step 3: Implement POST request with validation handling**
- [ ] **Step 4: Commit**

### Task 3: Dashboard & Expense History (Frontend)

**Files:**
- Create: `src/components/ExpenseList.vue`
- Create: `src/components/TotalSpending.vue`

**Interfaces:**
- Consumes: `GET /api/expenses`

- [ ] **Step 1: Implement TotalSpending component**
- [ ] **Step 2: Implement ExpenseList component**
- [ ] **Step 3: Integrate into HomeView**
- [ ] **Step 4: Commit**

### Task 4: Playwright E2E Setup & Tests

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/functional/expense-tracker.spec.ts`
- Create: `tests/ui/expense-tracker-ui.spec.ts`

- [ ] **Step 1: Install Playwright and setup config**
- [ ] **Step 2: Functional tests (Add, Validate, Persist)**
- [ ] **Step 3: UI tests (Responsive, Visibility)**
- [ ] **Step 4: Run tests and verify**
- [ ] **Step 5: Commit**
