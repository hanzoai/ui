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

  server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
    cwd: app,
    stdio: 'ignore',
    detached: true,
  })
  for (let i = 0; ; i++) {
    try {
      await fetch(URL_)
      break
    } catch {
      if (i > 60) throw new Error(`consumer app never came up on ${URL_}`)
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
