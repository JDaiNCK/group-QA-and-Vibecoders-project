import { expect, test, type Page } from '@playwright/test'

import { createExpenseViaApi, listExpensesViaApi } from '../helpers/api'
import { signIn } from '../helpers/auth'
import { resetExpenses } from '../helpers/env'
import { fillExpenseForm, openExpenseForm, submitExpense } from '../helpers/ui'
import {
  BASELINE_TOTAL,
  baselineExpenses,
  formatCurrency,
  formatDate,
  invalidAmounts,
  invalidCategory,
  secondExpense,
  testExpense,
  thirdExpense,
} from '../fixtures/expense-data'

test.describe('Personal Expense Tracker — functional behaviour', () => {
  test.beforeEach(async ({ page }) => {
    resetExpenses()
    await page.goto('/')
    await signIn(page)
  })

  test('1. user can open the Personal Expense Tracker', async ({ page }) => {
    const consoleErrors: string[] = []
    const pageErrors: string[] = []

    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text())
      }
    })
    page.on('pageerror', (error) => pageErrors.push(error.message))

    // Reload with listeners attached so startup errors are captured.
    await page.reload()
    await expect(page.getByTestId('dashboard')).toBeVisible()
    await expect(page.getByTestId('total-spending')).toBeVisible()

    expect(pageErrors, 'no uncaught page errors').toEqual([])
    expect(consoleErrors, 'no console errors').toEqual([])
  })

  test('2. user can open the Add Expense form', async ({ page }) => {
    await expect(page.getByTestId('expense-form')).toBeHidden()

    await openExpenseForm(page)

    await expect(page.getByTestId('expense-form')).toBeVisible()
    await expect(page.getByTestId('amount-input')).toBeVisible()
  })

  test('3. user can enter an expense amount', async ({ page }) => {
    await openExpenseForm(page)
    const amountInput = page.getByTestId('amount-input')

    await amountInput.fill(testExpense.amount)

    await expect(amountInput).toHaveValue(testExpense.amount)
  })

  test('4. user can select an expense category', async ({ page }) => {
    await openExpenseForm(page)
    const categorySelect = page.getByTestId('category-select')

    await categorySelect.selectOption(testExpense.category)

    await expect(categorySelect).toHaveValue(testExpense.category)
  })

  test('5. user can select an expense date', async ({ page }) => {
    await openExpenseForm(page)
    const dateInput = page.getByTestId('date-input')

    await dateInput.fill(testExpense.date)

    await expect(dateInput).toHaveValue(testExpense.date)
  })

  test('6. user can successfully save an expense', async ({ page }) => {
    await openExpenseForm(page)

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/expenses') &&
        response.request().method() === 'POST',
    )

    await fillExpenseForm(page, testExpense)
    await page.getByTestId('save-expense-button').click()

    const response = await responsePromise
    expect(response.ok(), 'POST /api/expenses should succeed').toBeTruthy()
    expect(response.status()).toBe(201)

    const body = await response.json()
    expect(body.data).toMatchObject({
      amount: 500,
      category: 'Food',
      date: '2026-09-29',
    })
    expect(body.data.id, 'saved expense should be assigned an id').toBeTruthy()

    await expect(page.getByTestId('save-success')).toBeVisible()
  })

  test('7. invalid expense data is rejected without creating a record', async ({ page }) => {
    await openExpenseForm(page)

    // Submit the form completely empty: the client blocks required fields.
    await page.getByTestId('save-expense-button').click()

    await expect(page.getByTestId('error-amount')).toBeVisible()
    await expect(page.getByTestId('error-category')).toBeVisible()
    await expect(page.getByTestId('error-date')).toBeVisible()

    const expenses = await listExpensesViaApi(page.request)
    expect(expenses, 'no expense should be created').toHaveLength(0)
  })

  test('8. Laravel 422 validation errors are displayed', async ({ page }) => {
    await openExpenseForm(page)

    // These pass the client's required-ness check and reach Laravel, which
    // rejects them and returns a 422 with field-keyed messages.
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/expenses') &&
        response.request().method() === 'POST',
    )

    await fillExpenseForm(page, {
      amount: invalidAmounts.negative,
      category: testExpense.category,
      date: testExpense.date,
    })
    await page.getByTestId('save-expense-button').click()

    const response = await responsePromise
    expect(response.status(), 'Laravel should answer 422').toBe(422)

    const body = await response.json()
    expect(body.errors, '422 body should carry field errors').toHaveProperty('amount')

    await expect(page.getByTestId('error-amount')).toBeVisible()
    await expect(page.getByTestId('error-amount')).toContainText('amount')
    await expect(page.getByTestId('save-success')).toBeHidden()

    const expenses = await listExpensesViaApi(page.request)
    expect(expenses).toHaveLength(0)
  })

  test('8b. an unknown category is rejected by Laravel', async ({ page }) => {
    await openExpenseForm(page)

    // The native <select> cannot produce an unknown value, so the request is
    // issued directly against the API to assert the backend contract.
    const response = await page.request.post('/api/expenses', {
      data: { amount: 500, category: invalidCategory, date: '2026-09-29' },
      headers: { Authorization: `Bearer ${await tokenFor(page)}` },
    })

    expect(response.status()).toBe(422)
    const body = await response.json()
    expect(body.errors).toHaveProperty('category')
  })

  test('9. saved expenses persist across navigation and a full page reload', async ({
    page,
  }) => {
    await openExpenseForm(page)
    await submitExpense(page, testExpense)
    await expect(page.getByTestId('save-success')).toBeVisible()

    // Navigate away via the SPA router.
    await page.getByTestId('nav-history').click()
    await expect(page).toHaveURL(/\/expenses$/)
    await expect(page.getByTestId('history-row')).toHaveCount(1)

    // Come back to the dashboard, then hard-reload the document.
    await page.getByTestId('nav-dashboard').click()
    await expect(page.getByTestId('dashboard')).toBeVisible()
    await page.reload()
    await expect(page.getByTestId('dashboard')).toBeVisible()

    await expect(page.getByTestId('expense-item')).toHaveCount(1)
    await expect(page.getByTestId('expense-item').first()).toContainText(
      formatCurrency(Number(testExpense.amount)),
    )
  })

  test('10. total spending is calculated to the exact expected value', async ({ page }) => {
    for (const expense of baselineExpenses) {
      await createExpenseViaApi(page.request, {
        amount: Number(expense.amount),
        category: expense.category,
        date: expense.date,
      })
    }

    await page.reload()
    await expect(page.getByTestId('total-spending-value')).toBeVisible()

    // Exact expected total, not merely "the number changed".
    await expect(page.getByTestId('total-spending-value')).toHaveAttribute(
      'data-amount',
      String(BASELINE_TOTAL),
    )
    await expect(page.getByTestId('total-spending-value')).toHaveText(
      formatCurrency(BASELINE_TOTAL),
    )

    // Now add one expense through the UI and assert the total moves by exactly
    // that amount: 1750.75 + 500 = 2250.75
    await openExpenseForm(page)
    await submitExpense(page, testExpense)
    await expect(page.getByTestId('save-success')).toBeVisible()

    await expect(page.getByTestId('total-spending-value')).toHaveAttribute(
      'data-amount',
      String(BASELINE_TOTAL + 500),
    )
  })

  test('11. a new expense appears in recent expenses', async ({ page }) => {
    await openExpenseForm(page)
    await submitExpense(page, testExpense)
    await expect(page.getByTestId('save-success')).toBeVisible()

    const recent = page.getByTestId('recent-expenses')
    await expect(recent).toBeVisible()
    await expect(page.getByTestId('expense-item')).toHaveCount(1)

    const item = page.getByTestId('expense-item').first()
    await expect(item).toContainText(formatCurrency(Number(testExpense.amount)))
    await expect(item).toContainText(testExpense.category)
    await expect(item).toContainText(formatDate(testExpense.date))
  })

  test('12. user can view expense history with correct records', async ({ page }) => {
    for (const expense of [testExpense, secondExpense, thirdExpense]) {
      await createExpenseViaApi(page.request, {
        amount: Number(expense.amount),
        category: expense.category,
        date: expense.date,
      })
    }

    await page.getByTestId('nav-history').click()
    await expect(page).toHaveURL(/\/expenses$/)
    await expect(page.getByTestId('expense-history')).toBeVisible()

    await expect(page.getByTestId('history-row')).toHaveCount(3)
    await expect(page.getByTestId('history-count')).toHaveText('3 expenses')

    // The API returns newest-first, so 09-29 leads, then 09-28, then 09-27.
    const rows = page.getByTestId('history-row')
    for (const [index, expense] of [testExpense, secondExpense, thirdExpense].entries()) {
      const row = rows.nth(index)
      await expect(row).toContainText(formatCurrency(Number(expense.amount)))
      await expect(row).toContainText(expense.category)
      await expect(row).toContainText(formatDate(expense.date))
    }
  })

  test('13. user can add multiple expenses in succession', async ({ page }) => {
    await openExpenseForm(page)

    for (const expense of [testExpense, secondExpense, thirdExpense]) {
      const responsePromise = page.waitForResponse(
        (response) =>
          response.url().includes('/api/expenses') &&
          response.request().method() === 'POST',
      )
      await fillExpenseForm(page, expense)
      await page.getByTestId('save-expense-button').click()

      const response = await responsePromise
      expect(response.status()).toBe(201)

      // The form resets after a successful save, so the next entry starts clean.
      await expect(page.getByTestId('amount-input')).toHaveValue('')
      await expect(page.getByTestId('save-success')).toBeVisible()
    }

    await expect(page.getByTestId('expense-item')).toHaveCount(3)
    await expect(page.getByTestId('total-spending-value')).toHaveAttribute(
      'data-amount',
      String(BASELINE_TOTAL),
    )

    const expenses = await listExpensesViaApi(page.request)
    expect(expenses).toHaveLength(3)
  })

  test('14. user can navigate between pages and keep working', async ({ page }) => {
    // Dashboard -> History -> Dashboard, then record a new expense.
    await page.getByTestId('nav-history').click()
    await expect(page).toHaveURL(/\/expenses$/)
    await expect(page.getByTestId('history-page')).toBeVisible()

    await page.getByTestId('nav-dashboard').click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByTestId('dashboard')).toBeVisible()

    await openExpenseForm(page)
    await submitExpense(page, secondExpense)
    await expect(page.getByTestId('save-success')).toBeVisible()
    await expect(page.getByTestId('total-spending-value')).toHaveAttribute(
      'data-amount',
      String(Number(secondExpense.amount)),
    )

    // The new record is visible from the history page too.
    await page.getByTestId('nav-history').click()
    await expect(page.getByTestId('history-row')).toHaveCount(1)
    await expect(page.getByTestId('history-row').first()).toContainText(
      formatCurrency(Number(secondExpense.amount)),
    )
  })

  test('15. an unauthenticated visitor is redirected to sign in', async ({ page }) => {
    await page.evaluate(() => localStorage.removeItem('expense_tracker_token'))
    await page.goto('/')

    // The guard redirects with ?redirect= so sign-in can return here.
    await expect(page).toHaveURL(/\/login(\?|$)/)
    expect(new URL(page.url()).pathname).toBe('/login')
    await expect(page.getByTestId('login-page')).toBeVisible()

    // And the API rejects anonymous access.
    const anonymous = await page.request.get('/api/expenses')
    expect(anonymous.status()).toBe(401)
  })
})

/** Reads the bearer token the app stored during sign-in. */
async function tokenFor(page: Page): Promise<string> {
  const token = await page.evaluate(() =>
    localStorage.getItem('expense_tracker_token'),
  )
  if (!token) {
    throw new Error('expected a stored auth token after sign-in')
  }
  return token
}
