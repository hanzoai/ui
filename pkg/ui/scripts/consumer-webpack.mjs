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
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const UI = dirname(dirname(fileURLToPath(import.meta.url)))
const PKGS = dirname(UI)
const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, stdio: 'inherit', env: { ...process.env, npm_config_yes: 'true' } })

/** Pack every `workspace:` sibling @hanzo/ui depends on (transitively) into `app`
 *  and return an npm `overrides` map so unpublished sibling versions resolve locally. */
function packWorkspaceDeps(dest) {
  const byName = new Map()
  for (const entry of readdirSync(PKGS, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const dir = join(PKGS, entry.name)
    const pj = join(dir, 'package.json')
    if (!existsSync(pj)) continue
    const manifest = JSON.parse(readFileSync(pj, 'utf8'))
    if (manifest.name) byName.set(manifest.name, { dir, manifest })
  }
  const overrides = {}
  const visited = new Set()
  const visit = (manifest) => {
    for (const [dep, range] of Object.entries(manifest.dependencies ?? {})) {
      if (typeof range !== 'string' || !range.startsWith('workspace:') || visited.has(dep)) continue
      const sibling = byName.get(dep)
      if (!sibling) continue
      visited.add(dep)
      visit(sibling.manifest)
      const before = new Set(readdirSync(dest))
      console.log(`· packing workspace dep ${dep}`)
      run('pnpm', ['pack', '--pack-destination', dest], sibling.dir)
      const tgz = readdirSync(dest).find((f) => f.endsWith('.tgz') && !before.has(f))
      if (!tgz) throw new Error(`pnpm pack produced no tarball for ${dep}`)
      overrides[dep] = `file:./${tgz}`
    }
  }
  visit(JSON.parse(readFileSync(join(UI, 'package.json'), 'utf8')))
  return overrides
}

const app = mkdtempSync(join(tmpdir(), 'hanzo-ui-webpack-'))
try {
  const workspaceOverrides = packWorkspaceDeps(app)
  console.log(`\n· packing @hanzo/ui`)
  const beforeUi = new Set(readdirSync(app))
  run('pnpm', ['pack', '--pack-destination', app], UI)
  const tgz = readdirSync(app).find((f) => f.endsWith('.tgz') && !beforeUi.has(f))
  if (!tgz) throw new Error('pnpm pack produced no tarball')

  console.log(`· installing ${tgz} into ${app}`)
  cpSync(join(UI, 'test/consumer-webpack'), app, { recursive: true })
  if (Object.keys(workspaceOverrides).length) {
    const manifestPath = join(app, 'package.json')
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
    manifest.overrides = { ...(manifest.overrides ?? {}), ...workspaceOverrides }
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
  }
  // Errors only, not --silent: --silent also swallows npm's own reason, and a
  // failed install then reads as a bare exit code, which is all the stale npm
  // cache of November 2026 ever showed here.
  run('npm', ['i', '--no-audit', '--no-fund', '--loglevel=error'], app)
  run('npm', ['i', '--no-audit', '--no-fund', '--loglevel=error', `./${tgz}`], app)

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
