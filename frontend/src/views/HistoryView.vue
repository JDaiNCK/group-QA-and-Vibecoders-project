<script setup lang="ts">
import { onMounted } from 'vue'

import ExpenseList from '@/components/ExpenseList.vue'
import { useExpenses } from '@/stores/expenses'

const { state, total, fetchExpenses } = useExpenses()

onMounted(fetchExpenses)
</script>

<template>
  <main class="history" data-testid="history-page">
    <header class="history__header">
      <h1 class="history__title">Expense History</h1>
      <p class="history__count" data-testid="history-count">
        {{ state.expenses.length }} {{ state.expenses.length === 1 ? 'expense' : 'expenses' }}
      </p>
    </header>

    <p v-if="state.error" class="history__error" data-testid="history-error" role="alert">
      {{ state.error }}
    </p>

    <p v-if="state.loading" data-testid="history-loading">Loading&hellip;</p>

    <section v-else class="history__panel">
      <ExpenseList
        :expenses="state.expenses"
        testid="expense-history"
        item-testid="history-row"
        empty-testid="history-empty-state"
        empty-message="Expenses you record will appear here."
      />
    </section>
  </main>
</template>

<style scoped>
.history {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.history__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}
.history__title {
  margin: 0;
  font-size: 1.5rem;
  color: #111827;
}
.history__count {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
}
.history__error {
  margin: 0;
  color: #dc2626;
}
.history__panel {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.25rem 1.5rem;
}
@media (max-width: 640px) {
  .history__title {
    font-size: 1.25rem;
  }
}
</style>
