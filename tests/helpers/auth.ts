import { expect, type Page } from '@playwright/test'

import { TEST_USER } from './env'

/**
 * Authenticates the browser exactly the way a real user does: by submitting
 * the login form, so the token lands in `localStorage` through the app's own
 * code path. The app is never modified to let tests skip authentication.
 */
export async function signIn(page: Page): Promise<void> {
  await page.goto('/login')
  await page.getByTestId('login-email').fill(TEST_USER.email)
  await page.getByTestId('login-password').fill(TEST_USER.password)
  await Promise.all([
    page.waitForURL((url) => !url.pathname.startsWith('/login')),
    page.getByTestId('login-submit').click(),
  ])
  await expect(page.getByTestId('dashboard')).toBeVisible()
}
