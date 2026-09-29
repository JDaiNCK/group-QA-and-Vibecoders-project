<script setup lang="ts">
import { computed, reactive, ref } from 'vue'

import { CATEGORIES, useExpenses, type Expense } from '@/stores/expenses'

const emit = defineEmits<{ saved: [expense: Expense] }>()

const { state, createExpense } = useExpenses()

const form = reactive({
  amount: '',
  category: '' as '' | (typeof CATEGORIES)[number],
  date: '',
})

/** Field-keyed validation messages, whether they came from the client or Laravel. */
const errors = ref<Record<string, string[]>>({})
const formError = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const firstError = (field: string): string | undefined => errors.value[field]?.[0]

const hasErrors = computed(() => Object.keys(errors.value).length > 0)

function clearFieldError(field: string): void {
  if (errors.value[field]) {
    const next = { ...errors.value }
    delete next[field]
    errors.value = next
  }
}

/**
 * Client-side validation deliberately covers required-ness only. Everything
 * else (numeric, positive, known category, real date) is left to Laravel so
 * the API stays the single source of truth for what a valid expense is.
 */
function validateRequiredFields(): boolean {
  const next: Record<string, string[]> = {}

  if (form.amount.trim() === '') {
    next.amount = ['The amount field is required.']
  }
  if (form.category === '') {
    next.category = ['The category field is required.']
  }
  if (form.date === '') {
    next.date = ['The date field is required.']
  }

  errors.value = next
  return Object.keys(next).length === 0
}

async function onSubmit(): Promise<void> {
  formError.value = null
  successMessage.value = null

  if (!validateRequiredFields()) {
    return
  }

  try {
    const created = await createExpense({
      amount: Number(form.amount),
      category: form.category,
      date: form.date,
    })

    emit('saved', created)
    successMessage.value = 'Expense saved.'
    form.amount = ''
    form.category = ''
    form.date = ''
    errors.value = {}
  } catch (caught) {
    if (typeof caught === 'object' && caught !== null) {
      errors.value = caught as Record<string, string[]>
    } else {
      formError.value = String(caught)
    }
  }
}
</script>

<template>
  <form class="expense-form" data-testid="expense-form" novalidate @submit.prevent="onSubmit">
    <h2 class="expense-form__title">Add Expense</h2>

    <div class="expense-form__field">
      <label for="amount">Amount</label>
      <input
        id="amount"
        v-model="form.amount"
        data-testid="amount-input"
        name="amount"
        type="text"
        inputmode="decimal"
        placeholder="e.g. 500"
        autocomplete="off"
        :aria-invalid="Boolean(firstError('amount'))"
        :class="{ 'field--invalid': firstError('amount') }"
        @input="clearFieldError('amount')"
      />
      <p v-if="firstError('amount')" class="field__error" data-testid="error-amount" role="alert">
        {{ firstError('amount') }}
      </p>
    </div>

    <div class="expense-form__field">
      <label for="category">Category</label>
      <select
        id="category"
        v-model="form.category"
        data-testid="category-select"
        name="category"
        :aria-invalid="Boolean(firstError('category'))"
        :class="{ 'field--invalid': firstError('category') }"
        @change="clearFieldError('category')"
      >
        <option value="" disabled>Select a category</option>
        <option v-for="category in CATEGORIES" :key="category" :value="category">
          {{ category }}
        </option>
      </select>
      <p
        v-if="firstError('category')"
        class="field__error"
        data-testid="error-category"
        role="alert"
      >
        {{ firstError('category') }}
      </p>
    </div>

    <div class="expense-form__field">
      <label for="date">Date</label>
      <input
        id="date"
        v-model="form.date"
        data-testid="date-input"
        name="date"
        type="date"
        :aria-invalid="Boolean(firstError('date'))"
        :class="{ 'field--invalid': firstError('date') }"
        @input="clearFieldError('date')"
      />
      <p v-if="firstError('date')" class="field__error" data-testid="error-date" role="alert">
        {{ firstError('date') }}
      </p>
    </div>

    <p v-if="formError" class="field__error" data-testid="form-error" role="alert">
      {{ formError }}
    </p>

    <p v-if="successMessage" class="expense-form__success" data-testid="save-success" role="status">
      {{ successMessage }}
    </p>

    <button
      class="expense-form__submit"
      data-testid="save-expense-button"
      type="submit"
      :disabled="state.saving"
    >
      {{ state.saving ? 'Saving…' : 'Save Expense' }}
    </button>
  </form>
</template>

<style scoped>
.expense-form {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}
.expense-form__title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
}
.expense-form__field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
.expense-form__field label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #374151;
}
.expense-form__field input,
.expense-form__field select {
  width: 100%;
  box-sizing: border-box;
  padding: 0.625rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-family: inherit;
  color: #111827;
  background: #ffffff;
}
.field--invalid {
  border-color: #dc2626;
  background: #fef2f2;
}
.field__error {
  margin: 0;
  color: #dc2626;
  font-size: 0.8125rem;
}
.expense-form__success {
  margin: 0;
  color: #047857;
  font-size: 0.875rem;
  font-weight: 600;
}
.expense-form__submit {
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0.5rem;
  background: #2563eb;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}
.expense-form__submit:disabled {
  background: #93c5fd;
  cursor: not-allowed;
}
</style>
