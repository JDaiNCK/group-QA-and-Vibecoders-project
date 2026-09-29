import { execFileSync } from 'node:child_process'

import { backendDir, e2eDatabase, phpBin, backendEnv } from './helpers/env'

/**
 * Prepares the end-to-end database before the suite runs:
 *   1. create the SQLite file if missing
 *   2. run migrations
 *   3. seed the fixed test user
 *   4. clear any expenses left over from a previous run
 */
function globalSetup(): void {
  const run = (args: string[]) =>
    execFileSync(phpBin, ['artisan', ...args], {
      cwd: backendDir,
      env: backendEnv(),
      stdio: 'pipe',
      encoding: 'utf-8',
    })

  run(['migrate', '--force'])
  run(['db:seed', '--force', '--class=Database\\Seeders\\TestUserSeeder'])
  run(['app:reset-test-expenses'])

  // eslint-disable-next-line no-console
  console.log(`[e2e] database ready at ${e2eDatabase}`)
}

export default globalSetup
