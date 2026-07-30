// Make tsc's per-file emit shippable. Two orthogonal passes, one walk each.
//
//   1. specifiers — tsc copies relative import specifiers through verbatim, so
//      `./button` stays extensionless. Node ESM and strict bundlers demand a
//      fully-specified path, so every relative specifier is resolved against
//      what was actually emitted: `./button` -> `./button.js` or `./x/index.js`.
//   2. 'use client' — the component layer is client-side @hanzo/gui UI, and Next's
//      flight-client loader needs the directive as the FIRST statement of every
//      such module. Prepended without a newline so source-map line numbers hold.
//      DATA modules are excluded (see DATA below): a token scale or a gui config
//      is data, not a component, and stamping it means React's SERVER layer can
//      only hold a client REFERENCE to it — so `createGui()` never runs in a
//      prerender, `configureMedia()` never sets its state, and the first
//      `useMedia()` proxies `undefined`. Data has to stay executable everywhere.
//
// The CJS half is compiled to dist-cjs (tsc cannot emit two module formats to
// one outDir) and folded into dist as `.cjs` here.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'

const UI = new URL('..', import.meta.url).pathname
const DIST = join(UI, 'dist')
const CJS = join(UI, 'dist-cjs')
const DIRECTIVE = "'use client';"

/** Emitted modules that are data, not components — never stamped. */
const DATA = new Set(['gui-config', 'core/tokens', 'framework/core', 'product/social/api'])

const files = (dir, out = []) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    statSync(p).isDirectory() ? files(p, out) : out.push(p)
  }
  return out
}

// `from './x'`, `import './x'`, `import('./x')`, `require('./x')`
const SPECIFIER = /(\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*)(['"])(\.[^'"]*)\2/g

/** Resolve `spec` (relative, extensionless) against what tsc emitted next to `file`. */
const resolve = (file, spec, ext, probe) => {
  const base = join(dirname(file), spec)
  if (existsSync(base + probe)) return spec + ext
  if (existsSync(join(base, 'index' + probe))) return `${spec}/index${ext}`
  return null
}

const specifiers = (file, ext, probe) => {
  const src = readFileSync(file, 'utf8')
  const out = src.replace(SPECIFIER, (m, head, q, spec) => {
    if (/\.(js|cjs|mjs|json|css)$/.test(spec)) return m
    const fixed = resolve(file, spec, ext, probe)
    if (!fixed) throw new Error(`unresolved specifier ${spec} in ${relative(UI, file)}`)
    return `${head}${q}${fixed}${q}`
  })
  if (out !== src) writeFileSync(file, out)
}

// A module whose statements are ONLY import/export is a barrel: the client
// boundary belongs to the leaves it re-exports, which carry their own
// directive. Stamping the barrel itself makes it a client module, and Next's
// flight loader hard-errors on `export *` inside a client boundary — which is
// exactly how 8.0.32 broke every Next 16 consumer at `dist/index.js`.
const reexportOnly = (src) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '')
    .replace(/(?:import|export)[^;'"]*from\s*['"][^'"]*['"];?/g, '')
    .replace(/import\s*['"][^'"]*['"];?/g, '')
    .replace(/export\s*\{[\s\S]*?\};?/g, '')
    .trim() === ''

const useClient = (file) => {
  if (DATA.has(relative(DIST, file).replace(/\.(js|cjs)$/, ''))) return
  const src = readFileSync(file, 'utf8')
  if (reexportOnly(src)) return
  if (!/^['"]use client['"]/.test(src)) writeFileSync(file, DIRECTIVE + src)
}

// ESM + declarations.
for (const f of files(DIST)) {
  if (f.endsWith('.d.ts')) specifiers(f, '.js', '.d.ts')
  else if (f.endsWith('.js')) specifiers(f, '.js', '.js')
}

// CJS: rewrite in place, then fold into dist as `.cjs`.
if (existsSync(CJS)) {
  for (const f of files(CJS)) if (f.endsWith('.js')) specifiers(f, '.cjs', '.js')
  for (const f of files(CJS)) {
    if (!f.endsWith('.js')) continue
    const dest = join(DIST, relative(CJS, f)).replace(/\.js$/, '.cjs')
    mkdirSync(dirname(dest), { recursive: true })
    cpSync(f, dest)
  }
  rmSync(CJS, { recursive: true, force: true })
}

for (const f of files(DIST)) if (/\.(js|cjs)$/.test(f)) useClient(f)
