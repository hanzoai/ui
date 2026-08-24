/* Materialize the `.d.cts` / `.d.mts` aliases a dual-format package promises.
 *
 * tsup used to emit these, through rollup-plugin-dts. That plugin reads `ts.sys`
 * at import time, and TypeScript 7 moved its compiler API behind `./unstable/*`,
 * so the dts worker now dies on load — before it writes anything — taking the
 * whole build with it. `tsc --emitDeclarationOnly` emits the same declarations
 * and is the compiler itself, so it is the one that survives the upgrade.
 *
 * What tsc will NOT do is emit the same declaration twice under two extensions.
 * It has no reason to: the ESM and CJS type surfaces of a tsup dual build are
 * the same types, and the second extension exists only so Node picks the right
 * one per condition. So the alias is a COPY, which is exactly what tsup did.
 *
 * The list is not configured here. It is read from the package's own `exports`,
 * so a subpath added to the manifest is covered without touching this file, and
 * a subpath removed stops being written. Nothing is invented: an alias appears
 * only where the emitted `.d.ts` beside it exists.
 *
 * Run from a package root: node ../../scripts/dts.mjs
 */
import { copyFileSync, existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))

/** Every declaration path the manifest promises, at any depth of the conditions tree. */
const promised = new Set()
const walk = (v) => {
  if (typeof v === 'string') {
    if (/\.d\.(ts|cts|mts)$/.test(v)) promised.add(v)
  } else if (v && typeof v === 'object') {
    for (const x of Object.values(v)) walk(x)
  }
}
walk(pkg.exports ?? {})
if (pkg.types) promised.add(pkg.types)

const wrote = []
const missing = []
for (const target of [...promised].sort()) {
  const abs = resolve(root, target)
  if (existsSync(abs)) continue
  // The alias only ever comes from the declaration tsc emitted at the same path.
  const source = abs.replace(/\.d\.(cts|mts)$/, '.d.ts')
  if (source !== abs && existsSync(source)) {
    copyFileSync(source, abs)
    wrote.push(target)
  } else {
    missing.push(target)
  }
}

if (wrote.length) console.log(`dts: aliased ${wrote.join(', ')}`)

// A subpath whose types are absent resolves to `any` for every consumer, and it
// does so quietly — the package installs, the import works, the checker stops
// checking. Failing here is the only moment that is loud.
if (missing.length) {
  console.error(`dts: no declaration emitted for ${missing.join(', ')}`)
  process.exit(1)
}
