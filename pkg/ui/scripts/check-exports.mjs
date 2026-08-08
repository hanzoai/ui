// A package's exports map is a set of PROMISES, and this keeps them.
//
// `@hanzo/appearance@0.1.0` advertised a `require` condition on both its
// subpaths. The files were there, tsc emitted them, `pnpm build` and `pnpm test`
// were green — and every one of those requires threw, because the `.cjs` half
// requires `@hanzo/design`, which is ESM-only and exposes no `require`
// condition at all. The promise was checkable and nobody checked it.
//
// So: for every subpath, for every condition, LOAD the file the way a consumer
// reached through that condition would. `import()` for import/default, a real
// `require()` for require. Existence is not enough — the design bug was a file
// that existed and could not be loaded.
//
//   node ../ui/scripts/check-exports.mjs <package-root>
//
// Wildcard subpaths (`./tokens/*`) name a directory, not a module: the pattern
// is checked to point somewhere real and then skipped, since there is no single
// artifact to load.
//
// SCOPE — this runs in bare Node, so it belongs to packages whose target IS bare
// Node. @hanzo/ui is NOT one: its CJS transitively requires `react-native`,
// whose entry is Flow (`import typeof * as …`) and unparseable, because a
// bundler or jest aliases `react-native` -> `react-native-web` and bare Node has
// no alias. Point this at @hanzo/ui and 17 of its 26 require-subpaths "fail"
// while working perfectly for every real consumer — chat's jest setup requires
// one of them. Two failure kinds, and only one is portable:
//
//   MANIFEST  ERR_PACKAGE_PATH_NOT_EXPORTED / ERR_MODULE_NOT_FOUND — the map is
//             wrong. No bundler config repairs it. This is the appearance bug.
//   LOAD      anything the module threw while executing — may only mean the
//             probe ran somewhere the package was never meant to load.
//
// Both fail the build (a package should be able to load its own artifact), but
// the message says which, so the next reader does not "fix" a working package.

import { createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve as abs } from 'node:path'
import { pathToFileURL } from 'node:url'

const ROOT = abs(process.argv[2] ?? '.')
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
const fail = []
const ok = []

/** Every (subpath, condition, target) triple the map promises. */
function* promises(node, subpath, condition = 'default') {
  if (typeof node === 'string') return yield { subpath, condition, target: node }
  if (!node || typeof node !== 'object') return
  for (const [k, v] of Object.entries(node)) {
    // Nested keys are either conditions ("import") or subpaths ("./state").
    yield* promises(v, k.startsWith('.') ? k : subpath, k.startsWith('.') ? condition : k)
  }
}

// A require() runs arbitrary module top-level code, so it goes in its own
// process: a package that hangs on load must fail this check, not wedge it.
const requires = (spec) =>
  execFileSync(process.execPath, ['-e', `require(${JSON.stringify(spec)})`], {
    cwd: ROOT,
    timeout: 30_000,
    stdio: 'pipe',
  })

for (const { subpath, condition, target } of promises(pkg.exports ?? {}, '.')) {
  if (condition === 'types') continue // a .d.ts is for tsc, not a loader
  const where = `${subpath} [${condition}]`

  if (target.includes('*')) {
    const dir = join(ROOT, dirname(target.split('*')[0]))
    existsSync(dir) ? ok.push(`${where} -> ${target} (pattern)`) : fail.push(`${where}: pattern points at a missing directory: ${target}`)
    continue
  }

  const file = join(ROOT, target)
  if (!existsSync(file)) {
    fail.push(`${where}: ${target} does not exist`)
    continue
  }
  if (!/\.(js|cjs|mjs)$/.test(target)) {
    ok.push(`${where} -> ${target} (asset)`)
    continue
  }

  try {
    if (condition === 'require') requires(join(ROOT, target))
    else await import(pathToFileURL(file).href)
    ok.push(`${where} -> ${target}`)
  } catch (e) {
    const why = (e.stderr?.toString().split('\n').find((l) => /Error/.test(l)) ?? e.message).trim()
    // RESOLUTION failed vs the module EXECUTED and threw. Only the first is
    // portable: a specifier that will not resolve will not resolve anywhere, and
    // no bundler alias repairs it. The blame may sit in a DEPENDENCY's exports
    // map rather than this one — appearance 0.1.0's own map was fine, it was
    // design's that had no `require` — so this says what failed, not whose fault.
    const unresolvable =
      /ERR_PACKAGE_PATH_NOT_EXPORTED|ERR_MODULE_NOT_FOUND|MODULE_NOT_FOUND|ERR_UNSUPPORTED_DIR_IMPORT|Cannot find module|Cannot find package/.test(
        why,
      )
    fail.push(
      unresolvable
        ? `${where}: ${target} — RESOLUTION failed, portable: ${why.slice(0, 110)}`
        : `${where}: ${target} — EXECUTED and threw; may be bare-Node only: ${why.slice(0, 110)}`,
    )
  }
}

// tsc copies relative specifiers through verbatim, so an extensionless one ships
// and throws ERR_MODULE_NOT_FOUND in every consumer. postbuild.mjs resolves them;
// this proves it did. The CLASS of bug, not the instance.
const SPECIFIER = /(?:\bfrom\s*|\bimport\s*\(?\s*)(['"])(\.[^'"]*)\1/g
for (const { target, condition } of promises(pkg.exports ?? {}, '.')) {
  if (condition === 'types' || !/\.(js|mjs)$/.test(target) || target.includes('*')) continue
  const file = join(ROOT, target)
  if (!existsSync(file)) continue
  for (const [, , spec] of readFileSync(file, 'utf8').matchAll(SPECIFIER))
    if (!/\.(js|cjs|mjs|json|css)$/.test(spec)) fail.push(`${target}: extensionless specifier '${spec}'`)
}

const name = pkg.name ?? ROOT
if (fail.length) {
  console.error(`\n${name}: ${fail.length} broken export promise(s)`)
  for (const f of fail) console.error(`  ✗ ${f}`)
  console.error('')
  process.exit(1)
}
console.log(`${name}: ${ok.length} export promise(s) kept`)
