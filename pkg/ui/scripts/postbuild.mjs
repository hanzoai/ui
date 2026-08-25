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
//
// TWO packages run this, and that is deliberate — @hanzo/data emits the same
// two formats with the same two problems, and a second copy of this file is a
// second place for the barrel rule below to be got wrong. The package root and
// its data modules are arguments:
//
//   node ../ui/scripts/postbuild.mjs <package-root> [data,modules,by,path]
//
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve as abs } from 'node:path'

const UI = process.argv[2] ? abs(process.argv[2]) : new URL('..', import.meta.url).pathname
const DIST = join(UI, 'dist')
const CJS = join(UI, 'dist-cjs')
const DIRECTIVE = "'use client';"

/**
 * Emitted modules that are data, not components — never stamped.
 *
 * Everything `product/pure` re-exports is on this list, and has to be: the point
 * of that subpath is that a rule loads anywhere a value loads, and a stamped
 * module is a client REFERENCE on React's server layer, not a function. Calling
 * `pages()` in a server component through a stamped module does not page — it
 * throws. `product/pure` names its own constituents, so this list is that list.
 */
const DATA = new Set(
  process.argv[3]
    ? process.argv[3].split(',').filter(Boolean)
    : [
        'gui-config',
        'core/tokens',
        'core/css',
        'framework/core',
        'glass',
        'product/social/api',
        'product/pure',
        'chat/pure',
        'chat/send',
        'chat/stick',
        'product/pages',
        'backends/gui/mask',
        'product/name',
        'product/tone',
        'product/scope',
        'product/brand',
        'product/animatedLogo.logic',
        'product/combobox/filter',
      ],
)

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
    if (/\.(js|cjs|mjs|json|css)$/.test(spec)) {
      // A source that writes its own `./names.js` is already fully specified, so
      // the ESM pass leaves it alone. The CJS pass cannot: `dist/names.js` is the
      // ESM emit, and a `.cjs` requiring it loads ESM under `require` and throws
      // `Unexpected token 'export'`. Retarget to the sibling this pass writes.
      const sibling = ext === '.cjs' && spec.endsWith('.js') && spec.slice(0, -3) + '.cjs'
      return sibling && existsSync(join(dirname(file), spec)) ? `${head}${q}${sibling}${q}` : m
    }
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

// ── A NODE ENTRY, because a stylesheet is not a module node can load ─────────
//
// `<Hanzo>` imports its own stylesheet, deliberately: the sheet is a real cached
// file rather than something inlined on every streaming flush. Node has no loader
// for `.css`, so ANY consumer whose test runner resolves this package under node
// fails to COLLECT — "Unknown file extension .css" against a package path, which
// reads as a broken dependency and is really a missing entry point. That is one
// broken suite per app, and there are dozens of apps.
//
// So the package publishes a node entry with the side effect removed. Nothing
// else differs: same components, same exports, same code. What it loses is the
// stylesheet, which a jsdom document could not have painted anyway; <Hanzo>'s
// dev-time check for `--hanzo-ui-styles` then reports the sheet missing, which is
// exactly what it should say and what root.test.tsx already declares a marker for.
{
  const root = join(DIST, 'root.js')
  const index = join(DIST, 'index.js')
  if (existsSync(root) && existsSync(index)) {
    const rootSrc = readFileSync(root, 'utf8').replace(
      /^\s*import\s+['"]\.\/styles\.css['"];?\s*$/m,
      "// styles.css is omitted from the node entry: node cannot load a stylesheet.",
    )
    writeFileSync(join(DIST, 'root.node.js'), rootSrc)
    const indexSrc = readFileSync(index, 'utf8').replace(/'\.\/root\.js'/g, "'./root.node.js'")
    writeFileSync(join(DIST, 'index.node.js'), indexSrc)
  }
}
