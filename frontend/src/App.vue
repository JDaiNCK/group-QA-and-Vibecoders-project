<script setup lang="ts">
import { RouterLink, RouterView, useRouter } from 'vue-router'

import api from '@/api/client'
import { useAuth } from '@/stores/auth'

const router = useRouter()
const { isAuthenticated, clearToken } = useAuth()

async function logout(): Promise<void> {
  try {
    await api.post('/logout')
  } catch {
    // Revoking the token is best effort; the local credential is cleared either way.
  }
  clearToken()
  await router.push({ name: 'login' })
}
</script>

<template>
  <div class="app" data-testid="app-root">
    <header class="app__header">
      <span class="app__brand">Expense Tracker</span>

      <nav v-if="isAuthenticated" class="app__nav" data-testid="app-nav">
        <RouterLink class="app__link" data-testid="nav-dashboard" to="/">Dashboard</RouterLink>
        <RouterLink class="app__link" data-testid="nav-history" to="/expenses">History</RouterLink>
        <button class="app__logout" data-testid="logout-button" type="button" @click="logout">
          Sign out
        </button>
      </nav>
    </header>

    <div class="app__container">
      <RouterView />
    </div>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.app__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  flex-wrap: wrap;
}
.app__brand {
  font-weight: 700;
  color: #111827;
}
.app__nav {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.app__link {
  color: #374151;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9375rem;
}
.app__link.router-link-active {
  color: #2563eb;
}
.app__logout {
  padding: 0.375rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  background: #ffffff;
  color: #374151;
  font-size: 0.875rem;
  cursor: pointer;
}
.app__container {
  flex: 1;
  width: 100%;
  max-width: 72rem;
  margin: 0 auto;
  padding: 1.5rem;
  box-sizing: border-box;
}
@media (max-width: 640px) {
  .app__header {
    padding: 0.875rem 1rem;
  }
  .app__container {
    padding: 1rem;
  }
  .app__nav {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
