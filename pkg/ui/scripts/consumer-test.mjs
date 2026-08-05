// Install @hanzo/ui the way a stranger would, render it, and look at the result.
//
// `pnpm pack` -> a temp directory OUTSIDE this repo -> `npm i ./hanzo-ui-*.tgz`
// -> `vite build` -> serve -> playwright. Not a workspace link: a link resolves
// through src/ and hides every packaging defect there is — a file missing from
// `files`, a subpath missing from `exports`, a `workspace:*` that npm never
// rewrote (8.0.17 and 8.0.19 shipped exactly that), a stylesheet that is
// generated and never packed.
//
// `pnpm pack` runs `prepack`, which builds — so the tarball is always the
// current tree and there is no way to test a stale one by accident.
import { execFileSync, spawn } from 'node:child_process'
import { cpSync, mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const UI = dirname(dirname(fileURLToPath(import.meta.url)))
const PORT = Number(process.env.CONSUMER_PORT ?? 4390)
// The address is STATED, not inferred — see the `--host 127.0.0.1` below, which
// is the whole reason this gate can go green. Keep the three literals (here, the
// spawn, and playwright.config.ts's baseURL) equal.
const URL_ = `http://127.0.0.1:${PORT}`

const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, stdio: 'inherit', env: { ...process.env, npm_config_yes: 'true' } })

const app = mkdtempSync(join(tmpdir(), 'hanzo-ui-consumer-'))
let server
try {
  console.log(`\n· packing @hanzo/ui`)
  run('pnpm', ['pack', '--pack-destination', app], UI)
  const tgz = readdirSync(app).find((f) => f.endsWith('.tgz'))
  if (!tgz) throw new Error('pnpm pack produced no tarball')

  console.log(`· installing ${tgz} into ${app}`)
  cpSync(join(UI, 'test/consumer'), app, { recursive: true })
  run('npm', ['i', '--no-audit', '--no-fund', '--silent'], app)
  run('npm', ['i', '--no-audit', '--no-fund', '--silent', `./${tgz}`], app)

  // ONE COPY of the gui runtime, or nothing below means anything.
  //
  // @hanzogui packages pin each other EXACTLY (toast@8.0.0 -> core@8.0.0, no
  // caret), so a single stale range in this package's dependencies drags a whole
  // second generation of the train in beside the consumer's. Both typecheck.
  // Both build. Then the config singleton lives in one copy and the components
  // read the other, and the app dies on prerender with `Missing theme.` —
  // hanzo.ai hit exactly that and had to state the invariant by hand in a
  // pnpm.overrides block.
  //
  // The invariant belongs HERE, in the package that caused it. `npm ls` prints
  // one line per resolved copy; more than one distinct version is the defect.
  {
    const out = execFileSync('npm', ['ls', '@hanzogui/web', '--all', '--json'], {
      cwd: app,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    const found = new Set()
    const walk = (node) => {
      if (!node || typeof node !== 'object') return
      if (node.version && node._name === '@hanzogui/web') found.add(node.version)
      for (const [name, child] of Object.entries(node.dependencies ?? {})) {
        if (name === '@hanzogui/web' && child.version) found.add(child.version)
        walk(child)
      }
    }
    walk(JSON.parse(out))
    console.log(`· @hanzogui/web copies: ${[...found].join(', ') || 'none'}`)
    if (found.size > 1)
      throw new Error(
        `${found.size} copies of @hanzogui/web resolved in the consumer: ${[...found].join(', ')}.\n` +
          `  The gui runtime must resolve to ONE copy. Two generations means the config\n` +
          `  singleton and the components live in different modules, which typechecks,\n` +
          `  builds, and then dies on prerender with "Missing theme.".\n` +
          `  Fix the @hanzogui/* ranges in this package rather than overriding downstream.`,
      )
  }

  console.log(`· building the consumer app`)
  run('npx', ['vite', 'build'], app)

  // Someone else on this port answers every request and the suite passes against
  // THEIR app — which is how a run once reported stale failures from a preview
  // server left over from the previous run. `--strictPort` refuses to bind, but
  // nothing downstream would have noticed.
  const taken = await fetch(URL_).then(
    () => true,
    () => false,
  )
  if (taken) throw new Error(`${URL_} is already serving something. Free it, or set CONSUMER_PORT.`)

  // `--host 127.0.0.1` STATES the interface instead of leaving it to be
  // inferred, and the inference is what kept this gate red. Vite picks its own
  // default and resolves `localhost` through the platform's resolver, so the
  // address it listens on differs by machine: on macOS it bound [::1] only and
  // 127.0.0.1 refused; on the Linux runner it did the opposite and `localhost`
  // was the one that never answered. Either way the poll below counted to 60
  // and reported the app as broken, after the pack, the install and the build
  // had all succeeded.
  //
  // Named here, both ends agree by construction — this, the poll, and
  // playwright.config.ts's baseURL are the same literal on every platform.
  server = spawn(
    'npx',
    ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'],
    { cwd: app, stdio: ['ignore', 'pipe', 'pipe'], detached: true },
  )

  // The server's own account of itself, kept rather than discarded.
  //
  // This was `stdio: 'ignore'`, so a preview that died on startup and one that
  // was merely slow produced the identical message 30 seconds apart — on a CI
  // runner nobody can attach to. Three runs were spent guessing at a cause vite
  // had printed on the first one. Whatever it says, the failure says it too.
  let said = ''
  const keep = (d) => (said += d)
  server.stdout.on('data', keep)
  server.stderr.on('data', keep)

  // A process that has already exited is never going to answer, so waiting the
  // full 30s for it teaches nothing.
  let dead = null
  server.on('exit', (code, signal) => (dead = signal ?? `exit ${code}`))

  const withLog = (msg) => new Error(`${msg}\n--- vite preview said ---\n${said.trim() || '(nothing)'}`)
  for (let i = 0; ; i++) {
    try {
      await fetch(URL_)
      break
    } catch {
      if (dead) throw withLog(`vite preview died (${dead}) before serving ${URL_}`)
      if (i > 60) throw withLog(`consumer app never came up on ${URL_}`)
      await new Promise((r) => setTimeout(r, 500))
    }
  }

  console.log(`· asserting computed styles in a browser\n`)
  run('npx', ['playwright', 'test', ...process.argv.slice(2)], UI)
  console.log(`\nconsumer test passed against ${app}`)
} finally {
  if (server?.pid) try { process.kill(-server.pid) } catch {}
  if (!process.env.KEEP_CONSUMER_APP) rmSync(app, { recursive: true, force: true })
  else console.log(`kept ${app}`)
}
