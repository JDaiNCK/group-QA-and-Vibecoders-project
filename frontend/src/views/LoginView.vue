<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import api from '@/api/client'
import { useAuth } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const { setToken } = useAuth()

const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const submitting = ref(false)

async function onSubmit(): Promise<void> {
  error.value = null
  submitting.value = true

  try {
    const { data } = await api.post<{ token: string }>('/login', {
      email: email.value,
      password: password.value,
    })

    setToken(data.token)

    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.push(redirect)
  } catch {
    error.value = 'Invalid email or password.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <main class="login" data-testid="login-page">
    <form class="login__card" data-testid="login-form" novalidate @submit.prevent="onSubmit">
      <h1 class="login__title">Sign in</h1>

      <div class="login__field">
        <label for="email">Email</label>
        <input
          id="email"
          v-model="email"
          data-testid="login-email"
          name="email"
          type="email"
          autocomplete="username"
        />
      </div>

      <div class="login__field">
        <label for="password">Password</label>
        <input
          id="password"
          v-model="password"
          data-testid="login-password"
          name="password"
          type="password"
          autocomplete="current-password"
        />
      </div>

      <p v-if="error" class="login__error" data-testid="login-error" role="alert">{{ error }}</p>

      <button class="login__submit" data-testid="login-submit" type="submit" :disabled="submitting">
        {{ submitting ? 'Signing in…' : 'Sign in' }}
      </button>
    </form>
  </main>
</template>

<style scoped>
.login {
  display: flex;
  justify-content: center;
  padding-top: 3rem;
}
.login__card {
  width: 100%;
  max-width: 24rem;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}
.login__title {
  margin: 0;
  font-size: 1.25rem;
  color: #111827;
}
.login__field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
.login__field label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #374151;
}
.login__field input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.625rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-family: inherit;
}
.login__error {
  margin: 0;
  color: #dc2626;
  font-size: 0.875rem;
}
.login__submit {
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0.5rem;
  background: #2563eb;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}
.login__submit:disabled {
  background: #93c5fd;
  cursor: not-allowed;
}
</style>
