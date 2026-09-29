# Design: Personal Expense Tracker (Decoupled)

## 1. Overview
A decoupled application featuring a Vue.js 3 frontend and a Laravel API backend.

## 2. Architecture
- **Backend:** Laravel 11 (API)
  - Database: MySQL/SQLite
  - Controllers: RESTful API for Expenses
  - Authentication: Laravel Sanctum (token-based)
- **Frontend:** Vue.js 3 (Vue Router, Axios, Pinia/reactive state)
- **Communication:** REST APIs (`/api/expenses` etc.)
- **Testing:** Playwright TypeScript E2E

## 3. Workflows
- **Add & Save:** UI form -> Validate (Frontend/Backend) -> POST `/api/expenses` -> DB
- **Display:** GET `/api/expenses` -> Vue reactive state -> Render Dashboard/History
- **Validation:** 422 Response -> Vue error flash / input highlight

## 4. Components
- `ExpenseForm.vue`: Input amount, category, date
- `Dashboard.vue`: Summary tiles, list recent
- `ExpenseHistory.vue`: Full table/list view

## 5. Persistence
- Migration: `expenses` table (`id`, `amount`, `category`, `date`, `created_at`)
- Model: `Expense` (fillable: `amount`, `category`, `date`)
