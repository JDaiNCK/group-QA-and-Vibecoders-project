import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end configuration for the Personal Expense Tracker.
 *
 * The suite drives two real servers: the Laravel API and the Vue dev server.
 * Nothing is mocked, so every assertion exercises the real stack.
 */
export default defineConfig({
  testDir: './tests',
  testMatch: /.*\.spec\.ts/,

  globalSetup: './tests/global-setup.ts',

  // The suite shares one SQLite database, so tests must not run concurrently.
  // Isolation comes from resetting state per test (see tests/helpers/env.ts),
  // not from parallelism.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,

  timeout: 30_000,
  expect: {
    timeout: 7_000,
  },

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],

  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } },
    },
  ],

  webServer: [
    {
      // Prepares the dedicated e2e database, then serves the Laravel API.
      command: 'node scripts/dev.mjs --api-only',
      url: 'http://127.0.0.1:8000/up',
      cwd: __dirname,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: 'npm run dev',
      cwd: 'frontend',
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
})
