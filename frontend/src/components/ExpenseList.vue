<script setup lang="ts">
import type { Expense } from '@/stores/expenses'
import { formatCurrency, formatDate } from '@/utils/format'

defineProps<{
  /** Accepts a readonly array so it can be fed straight from the store's `readonly()` state. */
  expenses: readonly Expense[]
  /** Identifies the rendered list so the same component serves dashboard and history. */
  testid?: string
  itemTestid?: string
  emptyTestid?: string
  emptyMessage?: string
}>()
</script>

<template>
  <div v-if="expenses.length === 0" class="expense-list__empty" :data-testid="emptyTestid">
    <p class="expense-list__empty-title">No expenses yet</p>
    <p class="expense-list__empty-hint">{{ emptyMessage ?? 'Add your first expense to get started.' }}</p>
  </div>

  <ul v-else class="expense-list" :data-testid="testid">
    <li v-for="expense in expenses" :key="expense.id" class="expense-list__item" :data-testid="itemTestid">
      <span class="expense-list__amount">{{ formatCurrency(Number(expense.amount)) }}</span>
      <span class="expense-list__category" data-testid="expense-category">
        {{ expense.category }}
      </span>
      <span class="expense-list__date" data-testid="expense-date">{{ formatDate(expense.date) }}</span>
    </li>
  </ul>
</template>

<style scoped>
.expense-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}
.expense-list__item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f3f4f6;
  flex-wrap: wrap;
}
.expense-list__item:last-child {
  border-bottom: none;
}
.expense-list__amount {
  font-weight: 700;
  color: #111827;
  font-variant-numeric: tabular-nums;
  min-width: 6.5rem;
}
.expense-list__category {
  background: #eef2ff;
  color: #4338ca;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
}
.expense-list__date {
  margin-left: auto;
  color: #6b7280;
  font-size: 0.875rem;
}
.expense-list__empty {
  text-align: center;
  padding: 2rem 1rem;
  color: #6b7280;
}
.expense-list__empty-title {
  margin: 0 0 0.25rem;
  font-weight: 600;
  color: #374151;
}
.expense-list__empty-hint {
  margin: 0;
  font-size: 0.875rem;
}
</style>
