#!/usr/bin/env node
/**
 * Development entry point for the Personal Expense Tracker.
 *
 *   node scripts/dev.mjs               start the API and the web app together
 *   node scripts/dev.mjs --api-only    start only the API against the e2e
 *                                      database (used by Playwright)
 *   node scripts/dev.mjs artisan  ...  run an Artisan command
 *   node scripts/dev.mjs composer ...  run Composer in backend/
 */
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const backendDir = path.join(root, 'backend')
const frontendDir = path.join(root, 'frontend')
const toolsDir = path.join(root, 'tools')
const composerPhar = path.join(toolsDir, 'composer.phar')
const viteBin = path.join(frontendDir, 'node_modules', 'vite', 'bin', 'vite.js')
const devDatabase = path.join(backendDir, 'database', 'database.sqlite')
const e2eDatabase = path.join(backendDir, 'database', 'expense_tracker_test.sqlite')

const API_PORT = process.env.EXPENSE_API_PORT ?? '8000'
const WEB_PORT = process.env.EXPENSE_WEB_PORT ?? '5173'

const CYAN = '\x1b[36m'
const MAGENTA = '\x1b[35m'
const RESET = '\x1b[0m'

function fail(...lines) {
  console.error(['', ...lines, ''].join('\n'))
  process.exit(1)
}

/** The repo-local PHP, downloaded on first use so a fresh clone just works. */
function php() {
  const portable = path.join(toolsDir, 'php', process.platform === 'win32' ? 'php.exe' : 'php')
  if (existsSync(portable)) return portable
  if (process.platform !== 'win32' && hasSystemPhp()) return 'php'

  installPortablePhp()
  if (existsSync(portable)) return portable

  fail(
    'PHP is not available and could not be installed automatically.',
    `Expected: ${portable}`,
    'Run this by hand:  npm run setup:php',
  )
}

function hasSystemPhp() {
  return spawnSync('php', ['--version'], { stdio: 'ignore' }).status === 0
}

/**
 * tools/ is gitignored, so a fresh clone has no PHP. Install the portable
 * copy rather than failing, since every entry point needs it.
 */
function installPortablePhp() {
  const script = path.join(toolsDir, 'setup-php.ps1')
  if (!existsSync(script)) {
    fail(`Cannot install PHP: ${script} is missing from the repository.`)
  }

  console.log('\nPHP is not installed yet. Fetching the portable runtime (one-time, ~1 min)...\n')

  const shell = process.platform === 'win32' ? 'powershell' : 'pwsh'
  const status = spawnSync(shell, ['-ExecutionPolicy', 'Bypass', '-File', script], {
    stdio: 'inherit',
  }).status

  if (status !== 0) {
    fail(
      'The portable PHP installer failed.',
      'Check your internet connection, or run it by hand:  npm run setup:php',
    )
  }
}

function artisan(args, env = {}) {
  // Without Composer dependencies, Artisan dies on a missing autoloader and
  // buries the real cause under a stack trace.
  if (!existsSync(path.join(backendDir, 'vendor', 'autoload.php'))) {
    fail(
      'Laravel dependencies are not installed yet.',
      'Run:  npm run setup',
    )
  }

  return spawnSync(php(), ['artisan', ...args], {
    cwd: backendDir,
    stdio: 'inherit',
    env: { ...process.env, ...env },
  }).status
}

function runComposer(args) {
  if (!existsSync(composerPhar)) {
    fail(`Composer was not found at ${composerPhar}`, 'Run:  npm run setup:php')
  }
  return spawnSync(php(), [composerPhar, ...args], {
    cwd: backendDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      COMPOSER_HOME: path.join(toolsDir, 'composer-home'),
      COMPOSER_ALLOW_SUPERUSER: '1',
    },
  }).status
}

/** npm needs a shell on Windows; Node refuses to spawn npm.cmd directly. */
function npm(args, cwd) {
  return spawnSync('npm', args, { cwd, stdio: 'inherit', shell: true }).status
}

function serve(env = {}) {
  const child = spawn(
    php(),
    ['artisan', 'serve', '--host=127.0.0.1', `--port=${API_PORT}`],
    { cwd: backendDir, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, ...env } },
  )

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => child.kill())
  }

  return child
}

/** Prefixes each line so concurrent servers stay distinguishable. */
function pipe(stream, label, colour) {
  let buffer = ''
  stream.setEncoding('utf8')
  stream.on('data', (chunk) => {
    buffer += chunk
    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop() ?? ''
    for (const line of lines) process.stdout.write(`${colour}${label}${RESET} ${line}\n`)
  })
  stream.on('end', () => {
    if (buffer) process.stdout.write(`${colour}${label}${RESET} ${buffer}\n`)
  })
}

function startApiOnly() {
  if (!existsSync(e2eDatabase)) writeFileSync(e2eDatabase, '')

  const env = { DB_CONNECTION: 'sqlite', DB_DATABASE: e2eDatabase, APP_ENV: 'local' }

  if (artisan(['migrate', '--force'], env) !== 0) process.exit(1)
  if (artisan(['db:seed', '--force', '--class=Database\\Seeders\\TestUserSeeder'], env) !== 0) {
    process.exit(1)
  }

  console.log(`[e2e] database ready at ${e2eDatabase}`)
  serve(env).on('exit', (code) => process.exit(code ?? 0))
}

function startBoth() {
  if (!existsSync(devDatabase)) {
    fail('The development database is missing.', `Expected: ${devDatabase}`, 'Run:  npm run db:migrate')
  }
  if (!existsSync(viteBin)) {
    fail('Vite is not installed.', `Expected: ${viteBin}`, 'Run:  npm --prefix frontend install')
  }

  // Vite runs through the current Node binary: Node refuses to spawn npm.cmd
  // without a shell (EINVAL), and this guarantees the Node that installed the
  // dependencies is the one running them.
  const servers = [
    { child: serve(), label: 'api', colour: CYAN },
    {
      child: spawn(process.execPath, [viteBin, '--port', WEB_PORT, '--strictPort'], {
        cwd: frontendDir,
        stdio: ['ignore', 'pipe', 'pipe'],
      }),
      label: 'web',
      colour: MAGENTA,
    },
  ]

  let stopping = false
  function shutdown(code, message) {
    if (stopping) return
    stopping = true
    if (message) console.error(`\n${message}`)
    for (const { child } of servers) child.kill()
    process.exit(code)
  }

  for (const { child, label, colour } of servers) {
    pipe(child.stdout, label, colour)
    pipe(child.stderr, label, colour)
    child.on('exit', (code, signal) => {
      shutdown(
        typeof code === 'number' && code !== 0 ? code : 1,
        `${label} exited (${signal ?? `code ${code}`}).`,
      )
    })
  }

  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => shutdown(0))

  setTimeout(() => {
    console.log(
      [
        '',
        `  App   http://127.0.0.1:${WEB_PORT}`,
        `  API   http://127.0.0.1:${API_PORT}/api`,
        '  Sign in with  tester@example.com / password',
        '',
        '  Ctrl+C stops both servers.',
        '',
      ].join('\n'),
    )
  }, 1500)
}

const [mode, ...rest] = process.argv.slice(2)

switch (mode) {
  case 'artisan':
    process.exit(artisan(rest))
    break

  case 'composer': {
    // php() bootstraps the portable runtime, which also fetches composer.phar.
    php()
    process.exit(runComposer(rest.length ? rest : ['install']))
    break
  }

  // One-shot bootstrap for a fresh clone: runtime, dependencies, database.
  case 'setup': {
    php()

    if (!existsSync(path.join(backendDir, 'vendor'))) {
      console.log('\nInstalling Laravel dependencies...\n')
      if (runComposer(['install']) !== 0) process.exit(1)
    }

    if (!existsSync(path.join(frontendDir, 'node_modules'))) {
      console.log('\nInstalling frontend dependencies...\n')
      if (npm(['install'], frontendDir) !== 0) process.exit(1)
    }

    if (artisan(['migrate', '--seed', '--force']) !== 0) process.exit(1)

    console.log('\nSetup complete. Start the app with:  npm start\n')
    break
  }

  case '--api-only':
    startApiOnly()
    break

  default:
    startBoth()
}
