import { expect, test } from '@playwright/test'

import { createExpenseViaApi } from '../helpers/api'
import { signIn } from '../helpers/auth'
import { resetExpenses } from '../helpers/env'
import { expectNoHorizontalOverflow, fillExpenseForm, openExpenseForm } from '../helpers/ui'
import {
  formatCurrency,
  invalidAmounts,
  testExpense,
} from '../fixtures/expense-data'

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
] as const

test.describe('Personal Expense Tracker — UI validation', () => {
  test.beforeEach(async ({ page }) => {
    resetExpenses()
    await page.goto('/')
    await signIn(page)
  })

  test.describe('Dashboard', () => {
    test('renders the dashboard with its primary regions', async ({ page }) => {
      await expect(page.getByTestId('app-root')).toBeVisible()
      await expect(page.getByTestId('dashboard')).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
      await expect(page.getByTestId('total-spending')).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Recent Expenses' })).toBeVisible()
    })

    test('shows the total spending figure', async ({ page }) => {
      await expect(page.getByTestId('total-spending-value')).toBeVisible()
      await expect(page.getByTestId('total-spending-value')).toHaveText(formatCurrency(0))
      await expect(page.getByTestId('total-spending-value')).toHaveAttribute('data-amount', '0')
    })

    test('shows the recent expenses region', async ({ page }) => {
      await expect(page.getByTestId('recent-expenses-loading')).toBeHidden()
      await expect(page.getByTestId('empty-state')).toBeVisible()
    })

    test('shows the Add Expense button', async ({ page }) => {
      const addButton = page.getByTestId('add-expense-button')

      await expect(addButton).toBeVisible()
      await expect(addButton).toBeEnabled()
      await expect(addButton).toHaveText('Add Expense')
    })

    test('renders the empty state when there are no expenses', async ({ page }) => {
      await expect(page.getByTestId('empty-state')).toBeVisible()
      await expect(page.getByTestId('empty-state')).toContainText('No expenses yet')
      await expect(page.getByTestId('expense-item')).toHaveCount(0)
    })

    test('renders the populated state after expenses exist', async ({ page }) => {
      await createExpenseViaApi(page.request, {
        amount: 500,
        category: 'Food',
        date: '2026-09-29',
      })
      await page.reload()

      await expect(page.getByTestId('expense-item')).toHaveCount(1)
      await expect(page.getByTestId('empty-state')).toHaveCount(0)
      await expect(page.getByTestId('expense-item').first()).toContainText(
        formatCurrency(500),
      )
    })
  })

  test.describe('Expense form', () => {
    test('is hidden until Add Expense is clicked, then visible', async ({ page }) => {
      await expect(page.getByTestId('expense-form')).toBeHidden()

      await openExpenseForm(page)

      await expect(page.getByTestId('expense-form')).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Add Expense' })).toBeVisible()
    })

    test('exposes a visible, enabled amount input', async ({ page }) => {
      await openExpenseForm(page)

      const amountInput = page.getByTestId('amount-input')
      await expect(amountInput).toBeVisible()
      await expect(amountInput).toBeEnabled()
      await expect(amountInput).toBeEditable()
      await expect(page.getByLabel('Amount')).toBeVisible()
    })

    test('exposes a category selector listing every allowed category', async ({ page }) => {
      await openExpenseForm(page)

      const select = page.getByTestId('category-select')
      await expect(select).toBeVisible()
      await expect(select).toBeEnabled()

      await expect(select.locator('option')).toHaveText([
        'Select a category',
        'Food',
        'Transport',
        'School',
      ])
    })

    test('exposes a visible, enabled date input', async ({ page }) => {
      await openExpenseForm(page)

      const dateInput = page.getByTestId('date-input')
      await expect(dateInput).toBeVisible()
      await expect(dateInput).toBeEnabled()
      await expect(dateInput).toHaveAttribute('type', 'date')
    })

    test('shows an enabled Save button that is disabled while saving', async ({ page }) => {
      await openExpenseForm(page)

      const saveButton = page.getByTestId('save-expense-button')
      await expect(saveButton).toBeVisible()
      await expect(saveButton).toBeEnabled()
      await expect(saveButton).toHaveText('Save Expense')

      await fillExpenseForm(page, testExpense)
      await saveButton.click()

      // The request is in flight briefly; the button reflects the saving state.
      await expect(saveButton).toBeDisabled()
      await expect(page.getByTestId('save-success')).toBeVisible()
      await expect(saveButton).toBeEnabled()
    })
  })

  test.describe('Validation states', () => {
    test('shows a validation message for each missing required field', async ({ page }) => {
      await openExpenseForm(page)
      await page.getByTestId('save-expense-button').click()

      for (const field of ['amount', 'category', 'date']) {
        const message = page.getByTestId(`error-${field}`)
        await expect(message).toBeVisible()
        await expect(message).toHaveAttribute('role', 'alert')
      }
    })

    test('marks invalid fields with an error state', async ({ page }) => {
      await openExpenseForm(page)
      await page.getByTestId('save-expense-button').click()

      await expect(page.getByTestId('amount-input')).toHaveAttribute('aria-invalid', 'true')
      await expect(page.getByTestId('category-select')).toHaveAttribute('aria-invalid', 'true')
      await expect(page.getByTestId('date-input')).toHaveAttribute('aria-invalid', 'true')
    })

    test('clears a field error once the field is corrected', async ({ page }) => {
      await openExpenseForm(page)
      await page.getByTestId('save-expense-button').click()

      await expect(page.getByTestId('error-amount')).toBeVisible()

      await page.getByTestId('amount-input').fill('500')

      await expect(page.getByTestId('error-amount')).toBeHidden()
      await expect(page.getByTestId('amount-input')).toHaveAttribute('aria-invalid', 'false')
    })

    test('displays the server validation message for an out-of-range amount', async ({
      page,
    }) => {
      await openExpenseForm(page)
      await fillExpenseForm(page, { ...testExpense, amount: invalidAmounts.negative })
      await page.getByTestId('save-expense-button').click()

      const error = page.getByTestId('error-amount')
      await expect(error).toBeVisible()
      await expect(error).toContainText('at least 0.01')
      await expect(page.getByTestId('save-success')).toBeHidden()
    })

    test('rejects a zero amount with a server validation message', async ({ page }) => {
      await openExpenseForm(page)
      await fillExpenseForm(page, { ...testExpense, amount: invalidAmounts.zero })
      await page.getByTestId('save-expense-button').click()

      await expect(page.getByTestId('error-amount')).toBeVisible()
      await expect(page.getByTestId('save-success')).toBeHidden()
    })
  })

  test.describe('Expense history', () => {
    test('renders the history page', async ({ page }) => {
      await page.getByTestId('nav-history').click()

      await expect(page).toHaveURL(/\/expenses$/)
      await expect(page.getByTestId('history-page')).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Expense History' })).toBeVisible()
    })

    test('shows expense records with amount, category and date', async ({ page }) => {
      await createExpenseViaApi(page.request, {
        amount: 500,
        category: 'Food',
        date: '2026-09-29',
      })

      await page.getByTestId('nav-history').click()
      await expect(page.getByTestId('history-row')).toHaveCount(1)

      const row = page.getByTestId('history-row').first()
      await expect(row).toContainText(formatCurrency(500))
      await expect(row.getByTestId('expense-category')).toHaveText('Food')
      await expect(row.getByTestId('expense-date')).toHaveText('09/29/2026')
    })

    test('renders the empty history state', async ({ page }) => {
      await page.getByTestId('nav-history').click()

      await expect(page.getByTestId('history-empty-state')).toBeVisible()
      await expect(page.getByTestId('history-empty-state')).toContainText('No expenses yet')
      await expect(page.getByTestId('history-row')).toHaveCount(0)
    })
  })

  test.describe('Responsive layout', () => {
    for (const viewport of VIEWPORTS) {
      test(`renders without horizontal overflow at ${viewport.name} (${viewport.width}x${viewport.height})`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height })
        await page.reload()

        await expect(page.getByTestId('dashboard')).toBeVisible()
        await expect(page.getByTestId('total-spending-value')).toBeVisible()
        await expect(page.getByTestId('add-expense-button')).toBeVisible()

        await expectNoHorizontalOverflow(page)

        // The Add Expense control stays usable at this width.
        const addButton = page.getByTestId('add-expense-button')
        await expect(addButton).toBeInViewport()
        await addButton.click()
        await expect(page.getByTestId('expense-form')).toBeVisible()

        await expectNoHorizontalOverflow(page)
      })
    }

    for (const viewport of VIEWPORTS) {
      test(`keeps the expense form usable at ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height })
        await page.reload()
        await openExpenseForm(page)

        await expect(page.getByTestId('amount-input')).toBeVisible()
        await expect(page.getByTestId('category-select')).toBeVisible()
        await expect(page.getByTestId('date-input')).toBeVisible()
        await expect(page.getByTestId('save-expense-button')).toBeVisible()

        await expectNoHorizontalOverflow(page)
      })
    }

    for (const viewport of VIEWPORTS) {
      test(`keeps the expense history accessible at ${viewport.name}`, async ({ page }) => {
        await createExpenseViaApi(page.request, {
          amount: 500,
          category: 'Food',
          date: '2026-09-29',
        })

        await page.setViewportSize({ width: viewport.width, height: viewport.height })
        await page.reload()
        await page.getByTestId('nav-history').click()

        await expect(page.getByTestId('history-row')).toHaveCount(1)
        await expectNoHorizontalOverflow(page)
      })
    }
  })
})
