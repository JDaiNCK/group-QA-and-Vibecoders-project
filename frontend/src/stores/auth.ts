import { computed, readonly, ref } from 'vue'

const TOKEN_KEY = 'expense_tracker_token'

/**
 * Reactive authentication state.
 *
 * The token lives in localStorage, which is not reactive. Holding a ref in
 * sync with it means the header, the router guard and the views all re-render
 * when the user signs in or out.
 */
const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))

export function useAuth() {
  const isAuthenticated = computed(() => token.value !== null)

  function setToken(value: string): void {
    token.value = value
    localStorage.setItem(TOKEN_KEY, value)
  }

  function clearToken(): void {
    token.value = null
    localStorage.removeItem(TOKEN_KEY)
  }

  return {
    token: readonly(token),
    isAuthenticated,
    setToken,
    clearToken,
  }
}
