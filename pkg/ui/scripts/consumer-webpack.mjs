// The webpack half of the consumer test. Same install-a-stranger's-tarball
// discipline as consumer-test.mjs, different bundler — because the two disagree
// about a whole class of defect and only one of them was ever asked.
//
// 8.0.46 shipped a stylesheet whose @font-face pointed at
// leaves an unresolvable url() alone and the Vite consumer went green; webpack's
// css-loader resolves it against the declaring file and fails the build:
//
//
// hanzo.app found that, not this suite. So the suite now runs both.
//
// The assertion is the build itself. This defect is a BUILD failure, never a
// render failure — there is nothing to measure in a browser, and a passing
// `webpack --mode production` is the whole proof.
import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const UI = dirname(dirname(fileURLToPath(import.meta.url)))
const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, stdio: 'inherit', env: { ...process.env, npm_config_yes: 'true' } })

const app = mkdtempSync(join(tmpdir(), 'hanzo-ui-webpack-'))
try {
  console.log(`\n· packing @hanzo/ui`)
  run('pnpm', ['pack', '--pack-destination', app], UI)
  const tgz = readdirSync(app).find((f) => f.endsWith('.tgz'))
  if (!tgz) throw new Error('pnpm pack produced no tarball')

  console.log(`· installing ${tgz} into ${app}`)
  cpSync(join(UI, 'test/consumer-webpack'), app, { recursive: true })
  run('npm', ['i', '--no-audit', '--no-fund', '--silent'], app)
  run('npm', ['i', '--no-audit', '--no-fund', '--silent', `./${tgz}`], app)

  console.log(`· building with webpack + css-loader`)
  run('npx', ['webpack', '--mode', 'production'], app)
  console.log(`\nwebpack consumer test passed against ${app}`)
  rmSync(app, { recursive: true, force: true })
} catch (err) {
  // Kept on disk on failure: the tarball and the resolved node_modules are the
  // evidence, and deleting them is how a packaging bug becomes unreproducible.
  console.error(`\nwebpack consumer test FAILED. App kept for inspection: ${app}`)
  throw err
}
