/**
 * The catalog — every export of the package, read from the package itself.
 *
 * Three groups, one mechanism. Each is a barrel: `backends/gui/index.ts` names
 * each module's members in `export { … } from './x'` blocks, `product/index.ts`
 * and `blocks/index.ts` mostly `export * from './x'`. A named block already
 * says the public names; a `*` block names none, so THOSE members are read from
 * the target file's own declarations, the same way `typesOf` reads a module's
 * exported types rather than the barrel that re-exports them.
 *
 * Server only: the routes reach it through a dynamic import inside their
 * loaders, so nothing here is bundled for the browser. Paths start from the
 * working directory, which is this app whether one builds or serves it.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { codeToHTML } from '@hanzogui/code-to-html'

import { brand, house } from './brand'
import type { Item, Section } from './features/docs'

const root = join(process.cwd(), '..', '..')
const src = join(root, 'pkg', 'ui', 'src')
export const docsDir = join(process.cwd(), 'data', 'docs')

export type Group = 'ui' | 'product' | 'blocks'
export type Member = { name: string; type: boolean }
export type Entry = { name: string; title: string; members: Member[] }
export type Example = { name: string; title: string; description: string; source: string }

/** The groups, in the order the site lists them: a barrel, its examples, its route and its import path. */
const GROUPS: Record<Group, { title: string; blurb: string; source: string; examples: string; route: string; path: string }> = {
  ui: {
    title: 'Primitives',
    blurb: 'The component API — one cross-platform primitive per name, importable from the package root.',
    source: join(src, 'backends', 'gui'),
    examples: join(process.cwd(), 'examples'),
    route: '/ui',
    path: '',
  },
  product: {
    title: 'Product',
    blurb: 'The app layer — charts, status tags, page chrome, detail panes.',
    source: join(src, 'product'),
    examples: join(process.cwd(), 'examples', 'product'),
    route: '/product',
    path: '/product',
  },
  blocks: {
    title: 'Blocks',
    blurb: 'Content as data, and the renderers that draw it.',
    source: join(src, 'blocks'),
    examples: join(process.cwd(), 'examples', 'blocks'),
    route: '/blocks',
    path: '/blocks',
  },
}

export const groups = Object.keys(GROUPS) as Group[]

/** The specifier a module of this group is imported from, as this build spells the package. */
export const from = (group: Group) => brand.name + GROUPS[group].path

/** A name this build may show. The house shows every one; another brand none that carries the house's. */
const ours = (name: string) => brand === house || !name.toLowerCase().includes(house.id)

/** Source as this build spells the package. */
export const sample = (text: string) => text.replaceAll(house.name, brand.name)

const title = (name: string) =>
  name
    .split('-')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ')

/** The members a named block lists: `A, type B, C as D`. */
function named(block: string): Member[] {
  const out: Member[] = []
  for (const raw of block.split(',')) {
    const piece = raw.trim()
    if (!piece) continue
    const type = piece.startsWith('type ')
    const name = piece.replace(/^type\s+/, '')
    out.push({ name: name.includes(' as ') ? name.split(' as ')[1].trim() : name, type })
  }
  return out
}

/** One entry per module the group's barrel exports from, in barrel order. */
export function entries(group: Group): Entry[] {
  const { source } = GROUPS[group]
  const barrel = readFileSync(join(source, 'index.ts'), 'utf8')
  const seen = new Map<string, Entry>()
  for (const m of barrel.matchAll(/export\s+(?:\*|\{([^}]*)\})\s*from\s*'\.\/([^']+)'/g)) {
    const name = m[2].replace(/\.tsx?$/, '')
    const entry = seen.get(name) ?? { name, title: title(name), members: [] }
    if (m[1] === undefined) {
      // `*` — nothing named in the barrel itself.
      if (entry.members.length === 0) entry.members.push(...membersOf(resolveModuleFile(join(source, name))))
    } else entry.members.push(...named(m[1]))
    seen.set(name, entry)
  }
  return [...seen.values()]
    .filter((e) => ours(e.name))
    .map((e) => ({ ...e, members: e.members.filter((m) => ours(m.name)) }))
}

/**
 * The docs pages, in reading order. A page not named here follows the named
 * ones, alphabetically; a slug with a slash is a page of the section its first
 * segment names, and that section's own page is the one at the segment.
 */
const ORDER = [
  'index',
  'installation',
  'installation/vite',
  'installation/next',
  'installation/one',
  'installation/expo',
  'installation/tauri',
  'theming',
  'dark-mode',
  'typography',
  'grid',
  'blocks',
  'charts',
  'branding',
  'testing',
  'changelog',
  'about',
]

/** Every page under data/docs, one directory deep, in reading order. */
export function slugs(): string[] {
  if (!existsSync(docsDir)) return []
  const out: string[] = []
  for (const f of readdirSync(docsDir, { withFileTypes: true })) {
    if (f.isFile() && f.name.endsWith('.mdx')) out.push(f.name.replace(/\.mdx$/, ''))
    else if (f.isDirectory())
      for (const g of readdirSync(join(docsDir, f.name)))
        if (g.endsWith('.mdx')) out.push(`${f.name}/${g.replace(/\.mdx$/, '')}`)
  }
  const rank = (s: string) => (ORDER.includes(s) ? ORDER.indexOf(s) : ORDER.length)
  return out.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
}

/** A page as the sidebar lists it. Its title is the frontmatter's, else its slug's; the index is /docs itself. */
const item = (slug: string): Item => {
  const file = join(docsDir, `${slug}.mdx`)
  const head = existsSync(file) ? readFileSync(file, 'utf8').match(/^title:\s*['"]?(.+?)['"]?\s*$/m) : null
  return { name: slug, title: head?.[1] ?? title(slug.split('/').pop()!), href: slug === 'index' ? '/docs' : `/docs/${slug}` }
}

/** The docs sections: the pages, then each directory of pages under its own page's title. */
export function docs(): Section[] {
  const all = slugs()
  const top = all.filter((s) => !s.includes('/'))
  const dirs = [...new Set(all.filter((s) => s.includes('/')).map((s) => s.split('/')[0]))]
  return [
    ...(top.length ? [{ title: 'Docs', items: top.map(item) }] : []),
    ...dirs.map((d) => ({ title: item(d).title, items: all.filter((s) => s.startsWith(`${d}/`)).map(item) })),
  ]
}

/** The sidebar: the docs pages, then each group. */
export function sections(): Section[] {
  return [
    ...docs(),
    ...groups.map((g) => ({
      title: GROUPS[g].title,
      items: entries(g).map((e) => ({ name: e.name, title: e.title, href: `${GROUPS[g].route}/${e.name}` })),
    })),
  ]
}

/** A group as its index page shows it: one card per module. */
export function overview(group: Group) {
  const { title, blurb, route } = GROUPS[group]
  return {
    group,
    title,
    blurb,
    from: from(group),
    entries: entries(group).map((e) => ({ name: e.name, title: e.title, members: e.members.length, href: `${route}/${e.name}` })),
  }
}

export type Overview = ReturnType<typeof overview>

/** One module of a group: its examples rendered to HTML beside their source, and its types. */
export function page(group: Group, name: string) {
  const entry = entries(group).find((e) => e.name === name)
  if (!entry) throw new Error(`no ${group} module named ${name}`)
  const { source, examples } = GROUPS[group]
  return {
    ...entry,
    from: from(group),
    sections: sections(),
    types: typesOf(source, name).map((t) => codeToHTML(sample(t), 'tsx')),
    examples: examplesOf(examples, name).map(({ source, ...x }) => ({ ...x, html: codeToHTML(sample(source), 'tsx') })),
  }
}

export type Doc = ReturnType<typeof page>

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

/**
 * A module's own exported value and type names — the one thing a `*` block
 * leaves out of the barrel. Recurses through the module's OWN re-exports
 * (`menu` and `social` are barrels one level down, not files with direct
 * declarations), bounded by `seen` since these are trees, not cycles. An
 * external specifier (`@hanzo/data`) is left alone — nothing of ours to open.
 */
function membersOf(file: string, seen: Set<string> = new Set()): Member[] {
  if (seen.has(file) || !existsSync(file)) return []
  seen.add(file)
  const text = readFileSync(file, 'utf8')
  const dir = dirname(file)
  const out: Member[] = []
  const names = new Set<string>()
  const add = (n: string, type: boolean) => {
    if (names.has(n)) return
    names.add(n)
    out.push({ name: n, type })
  }
  for (const m of text.matchAll(/^export\s+(?:async\s+)?function\s+(\w+)/gm)) add(m[1], false)
  for (const m of text.matchAll(/^export\s+(?:const|class)\s+(\w+)/gm)) add(m[1], false)
  for (const m of text.matchAll(/^export\s+(?:type|interface)\s+(\w+)/gm)) add(m[1], true)
  for (const block of text.matchAll(/export\s*\{([^}]*)\}\s*from\s*'([^']+)'/g)) {
    for (const mem of named(block[1])) add(mem.name, mem.type)
  }
  for (const m of text.matchAll(/export\s+\*\s*from\s*'([^']+)'/g)) {
    if (!m[1].startsWith('.')) continue
    for (const mem of membersOf(resolveModuleFile(join(dir, m[1])), seen)) add(mem.name, mem.type)
  }
  return out
}

/** The exported types of a module, quoted from its source. */
function typesOf(dir: string, name: string): string[] {
  const text = readFileSync(resolveModuleFile(join(dir, name)), 'utf8')
  const out: string[] = []
  for (const m of text.matchAll(/^export (?:type|interface) \w+/gm)) {
    out.push(text.slice(m.index, statementEnd(text, m.index)).trimEnd())
  }
  return out
}

/** The examples of a module: each exported function of `<dir>/<name>.tsx`, with
 *  the doc comment above it as title and description, and its source. */
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
