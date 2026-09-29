/**
 * Deterministic expense fixtures.
 *
 * Amounts and dates are fixed rather than generated so every assertion can
 * state the exact expected value, and so repeated runs produce identical data.
 * Each fixture carries a distinct amount so tests that share the database
 * remain independently verifiable.
 */

export const CATEGORIES = ['Food', 'Transport', 'School'] as const

export type Category = (typeof CATEGORIES)[number]

export interface ExpenseFixture {
  amount: string
  category: Category
  date: string
}

export const testExpense: ExpenseFixture = {
  amount: '500',
  category: 'Food',
  date: '2026-09-29',
}

export const secondExpense: ExpenseFixture = {
  amount: '250.75',
  category: 'Transport',
  date: '2026-09-28',
}

export const thirdExpense: ExpenseFixture = {
  amount: '1000',
  category: 'School',
  date: '2026-09-27',
}

/**
 * Baselines used for total-calculation tests.
 * 500 + 250.75 + 1000 = 1750.75
 */
export const baselineExpenses: ExpenseFixture[] = [testExpense, secondExpense, thirdExpense]

export const BASELINE_TOTAL = 1750.75

/** Amounts that Laravel must reject. */
export const invalidAmounts = {
  zero: '0',
  negative: '-50',
  nonNumeric: 'abc',
  malformed: '12.3.4',
} as const

/** Categories outside the allowed set. */
export const invalidCategory = 'Gaming'

/** Formats a number the same way the UI does, for text assertions. */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/** Formats an ISO date the same way the UI does. */
export function formatDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate)
  if (!match) return isoDate
  const [, year, month, day] = match
  return `${month}/${day}/${year}`
}
