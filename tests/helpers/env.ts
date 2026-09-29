import { execFileSync } from 'node:child_process'
import path from 'node:path'

/** Repository root, resolved from this file rather than `process.cwd()`. */
export const repoRoot = path.resolve(__dirname, '..', '..')
export const backendDir = path.join(repoRoot, 'backend')
export const frontendDir = path.join(repoRoot, 'frontend')
export const phpBin = path.join(repoRoot, 'tools', 'php', 'php.exe')

/**
 * Dedicated SQLite database for the end-to-end suite. The suite never touches
 * `database/database.sqlite`, so a developer's local data is safe.
 */
export const e2eDatabase = path.join(backendDir, 'database', 'expense_tracker_test.sqlite')

export const API_BASE_URL = 'http://127.0.0.1:8000'
export const APP_BASE_URL = 'http://127.0.0.1:5173'

/** The seeded account from `TestUserSeeder`. */
export const TEST_USER = {
  email: 'tester@example.com',
  password: 'password',
} as const

/** Env that points Laravel at the end-to-end database. */
export function backendEnv(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    DB_CONNECTION: 'sqlite',
    DB_DATABASE: e2eDatabase,
    APP_ENV: 'local',
  }
}

/**
 * Truncates the expenses table so a test can assert on a known, empty state.
 * Uses the application's own Artisan command rather than touching the database
 * directly or adding a test-only HTTP route.
 */
export function resetExpenses(): void {
  execFileSync(phpBin, ['artisan', 'app:reset-test-expenses'], {
    cwd: backendDir,
    env: backendEnv(),
    stdio: 'pipe',
    encoding: 'utf-8',
  })
}
