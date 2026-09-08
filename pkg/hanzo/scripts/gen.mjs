// Derive the umbrella from its members.
//
// `hanzo` promises that everything its libraries publish is reachable under one
// name. Hand-listing the subpaths is how that promise rots: @hanzo/ui alone
// publishes 43 of them and adds more than anyone remembers to mirror. So the
// map is read from the members' own package.json, and every entry it writes is
// a one-line module that re-exports the member subpath by the member's own
// specifier. Nothing is copied. The inner specifier resolves in the consumer's
// node_modules under the consumer's conditions, so `hanzo/iam` picks the
// browser build exactly where `@hanzo/iam` would, and a forwarder cannot answer
// differently from what it forwards to.
//
// The members are the @hanzo/* dependencies, so adding one is adding a line.
// `@hanzo/ui` arrives as `hanzo/ui` and its `./chat` as `hanzo/ui/chat`.
//
// Two shapes have no re-export syntax and keep the member's own name:
// `./package.json`, and data (`.json`) — copying the bytes would ship a second,
// staler original. A stylesheet does forward: CSS `@import` takes a specifier.
//
// `plan()` is the whole derivation and reads nothing but the members. Running
// this file writes what it describes; the suite reads it to assert the map on
// disk still says what the members do.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '')
const pkg = () => JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))

/** Where a member is installed. Its own exports map may not name package.json. */
const home = (name) => {
  for (let dir = ROOT; ; dir = dirname(dir)) {
    const at = join(dir, 'node_modules', name, 'package.json')
    if (existsSync(at)) return dirname(at)
    if (dirname(dir) === dir) throw new Error(`${name} is not installed`)
  }
}

/** Every string leaf of an export entry, however deep the conditions. */
const leaves = (node) =>
  typeof node === 'string'
    ? [node]
    : node && typeof node === 'object'
      ? Object.values(node).flatMap(leaves)
      : []

/** The condition names an entry uses, at any depth. */
const names = (node, out = new Set()) => {
  if (node && typeof node === 'object')
    for (const [k, v] of Object.entries(node)) (out.add(k), names(v, out))
  return out
}

/** Node's own walk: the first key that is `default` or one of `on`, depth first. */
const under = (node, on) => {
  if (typeof node === 'string') return node
  if (!node || typeof node !== 'object') return null
  for (const [k, v] of Object.entries(node)) {
    if (k !== 'default' && !on.has(k)) continue
    const found = under(v, on)
    if (found) return found
  }
  return null
}

const ESM = new Set(['import', 'module', 'node'])
const CJS = new Set(['require', 'node'])
const DTS = new Set(['types', 'import', 'node'])

/** A default export, which `export *` is defined not to forward. */
const DEFAULT =
  /(^|[\n;])\s*(?:export\s+default[\s(]|export\s*=|export\s*\{[^}]*\bdefault\b|export\s*\{[^}]*\bas\s+default\b)/

/** Files under `dir`, named relative to it. */
const walk = (dir, base = dir, out = []) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    e.isDirectory() ? walk(p, base, out) : out.push(relative(base, p))
  }
  return out
}

/** What the umbrella owes its members: one forwarder per member subpath. */
export const plan = () => {
  const out = []
  for (const name of Object.keys(pkg().dependencies ?? {}).filter((d) => d.startsWith('@hanzo/'))) {
    const dir = home(name)
    const member = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
    const ns = name.slice('@hanzo/'.length)
    const published = member.exports ?? { '.': member.main ?? './index.js' }

    /** `./chat` of @hanzo/ui is `ui/chat`; the member root is `ui`. */
    const path = (sub) => (sub === '.' ? ns : `${ns}/${sub.slice(2)}`)

    /** A `*` key stands for the files the member actually shipped behind it. */
    const spread = (sub, entry) => {
      if (!sub.includes('*')) return [[sub, entry]]
      const pattern = leaves(entry).find((t) => t.includes('*'))
      const [head, tail] = pattern?.split('*') ?? []
      if (!pattern || !existsSync(join(dir, head))) return []
      return walk(join(dir, head))
        .filter((f) => f.endsWith(tail))
        .map((f) => f.slice(0, -tail.length))
        .filter((star) => !published[sub.replace('*', star)])
        .map((star) => [sub.replace('*', star), JSON.parse(JSON.stringify(entry).replaceAll('*', star))])
    }

    for (const [sub, entry] of Object.entries(published).flatMap(([s, e]) => spread(s, e))) {
      if (sub === './package.json') continue
      const spec = sub === '.' ? name : `${name}/${sub.slice(2)}`
      const targets = leaves(entry)
      const keys = names(entry)
      const at = path(sub)

      if (targets.every((t) => t.endsWith('.css'))) {
        out.push({ subpath: `./${at}`, files: { [at]: `@import '${spec}';\n` }, entry: `./dist/${at}` })
        continue
      }
      if (targets.some((t) => /\.(json|node|wasm|svg|png|woff2?)$/.test(t))) continue

      const esm = under(entry, ESM)
      const cjs = keys.has('require') || targets.every((t) => t.endsWith('.cjs')) ? under(entry, CJS) : null
      const dts = keys.has('types') ? under(entry, DTS) : null
      if (!esm && !cjs) continue

      // A CommonJS module always has a default under node's interop; an ES
      // module has one only if it wrote one.
      const source = esm && existsSync(join(dir, esm)) ? readFileSync(join(dir, esm), 'utf8') : ''
      const body =
        `export * from '${spec}'\n` +
        (esm?.endsWith('.cjs') || DEFAULT.test(source) ? `export { default } from '${spec}'\n` : '')

      const files = {}
      const add = (ext, text) => {
        files[at + ext] = text
        return `./dist/${at}${ext}`
      }
      const forward = {}
      if (dts) forward.types = add('.d.ts', body)
      if (esm) forward.import = add('.js', body)
      if (cjs) forward.require = add('.cjs', `module.exports = require('${spec}')\n`)
      forward.default = forward.import ?? forward.require
      out.push({ subpath: `./${at}`, files, entry: forward })
    }
  }
  return out
}

if (import.meta.main) {
  const manifest = pkg()
  const map = { '.': manifest.exports['.'], './package.json': './package.json' }
  const forwarders = plan()
  for (const { subpath, files, entry } of forwarders) {
    for (const [rel, body] of Object.entries(files)) {
      const file = join(ROOT, 'dist', rel)
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(file, body)
    }
    map[subpath] = entry
  }
  manifest.exports = map
  writeFileSync(join(ROOT, 'package.json'), JSON.stringify(manifest, null, 2) + '\n')
  console.log(`${forwarders.length} subpaths`)
}
