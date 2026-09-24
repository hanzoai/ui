/**
 * tree — a repository's files as the rows a tree draws, and the keys that move
 * through them.
 *
 * Ported from build-v2 `components/editor/file-tree/tree.ts` (MIT, derived from
 * OSW Studio and DeepSite — see NOTICE). v2 grouped a flat list of pages; a
 * repository is read one directory at a time (`/tree?path=` answers a level,
 * not the whole checkout), so the shape here is a LISTING — each directory's
 * own children, keyed by the directory's path — and a flat list is just a
 * listing built in one pass. One renderer, two ways in.
 *
 * Pure and importless, so the grouping, the ordering and the keyboard can be
 * asserted without a browser. The shape of a tree is exactly the kind of thing
 * that is easy to get subtly wrong — a folder with one child, a file beside a
 * folder at the root, two paths that agree for three segments — and impossible
 * to see in a screenshot.
 */

/** One child of a directory, as a listing answers it. */
export interface Entry {
  /** Repo-relative, no leading slash: `src/app.tsx`. */
  path: string
  kind: 'file' | 'dir'
}

/**
 * Every directory the tree knows about, by path, with its direct children.
 * The root is `''`. A directory with no key has not been read yet.
 */
export type Listing = Map<string, Entry[]>

/** One drawn line: an entry at a depth, and what state its folder is in. */
export interface Row {
  path: string
  name: string
  kind: 'file' | 'dir'
  depth: number
  /** A directory that is expanded. */
  open: boolean
  /** The parent directory's path — what Left moves to. */
  parent: string
}

/** The last segment: the name a row shows. */
export const base = (path: string): string => {
  const cut = path.replace(/\/+$/, '')
  return cut.slice(cut.lastIndexOf('/') + 1)
}

/** The directory a path sits in; `''` at the root. */
export const dir = (path: string): string => {
  const cut = path.replace(/\/+$/, '')
  const at = cut.lastIndexOf('/')
  return at < 0 ? '' : cut.slice(0, at)
}

/**
 * Directories first, then files, each by name — the order every file browser
 * uses, because folders are structure and files are content and mixing them
 * makes both harder to scan. `localeCompare` with `numeric`, so `page10` sorts
 * after `page9`.
 */
export function sort(entries: Entry[]): Entry[] {
  return [...entries].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'dir' ? -1 : 1
    return base(a.path).localeCompare(base(b.path), undefined, { numeric: true })
  })
}

/**
 * A flat list of file paths as a listing: every folder a path implies is
 * created on the way down. Duplicates collapse; empty segments are ignored, so
 * `a//b` and `/a/b` are `a/b`.
 */
export function group(files: string[]): Listing {
  const out: Listing = new Map([['', []]])
  const seen = new Set<string>()
  const add = (at: string, entry: Entry) => {
    const key = `${entry.kind}:${entry.path}`
    if (seen.has(key)) return
    seen.add(key)
    const list = out.get(at) ?? []
    list.push(entry)
    out.set(at, list)
  }
  for (const raw of files) {
    const segments = raw.split('/').filter(Boolean)
    if (segments.length === 0) continue
    let at = ''
    for (let i = 0; i < segments.length - 1; i++) {
      const next = at ? `${at}/${segments[i]}` : segments[i]!
      add(at, { path: next, kind: 'dir' })
      if (!out.has(next)) out.set(next, [])
      at = next
    }
    add(at, { path: segments.join('/'), kind: 'file' })
  }
  for (const [key, list] of out) out.set(key, sort(list))
  return out
}

/** A listing with one directory's children set, sorted. Returns a new map. */
export function put(listing: Listing, at: string, entries: Entry[]): Listing {
  const next = new Map(listing)
  next.set(at, sort(entries))
  return next
}

/**
 * Every folder on the way to a path, so selecting a file can reveal it.
 * `src/components/Header.tsx` → `['src', 'src/components']`.
 */
export function ancestors(path: string): string[] {
  const segments = path.split('/').filter(Boolean)
  segments.pop()
  const out: string[] = []
  let acc = ''
  for (const s of segments) {
    acc = acc ? `${acc}/${s}` : s
    out.push(acc)
  }
  return out
}

/**
 * The rows a tree draws: a depth-first walk from the root through every OPEN
 * directory the listing has read. An open directory that has not been read
 * draws nothing under it — the host is reading it, and the row says so.
 */
export function rows(listing: Listing, open: ReadonlySet<string>): Row[] {
  const out: Row[] = []
  const walk = (at: string, depth: number) => {
    for (const entry of listing.get(at) ?? []) {
      const isOpen = entry.kind === 'dir' && open.has(entry.path)
      out.push({
        path: entry.path,
        name: base(entry.path),
        kind: entry.kind,
        depth,
        open: isOpen,
        parent: at,
      })
      if (isOpen) walk(entry.path, depth + 1)
    }
  }
  walk('', 0)
  return out
}

/**
 * The paths whose names contain `query`, and every folder above them — what a
 * filtered tree shows. Case-insensitive substring, never a compiled pattern: a
 * search box is not a place a regex should be built from typing.
 */
export function filter(files: string[], query: string): string[] {
  const q = query.trim().toLowerCase()
  if (!q) return files
  return files.filter((f) => f.toLowerCase().includes(q))
}

/** What a key does to the tree, as a value the component applies. */
export interface Move {
  /** The row index that has focus afterwards. */
  focus: number
  /** A directory to expand or collapse. */
  toggle?: string
  /** A file to open. */
  pick?: string
}

/**
 * The WAI-ARIA tree keys, over the visible rows.
 *
 * Up/Down step, Home/End jump, Right opens a closed folder or steps into an
 * open one, Left closes an open folder or steps out to its parent, Enter and
 * Space open a file or toggle a folder. An unknown key is `null`, so the
 * component leaves it to the browser.
 */
export function step(list: Row[], at: number, key: string): Move | null {
  if (list.length === 0) return null
  const here = list[Math.min(Math.max(at, 0), list.length - 1)]!
  const index = list.indexOf(here)
  switch (key) {
    case 'ArrowDown':
      return { focus: Math.min(index + 1, list.length - 1) }
    case 'ArrowUp':
      return { focus: Math.max(index - 1, 0) }
    case 'Home':
      return { focus: 0 }
    case 'End':
      return { focus: list.length - 1 }
    case 'ArrowRight':
      if (here.kind !== 'dir') return { focus: index }
      if (!here.open) return { focus: index, toggle: here.path }
      return { focus: list[index + 1]?.parent === here.path ? index + 1 : index }
    case 'ArrowLeft': {
      if (here.kind === 'dir' && here.open) return { focus: index, toggle: here.path }
      const up = list.findIndex((r) => r.path === here.parent)
      return { focus: up >= 0 ? up : index }
    }
    case 'Enter':
    case ' ':
      return here.kind === 'dir' ? { focus: index, toggle: here.path } : { focus: index, pick: here.path }
    default:
      return null
  }
}

/**
 * The language a path is written in, as the editor names languages. An
 * unknown extension is `plaintext`, never a guess.
 */
export function language(path: string): string {
  const name = base(path).toLowerCase()
  if (name === 'dockerfile') return 'shell'
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.') + 1) : ''
  return LANGUAGE[ext] ?? 'plaintext'
}

const LANGUAGE: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  mts: 'typescript',
  cts: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  json: 'json',
  html: 'html',
  htm: 'html',
  css: 'css',
  scss: 'scss',
  md: 'markdown',
  mdx: 'markdown',
  py: 'python',
  go: 'go',
  rs: 'rust',
  rb: 'ruby',
  php: 'php',
  java: 'java',
  kt: 'kotlin',
  swift: 'swift',
  c: 'c',
  h: 'c',
  cc: 'cpp',
  cpp: 'cpp',
  hpp: 'cpp',
  cs: 'csharp',
  dart: 'dart',
  sql: 'sql',
  xml: 'xml',
  svg: 'xml',
  yml: 'yaml',
  yaml: 'yaml',
  sh: 'shell',
  bash: 'shell',
  zsh: 'shell',
}
