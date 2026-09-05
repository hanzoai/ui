/**
 * The catalog — every export of @hanzo/ui, read from the package itself.
 *
 * The barrel `pkg/ui/src/backends/gui/index.ts` names each module and what it
 * exports; a module is one page. Its exported types are the API, quoted from the
 * source rather than restated. Its examples live in `examples/<module>.tsx`, one
 * exported function each, and this file reads that source so the page shows the
 * code that produced what it renders.
 *
 * Server only: the routes reach it through a dynamic import inside their loaders,
 * so nothing here is bundled for the browser. Paths start from the working
 * directory, which is this app whether one builds or serves it; the bundle the
 * build writes this into lives elsewhere.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(process.cwd(), '..', '..')
const source = join(root, 'pkg', 'ui', 'src', 'backends', 'gui')
const examplesDir = join(process.cwd(), 'examples')

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

/** The exported types of a module, quoted from its source. */
export function types(name: string): string[] {
  const file = join(source, `${name}.tsx`)
  const text = readFileSync(existsSync(file) ? file : join(source, `${name}.ts`), 'utf8')
  const out: string[] = []
  for (const m of text.matchAll(/^export (?:type|interface) \w+/gm)) {
    out.push(text.slice(m.index, statementEnd(text, m.index)).trimEnd())
  }
  return out
}

/** The examples of a module: each exported function of `examples/<name>.tsx`, with
 *  the doc comment above it as title and description, and its source. */
export function examples(name: string): Example[] {
  const file = join(examplesDir, `${name}.tsx`)
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
