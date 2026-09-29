import { computed, reactive, readonly } from 'vue'

import api, { extractFieldErrors, extractMessage, type FieldErrors } from '@/api/client'

export interface Expense {
  id: number
  amount: number
  category: string
  date: string
  created_at?: string
}

export const CATEGORIES = ['Food', 'Transport', 'School'] as const
export type Category = (typeof CATEGORIES)[number]

interface State {
  expenses: Expense[]
  loading: boolean
  saving: boolean
  loaded: boolean
  error: string | null
}

const state = reactive<State>({
  expenses: [],
  loading: false,
  saving: false,
  loaded: false,
  error: null,
})

/**
 * Small reactive store for expenses. Deliberately dependency-free: the app
 * needs exactly one shared collection, so Pinia would be overhead.
 */
export function useExpenses() {
  /** Total spending across every expense returned by the API. */
  const total = computed(() =>
    state.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0),
  )

  /** Newest first — the dashboard shows a short "recent" list. */
  const recent = computed(() =>
    [...state.expenses]
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id))
      .slice(0, 5),
  )

  async function fetchExpenses(): Promise<void> {
    state.loading = true
    state.error = null
    try {
      const { data } = await api.get<{ data: Expense[] }>('/expenses')
      state.expenses = data.data
      state.loaded = true
    } catch (error) {
      state.error = extractMessage(error, 'Unable to load expenses.')
    } finally {
      state.loading = false
    }
  }

  /**
   * Creates an expense. Resolves with the created record, or rejects with the
   * Laravel 422 field errors so the form can render them inline.
   */
  async function createExpense(payload: {
    amount: number
    category: string
    date: string
  }): Promise<Expense> {
    state.saving = true
    state.error = null
    try {
      const { data } = await api.post<{ data: Expense }>('/expenses', payload)
      // Push into local state so the dashboard and history update from the
      // response alone — no full refetch round-trip.
      state.expenses.push(data.data)
      return data.data
    } catch (error) {
      const errors: FieldErrors = extractFieldErrors(error)
      if (Object.keys(errors).length > 0) {
        throw errors
      }
      throw extractMessage(error, 'Unable to save the expense.')
    } finally {
      state.saving = false
    }
  }

  return {
    state: readonly(state),
    total,
    recent,
    fetchExpenses,
    createExpense,
  }
}
