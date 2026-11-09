/**
 * The app/ tree as routes, by the App Router's file conventions, so a page keeps
 * its file when the framework under it changes.
 *
 *   app/page.tsx                 /
 *   app/(group)/about/page.tsx   /about          a group names no segment
 *   app/[slug]/page.tsx          /:slug
 *   app/[...rest]/page.tsx       /:rest+
 *   app/[[...rest]]/page.tsx     /:rest*
 *   app/feed.xml/route.ts        /feed.xml       a GET written to a file
 *   app/x/opengraph-image.tsx    /x/opengraph-image, and every page under x names it
 *   app/_parts/…                 nothing: a folder starting `_` is private
 *
 * A level's layout.tsx wraps everything under it. A parallel route (`@slot`) or
 * an intercepting one (`(.)x`) is refused by name, never dropped in silence.
 */

export type Part =
  | { kind: 'static'; value: string }
  | { kind: 'one'; name: string }
  | { kind: 'rest'; name: string; optional: boolean }

export interface Route {
  /** The app-relative directory, '' for app/ itself. */
  dir: string
  /** Every directory from app/ down to `dir`, groups included: one level each. */
  levels: string[]
  parts: Part[]
  page?: string
  handler?: string
  image?: string
}

export interface Tree {
  routes: Route[]
  /** app-relative layout file by directory. */
  layouts: Map<string, string>
  /** opengraph-image files, by directory. */
  images: Map<string, string>
  missing?: string
  robots?: string
  sitemap?: string
}

export type Params = Record<string, string | string[] | undefined>

const CODE = /\.(tsx|ts|jsx|js|mdx|md)$/

const parse = (segment: string): Part | null => {
  if (/^\(\.{1,3}\)/.test(segment)) throw new Error(`intercepting route ${segment} is not supported`)
  if (/^\(.+\)$/.test(segment)) return null
  if (segment.startsWith('@')) throw new Error(`parallel route ${segment} is not supported`)
  let m = /^\[\[\.\.\.([^\]]+)\]\]$/.exec(segment)
  if (m) return { kind: 'rest', name: m[1], optional: true }
  m = /^\[\.\.\.([^\]]+)\]$/.exec(segment)
  if (m) return { kind: 'rest', name: m[1], optional: false }
  m = /^\[([^\]]+)\]$/.exec(segment)
  if (m) return { kind: 'one', name: m[1] }
  return { kind: 'static', value: segment }
}

const dirOf = (file: string) => (file.includes('/') ? file.slice(0, file.lastIndexOf('/')) : '')
const nameOf = (file: string) => file.slice(file.lastIndexOf('/') + 1).replace(CODE, '')

const chain = (dir: string): string[] => {
  if (!dir) return ['']
  const parts = dir.split('/')
  return ['', ...parts.map((_, i) => parts.slice(0, i + 1).join('/'))]
}

const partsOf = (dir: string): Part[] =>
  dir
    ? dir
        .split('/')
        .map(parse)
        .filter((p): p is Part => p !== null)
    : []

/** The tree from app-relative file paths. */
export function tree(files: readonly string[]): Tree {
  const kept = files.filter((f) => CODE.test(f) && !f.split('/').some((s) => s.startsWith('_')))
  const layouts = new Map<string, string>()
  const images = new Map<string, string>()
  const pages = new Map<string, string>()
  const handlers = new Map<string, string>()
  let missing: string | undefined
  let robots: string | undefined
  let sitemap: string | undefined
  for (const file of kept) {
    const dir = dirOf(file)
    const name = nameOf(file)
    if (name === 'layout') layouts.set(dir, file)
    else if (name === 'page') pages.set(dir, file)
    else if (name === 'route') handlers.set(dir, file)
    else if (name === 'opengraph-image') images.set(dir, file)
    else if (name === 'not-found' && dir === '') missing = file
    else if (name === 'robots' && dir === '') robots = file
    else if (name === 'sitemap' && dir === '') sitemap = file
  }
  const nearest = (dir: string) => {
    for (const level of chain(dir).reverse()) if (images.has(level)) return images.get(level)
    return undefined
  }
  const routes: Route[] = []
  for (const dir of new Set([...pages.keys(), ...handlers.keys()])) {
    if (pages.has(dir) && handlers.has(dir)) throw new Error(`app/${dir} has both a page and a route`)
    routes.push({ dir, levels: chain(dir), parts: partsOf(dir), page: pages.get(dir), handler: handlers.get(dir), image: nearest(dir) })
  }
  const seen = new Map<string, string>()
  for (const r of routes) {
    const shape = r.parts.map((p) => (p.kind === 'static' ? p.value : p.kind === 'one' ? '[]' : p.optional ? '[[...]]' : '[...]')).join('/')
    if (seen.has(shape)) throw new Error(`app/${r.dir} and app/${seen.get(shape)} answer the same address`)
    seen.set(shape, r.dir)
  }
  return { routes, layouts, images, missing, robots, sitemap }
}

/** A static segment outranks a parameter, which outranks a rest, which outranks an optional rest. */
const rank = (p: Part) => (p.kind === 'static' ? 3 : p.kind === 'one' ? 2 : p.optional ? 0 : 1)

const better = (a: Route, b: Route) => {
  for (let i = 0; i < Math.max(a.parts.length, b.parts.length); i++) {
    const x = a.parts[i] ? rank(a.parts[i]) : -1
    const y = b.parts[i] ? rank(b.parts[i]) : -1
    if (x !== y) return x > y
  }
  return false
}

const fit = (parts: Part[], segments: string[]): Params | null => {
  const params: Params = {}
  let i = 0
  for (let k = 0; k < parts.length; k++) {
    const p = parts[k]
    if (p.kind === 'rest') {
      const rest = segments.slice(i)
      if (k !== parts.length - 1) return null
      if (!rest.length && !p.optional) return null
      params[p.name] = rest.length ? rest : undefined
      return params
    }
    const s = segments[i++]
    if (s === undefined) return null
    if (p.kind === 'static' ? s !== p.value : false) return null
    if (p.kind === 'one') params[p.name] = s
  }
  return i === segments.length ? params : null
}

export const segments = (pathname: string): string[] =>
  pathname
    .split('/')
    .filter(Boolean)
    .map((s) => decodeURIComponent(s))

/** The route a pathname reaches, and its parameters. */
export function match(t: Tree, pathname: string): { route: Route; params: Params } | null {
  const s = segments(pathname)
  let found: { route: Route; params: Params } | null = null
  for (const route of t.routes) {
    const params = fit(route.parts, s)
    if (params && (!found || better(route, found.route))) found = { route, params }
  }
  return found
}

/** The address a route takes with these parameters. */
export function address(parts: Part[], params: Params, trailing: boolean): string {
  const out: string[] = []
  for (const p of parts) {
    if (p.kind === 'static') out.push(p.value)
    else if (p.kind === 'one') {
      const v = params[p.name]
      if (typeof v !== 'string' || !v) throw new Error(`no value for [${p.name}] in ${JSON.stringify(params)}`)
      out.push(encodeURIComponent(v))
    } else {
      const v = params[p.name]
      const list = v === undefined ? [] : Array.isArray(v) ? v : [v]
      if (!list.length && !p.optional) throw new Error(`no value for [...${p.name}] in ${JSON.stringify(params)}`)
      out.push(...list.map(encodeURIComponent))
    }
  }
  if (!out.length) return '/'
  return `/${out.join('/')}${trailing ? '/' : ''}`
}

/** The file an address is written to: `x/index.html` with a trailing slash, `x.html` without. */
export function file(path: string, trailing: boolean): string {
  const clean = decodeURIComponent(path).replace(/^\/+|\/+$/g, '')
  if (!clean) return 'index.html'
  return trailing ? `${clean}/index.html` : `${clean}.html`
}

/** Whether a route takes parameters, so it needs generateStaticParams to be written out. */
export const dynamic = (parts: Part[]) => parts.some((p) => p.kind !== 'static')
