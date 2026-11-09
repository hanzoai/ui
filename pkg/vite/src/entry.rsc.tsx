/**
 * The server half: a route's tree and head, rendered as React Server
 * Components. The dev server asks it per request; the build asks it for every
 * output once (`outputs`, then `emit`).
 */
import './server.js'
import { renderToReadableStream } from '@vitejs/plugin-rsc/rsc'
import type { ReactNode } from 'react'
import app from 'virtual:hanzo/app'
import { Here } from './here.js'
import { render, resolve, robotsText, sitemapText, viewport, type Image, type Metadata, type Viewport } from './metadata.js'
import { missing } from './navigation.js'
import { address, dynamic, file, match, segments, tree, type Params, type Route } from './routes.js'

type Module = Record<string, any>

const t = tree(Object.keys(app.files))
const load = (f: string): Promise<Module> => app.files[f]()
const trailing = app.trailing

const CLIENT = Symbol.for('react.client.reference')
const client = (c: unknown) => typeof c === 'function' && (c as { $$typeof?: symbol }).$$typeof === CLIENT

/** The path a page answers, as `usePathname` reads it: no trailing slash but the root's. */
const clean = (pathname: string) => (pathname.length > 1 ? pathname.replace(/\/+$/, '') : '/')

const partsAt = (level: string) => tree([`${level ? `${level}/` : ''}page.tsx`]).routes[0].parts

const stamp = (s: string) => {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193) >>> 0
  return h.toString(16).padStart(8, '0') + s.length.toString(16).padStart(8, '0')
}

/** A level's opengraph-image, as the head names it. */
async function picture(level: string, params: Params): Promise<Image | undefined> {
  const f = t.images.get(level)
  if (!f) return undefined
  const m = await load(f)
  const base = address(partsAt(level), params, false)
  const url = `${base === '/' ? '' : base}/opengraph-image?${stamp(f + JSON.stringify(params))}`
  return { alt: m.alt, type: m.contentType ?? 'image/png', url, width: m.size?.width, height: m.size?.height }
}

const metaOf = async (m: Module | undefined, props: object, parent: Promise<Metadata>): Promise<Metadata | undefined> =>
  m ? (m.generateMetadata ? await m.generateMetadata(props, parent) : m.metadata) : undefined
const viewOf = async (m: Module | undefined, props: object): Promise<Viewport | undefined> =>
  m ? (m.generateViewport ? await m.generateViewport(props) : m.viewport) : undefined

/** The head and tree for a page module at a route's levels. */
async function compose(levels: string[], page: Module, params: Params, path: string, noindex = false): Promise<ReactNode> {
  const P = Promise.resolve(params)
  const S = Promise.resolve({})
  const props = { params: P, searchParams: S }
  const layouts = await Promise.all(levels.map((l) => (t.layouts.has(l) ? load(t.layouts.get(l)!) : undefined)))
  if (!layouts[0]) throw new Error('app/layout.tsx is required: it draws <html> and <body>')

  const metas: Array<Metadata | undefined> = []
  const views: Array<Viewport | undefined> = []
  for (const m of [...layouts, page]) {
    metas.push(await metaOf(m, props, Promise.resolve(resolve(metas, []).meta)))
    views.push(await viewOf(m, props))
  }
  const images = await Promise.all(levels.map((l) => picture(l, params)))
  const head = resolve(metas, [...images, undefined])
  head.noindex = noindex

  const Page = page.default
  let node: ReactNode = client(Page) ? <Page {...props} /> : await Page(props)
  node = (
    <>
      {render(head, viewport(views))}
      {node}
    </>
  )
  for (let i = layouts.length - 1; i >= 0; i--) {
    const Layout = layouts[i]?.default
    if (Layout) node = <Layout params={P}>{node}</Layout>
  }
  return <Here path={clean(path)}>{node}</Here>
}

async function missingPage(path: string): Promise<ReactNode> {
  if (!t.missing) return <Here path={clean(path)}>{null}</Here>
  return compose([''], await load(t.missing), {}, path, true)
}

/** A page's tree, or the not-found page's, and which it is. */
async function page(pathname: string): Promise<{ node: ReactNode; status: number }> {
  const found = match(t, pathname)
  if (!found?.route.page) return { node: await missingPage(pathname), status: 404 }
  try {
    return { node: await compose(found.route.levels, await load(found.route.page), found.params, pathname), status: 200 }
  } catch (e) {
    if (missing(e)) return { node: await missingPage(pathname), status: 404 }
    throw e
  }
}

const body = async (res: Response) => new Uint8Array(await res.arrayBuffer())

/** A file that is not a page: a route handler, an image, robots.txt, sitemap.xml. */
async function asset(pathname: string): Promise<Response | null> {
  if (pathname === '/robots.txt' && t.robots) return new Response(robotsText(await (await load(t.robots)).default()), { headers: { 'content-type': 'text/plain' } })
  if (pathname === '/sitemap.xml' && t.sitemap) return new Response(sitemapText(await (await load(t.sitemap)).default()), { headers: { 'content-type': 'application/xml' } })
  if (pathname.endsWith('/opengraph-image')) {
    const at = pathname.slice(0, -'/opengraph-image'.length) || '/'
    for (const [level, f] of t.images) {
      const parts = partsAt(level)
      const route = { parts } as Route
      const found = match({ ...t, routes: [route] }, at)
      if (found) return (await load(f)).default({ params: Promise.resolve(found.params) })
    }
  }
  const found = match(t, pathname)
  if (found?.route.handler) {
    const m = await load(found.route.handler)
    if (!m.GET) throw new Error(`app/${found.route.handler} has no GET`)
    return m.GET(new Request(new URL(pathname, 'http://site.local')), { params: Promise.resolve(found.params) })
  }
  return null
}

async function html(node: ReactNode, ssg: boolean) {
  const stream = renderToReadableStream<{ root: ReactNode }>({ root: node })
  const ssr = await import.meta.viteRsc.loadModule<typeof import('./entry.ssr.js')>('ssr', 'index')
  return ssr.renderHtml(stream, { ssg })
}

/** The dev server's handler. */
export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const rsc = url.pathname.endsWith('_.rsc')
  const pathname = rsc ? url.pathname.slice(0, -'_.rsc'.length) : url.pathname
  if (!rsc) {
    const file = await asset(pathname)
    if (file) return file
  }
  const { node, status } = await page(pathname)
  if (rsc) return new Response(renderToReadableStream<{ root: ReactNode }>({ root: node }), { headers: { 'content-type': 'text/x-component;charset=utf-8' } })
  const out = await html(node, false)
  return new Response(out.stream, { status: out.status ?? status, headers: { 'content-type': 'text/html;charset=utf-8' } })
}

export interface Output {
  path: string
  file: string
}

/** Every params set a route is written with: each level's generateStaticParams, parents first. */
async function sets(route: Route): Promise<Params[]> {
  if (!dynamic(route.parts)) return [{}]
  let out: Params[] = [{}]
  const mods = [
    ...(await Promise.all(route.levels.map((l) => (t.layouts.has(l) ? load(t.layouts.get(l)!) : undefined)))),
    await load((route.page ?? route.handler)!),
  ]
  let stated = false
  for (const m of mods) {
    if (!m?.generateStaticParams) continue
    stated = true
    const next: Params[] = []
    for (const p of out) for (const c of await m.generateStaticParams({ params: p })) next.push({ ...p, ...c })
    out = next
  }
  if (!stated) throw new Error(`app/${route.dir} takes parameters and states no generateStaticParams`)
  return out
}

/** Every file the site is. */
export async function outputs(): Promise<Output[]> {
  const out: Output[] = []
  for (const route of t.routes) {
    for (const params of await sets(route)) {
      if (route.page) {
        const path = address(route.parts, params, trailing)
        out.push({ path, file: file(path, trailing) })
      } else {
        const path = address(route.parts, params, false)
        out.push({ path, file: decodeURIComponent(path).replace(/^\//, '') })
      }
    }
  }
  for (const [level, f] of t.images) {
    const m = await load(f)
    const parts = partsAt(level)
    const list: Params[] = m.generateStaticParams ? await m.generateStaticParams({ params: {} }) : dynamic(parts) ? [] : [{}]
    if (dynamic(parts) && !m.generateStaticParams) throw new Error(`app/${f} takes parameters and states no generateStaticParams`)
    for (const params of list) {
      const base = address(parts, params, false)
      const path = `${base === '/' ? '' : base}/opengraph-image`
      out.push({ path, file: decodeURIComponent(path).replace(/^\//, '') })
    }
  }
  if (t.robots) out.push({ path: '/robots.txt', file: 'robots.txt' })
  if (t.sitemap) out.push({ path: '/sitemap.xml', file: 'sitemap.xml' })
  out.push({ path: '/404', file: '404.html' })
  if (trailing) out.push({ path: '/404', file: '404/index.html' })
  const seen = new Set<string>()
  for (const o of out) {
    if (seen.has(o.file)) throw new Error(`two outputs write ${o.file}`)
    seen.add(o.file)
  }
  return out
}

/** One output's bytes: a page's HTML stream with its payload, or a file's body. */
export async function emit(o: Output): Promise<{ html?: ReadableStream<Uint8Array>; bytes?: Uint8Array }> {
  if (o.path === '/404') return { html: (await html(await missingPage('/404'), true)).stream }
  if (o.file.endsWith('.html')) {
    const { node, status } = await page(o.path)
    if (status !== 200) throw new Error(`${o.path} is listed by generateStaticParams and renders as not found`)
    return { html: (await html(node, true)).stream }
  }
  const res = await asset(o.path)
  if (!res) throw new Error(`${o.path} answers nothing`)
  if (!res.ok) throw new Error(`${o.path} answered ${res.status}`)
  return { bytes: await body(res) }
}

export const pathOf = (s: string) => segments(s)

if (import.meta.hot) import.meta.hot.accept()
