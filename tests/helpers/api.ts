import { expect, request, type APIRequestContext } from '@playwright/test'

import { API_BASE_URL, TEST_USER } from './env'

export interface ApiExpense {
  id: number
  amount: number
  category: string
  date: string
  created_at: string
}

let sharedContext: Promise<APIRequestContext> | null = null
let cachedToken: string | null = null

/**
 * A lazily-created API context for helpers that run outside a test's `page`
 * (currently none, but kept so the helper is safe to call standalone).
 */
function defaultContext(): Promise<APIRequestContext> {
  if (!sharedContext) {
    sharedContext = request.newContext({ baseURL: API_BASE_URL })
  }
  return sharedContext
}

/** Authenticates against the real Sanctum endpoint and returns a bearer token. */
export async function loginAsTestUser(context?: APIRequestContext): Promise<string> {
  if (cachedToken) {
    return cachedToken
  }

  const http = context ?? (await defaultContext())

  const response = await http.post(`${API_BASE_URL}/api/login`, {
    data: { email: TEST_USER.email, password: TEST_USER.password },
  })

  expect(response.status(), 'test user should be able to log in').toBe(200)

  const body = (await response.json()) as { token: string }
  expect(body.token).toBeTruthy()

  cachedToken = body.token
  return body.token
}

/** Creates an expense straight through the API, for arranging test state. */
export async function createExpenseViaApi(
  context: APIRequestContext,
  expense: { amount: number; category: string; date: string },
  token?: string,
): Promise<ApiExpense> {
  const authToken = token ?? (await loginAsTestUser(context))

  const response = await context.post(`${API_BASE_URL}/api/expenses`, {
    data: expense,
    headers: { Authorization: `Bearer ${authToken}` },
  })

  expect(response.status(), 'seeded expense should be created').toBe(201)

  const body = (await response.json()) as { data: ApiExpense }
  return body.data
}

/** Reads every expense for the test user, newest first. */
export async function listExpensesViaApi(
  context: APIRequestContext,
  token?: string,
): Promise<ApiExpense[]> {
  const authToken = token ?? (await loginAsTestUser(context))

  const response = await context.get(`${API_BASE_URL}/api/expenses`, {
    headers: { Authorization: `Bearer ${authToken}` },
  })

  expect(response.status()).toBe(200)

  const body = (await response.json()) as { data: ApiExpense[] }
  return body.data
}

/** Clears the module-level token cache so each suite run logs in afresh. */
export function clearCachedToken(): void {
  cachedToken = null
}
