import axios from 'axios'

/**
 * Single Axios instance for the whole app.
 *
 * Laravel Sanctum issues a bearer token at POST /api/login. We keep it in
 * localStorage and attach it to every request via a request interceptor, so
 * no component has to think about authentication headers.
 */
const api = axios.create({
  baseURL: '/api',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    // Laravel only returns a JSON 422 (rather than a redirect to the login
    // route) when the client asks for JSON.
    'X-Requested-With': 'XMLHttpRequest',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('expense_tracker_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export interface FieldErrors {
  [field: string]: string[]
}

export function extractFieldErrors(error: unknown): FieldErrors {
  const data = (error as { response?: { data?: { errors?: FieldErrors } } })?.response?.data
  return data?.errors ?? {}
}

export function extractMessage(error: unknown, fallback: string): string {
  const data = (
    error as { response?: { data?: { message?: string } } }
  )?.response?.data
  return data?.message ?? fallback
}

export default api
