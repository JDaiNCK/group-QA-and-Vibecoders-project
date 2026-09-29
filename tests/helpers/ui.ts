import type { Page } from '@playwright/test'

import { expect } from '@playwright/test'

/** Opens the Add Expense form on the dashboard. */
export async function openExpenseForm(page: Page): Promise<void> {
  await page.getByTestId('add-expense-button').click()
  await expect(page.getByTestId('expense-form')).toBeVisible()
}

/** Fills the expense form without submitting it. */
export async function fillExpenseForm(
  page: Page,
  values: { amount: string; category: string; date: string },
): Promise<void> {
  const form = page.getByTestId('expense-form')

  await form.getByTestId('amount-input').fill(values.amount)
  await form.getByTestId('category-select').selectOption(values.category)
  await form.getByTestId('date-input').fill(values.date)
}

/**
 * Fills and submits the form, returning the POST /api/expenses response so the
 * test can assert on the real network exchange.
 */
export async function submitExpense(
  page: Page,
  values: { amount: string; category: string; date: string },
) {
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes('/api/expenses') &&
      response.request().method() === 'POST',
  )

  await fillExpenseForm(page, values)
  await page.getByTestId('save-expense-button').click()

  return responsePromise
}

/**
 * Asserts the document is not wider than the viewport, which is how the suite
 * detects horizontal overflow at each responsive breakpoint.
 */
export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))

  expect(
    scrollWidth,
    `document scrollWidth (${scrollWidth}) should not exceed clientWidth (${clientWidth})`,
  ).toBeLessThanOrEqual(clientWidth)
}
