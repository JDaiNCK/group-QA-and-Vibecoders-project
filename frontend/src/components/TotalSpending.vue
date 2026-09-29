<script setup lang="ts">
import { computed } from 'vue'

import { formatCurrency } from '@/utils/format'

const props = defineProps<{
  total: number
  loading?: boolean
}>()

const formatted = computed(() => formatCurrency(props.total))
</script>

<template>
  <section class="total" data-testid="total-spending" aria-labelledby="total-heading">
    <h2 id="total-heading" class="total__label">Total Spending</h2>

    <p
      v-if="loading"
      class="total__value total__value--loading"
      data-testid="total-spending-loading"
    >
      Loading&hellip;
    </p>

    <p
      v-else
      class="total__value"
      data-testid="total-spending-value"
      :data-amount="total"
    >
      {{ formatted }}
    </p>
  </section>
</template>

<style scoped>
.total {
  background: #1f2937;
  color: #f9fafb;
  border-radius: 0.75rem;
  padding: 1.25rem 1.5rem;
}
.total__label {
  margin: 0 0 0.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #9ca3af;
}
.total__value {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.total__value--loading {
  color: #9ca3af;
  font-size: 1.25rem;
}
</style>
