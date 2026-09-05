/**
 * The catalog — every export of @hanzo/ui, read from the package itself.
 *
 * Two groups, one mechanism. `primitives` mirrors `backends/gui/index.ts`,
 * whose named `export { … } from './x'` blocks list each module's members
 * explicitly (`gen-primitives.mjs` depends on that shape). `product` mirrors
 * `product/index.ts`, a plain `export * from './x'` barrel instead — a `*`
 * block names no members, so a product entry's members are read from the
 * TARGET file's own declarations, the same way `types()` already reads a
 * module's exported types rather than the barrel that re-exports them.
 *
 * Server only: the routes reach it through a dynamic import inside their loaders,
 * so nothing here is bundled for the browser. Paths start from the working
 * directory, which is this app whether one builds or serves it; the bundle the
 * build writes this into lives elsewhere.
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const root = join(process.cwd(), '..', '..')
const source = join(root, 'pkg', 'ui', 'src', 'backends', 'gui')
const examplesDir = join(process.cwd(), 'examples')
const productSource = join(root, 'pkg', 'ui', 'src', 'product')
const productExamplesDir = join(process.cwd(), 'examples', 'product')

export type Member = { name: string; type: boolean }
export type Entry = { name: string; title: string; members: Member[] }
export type Example = { name: string; title: string; description: string; source: string }

const title = (name: string) =>
  name
    .split('-')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ')

/** One entry per module the barrel exports from, in barrel order. */
export function catalog(): Entry[] {
  const barrel = readFileSync(join(source, 'index.ts'), 'utf8')
  const seen = new Map<string, Entry>()
  for (const m of barrel.matchAll(/export\s*\{([^}]*)\}\s*from\s*'\.\/([^']+)'/g)) {
    const name = m[2].replace(/\.tsx?$/, '')
    const entry = seen.get(name) ?? { name, title: title(name), members: [] }
    for (const raw of m[1].split(',')) {
      const piece = raw.trim()
      if (!piece) continue
      const type = piece.startsWith('type ')
      const named = piece.replace(/^type\s+/, '')
      const alias = named.includes(' as ') ? named.split(' as ')[1].trim() : named
      entry.members.push({ name: alias, type })
    }
    seen.set(name, entry)
  }
  return [...seen.values()]
}

/**
 * One entry per module `product/index.ts` names — star or named blocks alike
 * — in barrel order. A named block (`Sparkline as MetricSparkline`) already
 * tells us the public name, same as the primitives group; only a `*` block
 * names no members, so THOSE fall back to the target's own declarations
 * (`moduleMembers`, recursing through any re-export it makes in turn).
 */
export function productCatalog(): Entry[] {
  const barrel = readFileSync(join(productSource, 'index.ts'), 'utf8')
  const seen = new Map<string, Entry>()
  for (const m of barrel.matchAll(/export\s+(?:\*|\{([^}]*)\})\s*from\s*'\.\/([^']+)'/g)) {
    const name = m[2].replace(/\.tsx?$/, '')
    const entry = seen.get(name) ?? { name, title: title(name), members: [] }
    if (m[1] === undefined) {
      // `*` — nothing named in the barrel itself.
      if (entry.members.length === 0) entry.members.push(...moduleMembers(productSource, name))
    } else {
      for (const raw of m[1].split(',')) {
        const piece = raw.trim()
        if (!piece) continue
        const type = piece.startsWith('type ')
        const named = piece.replace(/^type\s+/, '')
        const alias = named.includes(' as ') ? named.split(' as ')[1].trim() : named
        entry.members.push({ name: alias, type })
      }
    }
    seen.set(name, entry)
  }
  return [...seen.values()]
}

/** The end of the statement that starts at `start`: the first newline at depth zero
 *  that the next line does not continue with `|` or `&`. */
function statementEnd(text: string, start: number): number {
  let depth = 0
  for (let i = start; i < text.length; i++) {
    const c = text[i]
    if (c === '{' || c === '(' || c === '[') depth++
    else if (c === '}' || c === ')' || c === ']') depth--
    else if (c === '<' && text[i - 1] !== '=') depth++
    else if (c === '>' && text[i - 1] !== '=' && text[i - 1] !== '-') depth--
    else if (c === '\n' && depth <= 0 && !/^\s*[|&]/.test(text.slice(i + 1, i + 40))) return i
  }
  return text.length
}

/** The file a relative module specifier (already `join`ed with its base
 *  directory) resolves to: `<base>.tsx`, `<base>.ts`, or — when it names a
 *  directory (`./menu`) rather than a file — its own `index.tsx`/`index.ts`. */
function resolveModuleFile(base: string): string {
  const candidates = [`${base}.tsx`, `${base}.ts`, join(base, 'index.tsx'), join(base, 'index.ts')]
  return candidates.find(existsSync) ?? candidates[0]
}

/** A module's source. */
function readModule(dir: string, name: string): string {
  return readFileSync(resolveModuleFile(join(dir, name)), 'utf8')
}

/**
 * A module's own exported value and type names — the one thing neither a `*`
 * nor a named re-export block leaves in the barrel for `productCatalog` to
 * read directly. Recurses through the module's OWN re-exports (`menu` and
 * `social` are barrels one level down, not files with direct declarations),
 * bounded by `seenFiles` since these are trees, not cycles. An external
 * specifier (`@hanzo/data`) is left alone — nothing of ours to open.
 */
function membersOf(file: string, seenFiles: Set<string> = new Set()): Member[] {
  if (seenFiles.has(file) || !existsSync(file)) return []
  seenFiles.add(file)
  const text = readFileSync(file, 'utf8')
  const dir = dirname(file)
  const out: Member[] = []
  const seenNames = new Set<string>()
  const add = (n: string, type: boolean) => {
    if (seenNames.has(n)) return
    seenNames.add(n)
    out.push({ name: n, type })
  }
  for (const m of text.matchAll(/^export\s+(?:async\s+)?function\s+(\w+)/gm)) add(m[1], false)
  for (const m of text.matchAll(/^export\s+(?:const|class)\s+(\w+)/gm)) add(m[1], false)
  for (const m of text.matchAll(/^export\s+(?:type|interface)\s+(\w+)/gm)) add(m[1], true)
  for (const block of text.matchAll(/export\s*\{([^}]*)\}\s*from\s*'([^']+)'/g)) {
    for (const raw of block[1].split(',')) {
      const piece = raw.trim()
      if (!piece) continue
      const type = piece.startsWith('type ')
      const named = piece.replace(/^type\s+/, '')
      add(named.includes(' as ') ? named.split(' as ')[1].trim() : named, type)
    }
  }
  for (const m of text.matchAll(/export\s+\*\s*from\s*'([^']+)'/g)) {
    if (!m[1].startsWith('.')) continue
    for (const mem of membersOf(resolveModuleFile(join(dir, m[1])), seenFiles)) add(mem.name, mem.type)
  }
  return out
}

function moduleMembers(dir: string, name: string): Member[] {
  return membersOf(resolveModuleFile(join(dir, name)))
}

/** The exported types of a module, quoted from its source. */
export function types(name: string): string[] {
  return typesOf(source, name)
}

/** The exported types of a `product` module, quoted from its source. */
export function productTypes(name: string): string[] {
  return typesOf(productSource, name)
}

function typesOf(dir: string, name: string): string[] {
  const text = readModule(dir, name)
  const out: string[] = []
  for (const m of text.matchAll(/^export (?:type|interface) \w+/gm)) {
    out.push(text.slice(m.index, statementEnd(text, m.index)).trimEnd())
  }
  return out
}

/** The examples of a module: each exported function of `examples/<name>.tsx`, with
 *  the doc comment above it as title and description, and its source. */
export function examples(name: string): Example[] {
  return examplesOf(examplesDir, name)
}

/** The examples of a `product` module, from `examples/product/<name>.tsx`. */
export function productExamples(name: string): Example[] {
  return examplesOf(productExamplesDir, name)
}

function examplesOf(dir: string, name: string): Example[] {
  const file = join(dir, `${name}.tsx`)
  if (!existsSync(file)) return []
  const text = readFileSync(file, 'utf8')
  const out: Example[] = []
  for (const m of text.matchAll(/\/\*\*\s*([\s\S]*?)\*\/\s*export function (\w+)\s*\(/g)) {
    const comment = m[1].replace(/^\s*\* ?/gm, '').trim()
    const [head, ...rest] = comment.split(/\s+—\s+/)
    const start = m.index + m[0].lastIndexOf('export function')
    const open = text.indexOf('{', text.indexOf(')', start))
    let depth = 0
    let end = open
    for (let i = open; i < text.length; i++) {
      if (text[i] === '{') depth++
      else if (text[i] === '}' && --depth === 0) {
        end = i + 1
        break
      }
    }
    const description = rest.join(' — ').trim()
    out.push({
      name: m[2],
      title: head.trim(),
      description: description && description[0].toUpperCase() + description.slice(1),
      source: text.slice(start, end),
    })
  }
  return out
}
