// Verify Next.js static export (`output: 'export'`) consumption against the packed @hanzo/ui tarball.
//
// Installs `@hanzo/ui` from `pnpm pack` into an external temp app so Next 16 exercises
// real `package.json` `exports`, `'use client'` boundaries, `@hanzo/ui/next` (`withGui`),
// server-callable pure subpaths (`cn`, `@hanzo/ui/product/pure`, `@hanzo/ui/core`, `@hanzo/ui/tokens`),
// and bundled `styles.css` emission under `out/`.
import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const UI = dirname(dirname(fileURLToPath(import.meta.url)))
const PKGS = dirname(UI)
const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, {
    cwd,
    stdio: 'inherit',
    env: {
      ...process.env,
      npm_config_yes: 'true',
      npm_config_verify_deps_before_run: 'false',
      pnpm_config_verify_deps_before_run: 'false',
      NEXT_TELEMETRY_DISABLED: '1',
      CI: '1',
    },
  })

/** Pack every `workspace:` sibling @hanzo/ui depends on (transitively) into `dest`. */
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

function collectByExt(dir, ext, out = []) {
  if (!existsSync(dir)) return out
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) collectByExt(full, ext, out)
    else if (entry.name.endsWith(ext)) out.push(full)
  }
  return out
}

const app = mkdtempSync(join(tmpdir(), 'hanzo-ui-next-'))
try {
  const workspaceOverrides = packWorkspaceDeps(app)
  console.log('\n· packing @hanzo/ui')
  const beforeUi = new Set(readdirSync(app))
  run('pnpm', ['pack', '--pack-destination', app], UI)
  const tgz = readdirSync(app).find((f) => f.endsWith('.tgz') && !beforeUi.has(f))
  if (!tgz) throw new Error('pnpm pack produced no tarball')

  console.log(`· installing ${tgz} into ${app}`)
  cpSync(join(UI, 'test/consumer-next'), app, { recursive: true })
  if (Object.keys(workspaceOverrides).length) {
    const manifestPath = join(app, 'package.json')
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
    manifest.overrides = { ...(manifest.overrides ?? {}), ...workspaceOverrides }
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
  }
  run('npm', ['i', '--no-audit', '--no-fund', '--loglevel=error'], app)
  run('npm', ['i', '--no-audit', '--no-fund', '--loglevel=error', `./${tgz}`], app)

  console.log('· building Next.js static export app (`output: export`)')
  run('npx', ['next', 'build'], app)

  const outDir = join(app, 'out')
  const indexHtml = join(outDir, 'index.html')
  if (!existsSync(indexHtml)) throw new Error(`Next static export did not emit ${indexHtml}`)
  const html = readFileSync(indexHtml, 'utf8')
  if (!html.includes('@hanzo/ui Next.js Static Export'))
    throw new Error('Static export index.html is missing prerendered @hanzo/ui content')

  const cssFiles = collectByExt(join(outDir, '_next'), '.css')
  if (cssFiles.length === 0) throw new Error('Static export emitted zero CSS assets under out/_next')
  const hasMarker = cssFiles.some((file) => readFileSync(file, 'utf8').includes('--hanzo-ui-styles'))
  if (!hasMarker) throw new Error('Emitted Next.js static CSS is missing @hanzo/ui styles marker (--hanzo-ui-styles)')

  console.log(`\nnext static export consumer test passed (${cssFiles.length} CSS bundle(s)) against ${app}`)
  rmSync(app, { recursive: true, force: true })
} catch (err) {
  console.error(`\nnext static export consumer test FAILED. App kept for inspection: ${app}`)
  throw err
}
