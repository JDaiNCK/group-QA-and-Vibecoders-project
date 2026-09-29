<script setup lang="ts">
import { onMounted, ref } from 'vue'

import ExpenseForm from '@/components/ExpenseForm.vue'
import ExpenseList from '@/components/ExpenseList.vue'
import TotalSpending from '@/components/TotalSpending.vue'
import { useExpenses, type Expense } from '@/stores/expenses'

const { state, total, recent, fetchExpenses } = useExpenses()

const formOpen = ref(false)

onMounted(fetchExpenses)

function onSaved(_expense: Expense): void {
  // The store already pushed the created expense, so the dashboard total and
  // recent list update from the response without a refetch.
}
</script>

<template>
  <main class="dashboard" data-testid="dashboard">
    <header class="dashboard__header">
      <h1 class="dashboard__title">Dashboard</h1>
      <button
        v-if="!formOpen"
        class="dashboard__add"
        data-testid="add-expense-button"
        type="button"
        @click="formOpen = true"
      >
        Add Expense
      </button>
    </header>

    <p v-if="state.error" class="dashboard__error" data-testid="load-error" role="alert">
      {{ state.error }}
    </p>

    <div class="dashboard__grid">
      <TotalSpending :total="total" :loading="state.loading" />

      <section class="panel">
        <h2 class="panel__title">Recent Expenses</h2>
        <p v-if="state.loading" data-testid="recent-expenses-loading">Loading&hellip;</p>
        <ExpenseList
          v-else
          :expenses="recent"
          testid="recent-expenses"
          item-testid="expense-item"
          empty-testid="empty-state"
        />
      </section>

      <section v-if="formOpen" class="panel" data-testid="form-panel">
        <ExpenseForm @saved="onSaved" />
        <button class="panel__close" data-testid="close-form-button" type="button" @click="formOpen = false">
          Cancel
        </button>
      </section>
    </div>
  </main>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.dashboard__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}
.dashboard__title {
  margin: 0;
  font-size: 1.5rem;
  color: #111827;
}
.dashboard__add {
  padding: 0.625rem 1rem;
  border: none;
  border-radius: 0.5rem;
  background: #2563eb;
  color: #ffffff;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}
.dashboard__error {
  margin: 0;
  color: #dc2626;
}
.dashboard__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.25rem;
  align-items: start;
}
.panel {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.25rem 1.5rem;
}
.panel__title {
  margin: 0 0 0.75rem;
  font-size: 1.125rem;
  color: #111827;
}
.panel__close {
  margin-top: 0.75rem;
  padding: 0.5rem 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  background: #ffffff;
  color: #374151;
  font-size: 0.875rem;
  cursor: pointer;
}
@media (max-width: 640px) {
  .dashboard__title {
    font-size: 1.25rem;
  }
  .dashboard__add {
    width: 100%;
  }
}
</style>
