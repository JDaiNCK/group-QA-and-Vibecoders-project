import { execFileSync, spawn } from 'node:child_process'
import { existsSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '..')
const backendDir = path.join(repoRoot, 'backend')
const phpBin = path.join(repoRoot, 'tools', 'php', 'php.exe')

const dbPath = path.join(backendDir, 'database', 'expense_tracker_test.sqlite')
const port = '8000'

if (!existsSync(phpBin)) {
  console.error(
    `[e2e] Portable PHP not found at ${phpBin}.\n` +
      `      Run tools/setup-php.ps1 before starting the test servers.`,
  )
  process.exit(1)
}

if (!existsSync(dbPath)) {
  writeFileSync(dbPath, '')
}

const env = {
  ...process.env,
  DB_CONNECTION: 'sqlite',
  DB_DATABASE: dbPath,
  APP_ENV: 'local',
}

function artisan(args) {
  return execFileSync(phpBin, ['artisan', ...args], {
    cwd: backendDir,
    env,
    stdio: 'pipe',
    encoding: 'utf-8',
  })
}

// Bring the schema and the fixed test user up to date before accepting traffic.
artisan(['migrate', '--force'])
artisan(['db:seed', '--force', '--class=Database\\Seeders\\TestUserSeeder'])

const server = spawn(
  phpBin,
  ['artisan', 'serve', `--host=127.0.0.1`, `--port=${port}`],
  {
    cwd: backendDir,
    env,
    stdio: 'inherit',
  },
)

const stop = () => server.kill()
process.on('SIGINT', stop)
process.on('SIGTERM', stop)

server.on('exit', (code) => process.exit(code ?? 0))
