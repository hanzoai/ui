/**
 * What we publish, asserted against what we publish.
 *
 * Every check here reads `dist/` and `package.json` — never `src/` — because
 * every defect it exists to catch is invisible from source. A subpath that
 * resolves to a file tsc never emitted, a barrel that drags a framework into
 * hosts that do not have it, a module that loads under vite's transform and
 * nowhere else: all four compile, all four typecheck, and all four are only true
 * or false about the tarball.
 *
 * Run `pnpm build` first. These tests say so when dist is missing rather than
 * passing vacuously on an empty set — a suite that goes green because it found
 * nothing to check is worse than no suite.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const UI = dirname(dirname(fileURLToPath(import.meta.url)))
const DIST = join(UI, 'dist')
const pkg = JSON.parse(readFileSync(join(UI, 'package.json'), 'utf8'))

const built = existsSync(join(DIST, 'index.js'))
const needsBuild = 'dist/ is missing or stale. Run: pnpm build'

/**
 * Run `script` in a CHILD node process and hand back what it printed.
 *
 * A child, not this process: vitest has already installed vite's transform and
 * the gui aliases, so anything evaluated here loads under machinery a consumer
 * does not have. The only honest way to ask "does this load with nothing" is to
 * ask somewhere there is nothing.
 *
 * `process` is declared narrowly in this package (gui-env.d.ts, no @types/node),
 * so the interpreter path is reached through a cast rather than by widening the
 * global for one call.
 */
const node = (script: string): string =>
  execFileSync((process as unknown as { execPath: string }).execPath, ['-e', script], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })

/** Every file path an exports entry points at. */
function targets(entry: unknown): string[] {
  if (typeof entry === 'string') return [entry]
  if (!entry || typeof entry !== 'object') return []
  return Object.values(entry as Record<string, unknown>).flatMap(targets)
}

/**
 * A `*` pattern is only checkable against a concrete name, so each one names an
 * example that must resolve. A wildcard nobody can name is a wildcard nobody
 * can use, which is the defect the entry exists to fix.
 */
const EXAMPLE: Record<string, string> = {
  './product/*': 'pure',
  './primitives/*': 'index',
}

describe('the exports map', () => {
  it.runIf(built)('points every subpath at a file that was actually emitted', () => {
    const missing: string[] = []
    for (const [subpath, entry] of Object.entries(pkg.exports as Record<string, unknown>)) {
      if (subpath === './package.json') continue
      const example = subpath.includes('*') ? EXAMPLE[subpath] : undefined
      if (subpath.includes('*') && !example) {
        missing.push(`${subpath} -> no example named in this test`)
        continue
      }
      for (const t of new Set(targets(entry)))
        if (!existsSync(join(UI, example ? t.replace('*', example) : t)))
          missing.push(`${subpath} -> ${t}`)
    }
    expect(missing, `${missing.length} subpath(s) resolve to nothing`).toEqual([])
  })

  it('opens the product and primitive layers to deep imports', () => {
    // Without these, reaching one component means importing the barrel, and the
    // barrel is the whole layer. Four surface migrations wrote their own copies
    // rather than pay for that.
    expect(Object.keys(pkg.exports)).toEqual(expect.arrayContaining(['./product/*', './primitives/*']))
  })

  it('ships the pure subpath to BOTH module systems', () => {
    // The point of `./product/pure` is that a rule loads wherever a value loads.
    // A jest consumer is CommonJS; an ESM-only entry is unreachable to it, which
    // is exactly the wall this subpath exists to remove.
    const pure = pkg.exports['./product/pure'] as Record<string, string>
    expect(pure.require).toBe('./dist/product/pure.cjs')
    expect(pure.import).toBe('./dist/product/pure.js')
    expect((pkg.exports['./css'] as Record<string, string>).require).toBe('./dist/core/css.cjs')
  })

  it('gives the Next theme binding an entry point of its own', () => {
    expect(pkg.exports['./product/theme-toggle-next']).toBeTruthy()
  })

  it('declares the framework that binding needs, optionally', () => {
    // @hanzogui/next-theme peer-requires `next`, and that requirement was
    // reachable from this package with nothing here admitting it.
    expect(pkg.peerDependencies.next).toBeTruthy()
    expect(pkg.peerDependenciesMeta.next.optional).toBe(true)
    expect(pkg.peerDependenciesMeta['@hanzogui/next-theme'].optional).toBe(true)
  })
})

/** Static import specifiers in an emitted ESM module. */
const imports = (js: string): string[] => [
  ...js.matchAll(/(?:^|\n)\s*(?:import|export)[^'"\n]*?from\s*['"]([^'"]+)['"]/g),
].map((m) => m[1] as string)

/** Everything reachable from `entry` by STATIC import, within this package. */
function closure(entry: string): Map<string, string[]> {
  const seen = new Map<string, string[]>()
  const walk = (file: string) => {
    if (seen.has(file) || !existsSync(file)) return
    const src = readFileSync(file, 'utf8')
    const specs = imports(src)
    seen.set(file, specs)
    for (const spec of specs) if (spec.startsWith('.')) walk(resolve(dirname(file), spec))
  }
  walk(entry)
  return seen
}

describe('the product barrel', () => {
  it.runIf(built)('reaches no Next dependency by a static edge', () => {
    // @hanzogui/next-theme's provider imports `next/script`. A barrel re-export
    // is a static edge no bundler can split, so one line here put Next in the
    // graph of every Vite, Express and Tauri host importing @hanzo/ui/product —
    // the hosts this layer promises to run on.
    const graph = closure(join(DIST, 'product/index.js'))
    expect(graph.size, needsBuild).toBeGreaterThan(20)
    const offenders = [...graph]
      .filter(([, specs]) => specs.some((s) => s === '@hanzogui/next-theme' || s.startsWith('next/')))
      .map(([f]) => f.slice(DIST.length + 1))
    expect(offenders, 'a static import of Next is reachable from @hanzo/ui/product').toEqual([])
  })

  it.runIf(built)('still reaches the Next binding by a dynamic one', () => {
    // Removing the barrel line must not orphan the console's theme path: the
    // uncontrolled `<ThemeToggle />` still loads it, lazily, and degrades when
    // next-theme is absent. A test that only asserted the absence above would
    // pass just as well on a deleted feature.
    const toggle = readFileSync(join(DIST, 'product/ThemeToggle.js'), 'utf8')
    expect(toggle).toContain("import('./ThemeToggleNext.js')")
    expect(readFileSync(join(DIST, 'product/ThemeToggleNext.js'), 'utf8')).toContain('@hanzogui/next-theme')
  })
})

describe('the pure subpath', () => {
  it.runIf(built)('has no import at all — that is what makes it pure', () => {
    const graph = closure(join(DIST, 'product/pure.js'))
    const external = [...graph]
      .flatMap(([, specs]) => specs)
      .filter((s) => !s.startsWith('.'))
    expect(external, '@hanzo/ui/product/pure must depend on nothing').toEqual([])
  })

  it.runIf(built)('is not stamped `use client` — a rule has to run on the server too', () => {
    // A stamped module is a client REFERENCE on React's server layer, not a
    // function: calling `pages()` through one in a server component throws
    // rather than paging.
    for (const f of ['product/pure.js', 'product/pages.js', 'product/tone.js', 'core/css.js'])
      expect([f, readFileSync(join(DIST, f), 'utf8').includes('use client')]).toEqual([f, false])
  })

  it.runIf(built)('loads under a bare CommonJS require, with no transform and no DOM', () => {
    // The consumer-shaped check: a child node process, `require()`, no vite, no
    // jsdom, no babel. Anything the barrel drags in that cannot be required
    // fails here and only here.
    const script = `
      const p = require(${JSON.stringify(join(DIST, 'product/pure.cjs'))})
      const eq = (a, b) => { const [x, y] = [JSON.stringify(a), JSON.stringify(b)]
        if (x !== y) throw new Error('expected ' + y + ', got ' + x) }
      eq(p.pages(1, 3), [1, 2, 3])
      eq(p.pages(9, 20), [1, '…', 8, 9, 10, '…', 20])
      eq(p.masked(true), { secureTextEntry: true, type: 'password' })
      eq(p.displayName(undefined, 'ada@hanzo.ai'), 'ada')
      eq(p.tone('past_due'), 'stopped')
      eq(typeof p.filterOptions, 'function')
      eq(typeof p.orgScope, 'function')
      eq(p.resolveBrand('lux').name, 'Lux')
      process.stdout.write('ok')
    `
    expect(node(script)).toBe('ok')
  })

  it.runIf(built)('loads the css helper the same way', () => {
    const script = `
      const { substitute } = require(${JSON.stringify(join(DIST, 'core/css.cjs'))})
      if (substitute('var(--border, rgb(255 255 255 / .10))') !== 'rgb(255 255 255 / .10)') throw new Error('bad')
      process.stdout.write('ok')
    `
    expect(node(script)).toBe('ok')
  })
})

/**
 * dist/gallery.html — the render, kept.
 *
 * `gen-css.mjs` mounts src/gallery.tsx to harvest the atomic rules; the markup
 * that harvest produces is the only picture of this package that cannot drift
 * from it, so it is written out beside the sheet it generated.
 *
 * The assertion is coverage, because the failure it guards is the one this whole
 * script exists for and it is silent: markup whose classes no rule defines
 * renders unstyled, with a green build. Split on `</head>`, never on `<body>` —
 * the token layer carries a comment mentioning `<body>`, and splitting there
 * truncates the sheet and reports total coverage as zero.
 */
describe('the kept render', () => {
  const page = () => readFileSync(join(DIST, 'gallery.html'), 'utf8')

  it.runIf(built)('is emitted', () => {
    expect(existsSync(join(DIST, 'gallery.html')), needsBuild).toBe(true)
  })

  it.runIf(built)('carries a rule for every atomic class it renders', () => {
    const html = page()
    const cut = html.indexOf('</head>')
    expect(cut, 'no </head> — the page is not a document').toBeGreaterThan(0)

    const body = html.slice(cut)
    const used = new Set(
      [...body.matchAll(/class="([^"]+)"/g)]
        .flatMap((m) => m[1].split(/\s+/))
        .filter((c) => c.startsWith('_')),
    )
    const sheet = new Set([...html.slice(0, cut).matchAll(/\.(_[\w-]+)/g)].map((m) => m[1]))

    expect(used.size, 'nothing rendered — the gallery is empty').toBeGreaterThan(100)
    expect([...used].filter((c) => !sheet.has(c))).toEqual([])
  })

  it.runIf(built)('shows the chat surface', () => {
    const html = page()
    for (const slot of ['thread', 'message', 'composer', 'step', 'code', 'sources'])
      expect(html, `chat is missing ${slot}`).toContain(`data-slot="${slot}"`)
  })
})
