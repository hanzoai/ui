/**
 * A page's head, from the `metadata` and `viewport` each level of its route
 * exports, by the App Router's rules, so a page states its head the way it
 * always has and the tags come out the same.
 *
 * Resolution, level by level from app/ down:
 *   - a key a level states replaces the inherited one, whole (openGraph too);
 *   - a title string takes the nearest template above it, never one stated at
 *     its own level (the leaf layout and the page are one level);
 *   - a level with an opengraph-image file lends it to openGraph.images unless
 *     that level's own metadata states images;
 *   - at the end, openGraph and twitter take the title and description they
 *     lack, and twitter takes openGraph's images.
 *
 * A key this file does not render throws: a head tag dropped in silence is a
 * search result that changed and nobody saw.
 */
import type { ReactNode } from 'react'

export type Url = string | URL

export interface Image {
  url: Url
  secureUrl?: Url
  alt?: string
  type?: string
  width?: number | string
  height?: number | string
}
type Images = Url | Image | Array<Url | Image>

export interface Author {
  name?: string
  url?: Url
}

export interface Robots {
  index?: boolean
  follow?: boolean
  noarchive?: boolean
  nosnippet?: boolean
  noimageindex?: boolean
  nocache?: boolean
  notranslate?: boolean
  indexifembedded?: boolean
  nositelinkssearchbox?: boolean
  unavailable_after?: string
  'max-video-preview'?: number | string
  'max-image-preview'?: 'none' | 'standard' | 'large'
  'max-snippet'?: number
  googleBot?: string | Omit<Robots, 'googleBot'>
}

export interface Icon {
  url: Url
  type?: string
  sizes?: string
  media?: string
  rel?: string
  color?: string
  fetchPriority?: 'high' | 'low' | 'auto'
}
type Icons = Url | Icon | Array<Url | Icon> | { icon?: Url | Icon | Array<Url | Icon>; shortcut?: Url | Icon | Array<Url | Icon>; apple?: Url | Icon | Array<Url | Icon>; other?: Icon | Icon[] }

type Title = string | null | { default?: string; template?: string; absolute?: string }

export interface OpenGraph {
  title?: Title
  description?: string
  url?: Url
  siteName?: string
  locale?: string
  countryName?: string
  images?: Images
  videos?: Images
  audio?: Images
  alternateLocale?: string | string[]
  type?: 'website' | 'article' | 'book' | 'profile' | string
  publishedTime?: string
  modifiedTime?: string
  expirationTime?: string
  authors?: string | string[]
  section?: string
  tags?: string | string[]
}

export interface Twitter {
  card?: 'summary' | 'summary_large_image' | 'player' | 'app'
  site?: string
  siteId?: string
  creator?: string
  creatorId?: string
  title?: Title
  description?: string
  images?: Images
}

export interface Metadata {
  metadataBase?: URL | null
  title?: Title
  description?: string | null
  applicationName?: string
  authors?: Author | Author[]
  generator?: string
  keywords?: string | string[]
  referrer?: string
  creator?: string
  publisher?: string
  robots?: string | Robots
  alternates?: {
    canonical?: Url | null
    languages?: Record<string, Url>
    media?: Record<string, Url>
    types?: Record<string, Url>
  }
  icons?: Icons
  manifest?: Url
  openGraph?: OpenGraph
  twitter?: Twitter
  verification?: { google?: string | string[]; yandex?: string | string[]; yahoo?: string | string[]; other?: Record<string, string | string[]> }
  formatDetection?: { telephone?: boolean; date?: boolean; address?: boolean; email?: boolean; url?: boolean }
  category?: string
  classification?: string
  other?: Record<string, string | number | Array<string | number>>
}

export interface Viewport {
  width?: string | number
  height?: string | number
  initialScale?: number
  minimumScale?: number
  maximumScale?: number
  userScalable?: boolean
  viewportFit?: 'auto' | 'cover' | 'contain'
  interactiveWidget?: string
  themeColor?: string | { media?: string; color: string } | Array<{ media?: string; color: string }>
  colorScheme?: string
}

export type ResolvingMetadata = Promise<Metadata>

export namespace MetadataRoute {
  export interface Robots {
    rules:
      | { userAgent?: string | string[]; allow?: string | string[]; disallow?: string | string[]; crawlDelay?: number }
      | Array<{ userAgent: string | string[]; allow?: string | string[]; disallow?: string | string[]; crawlDelay?: number }>
    sitemap?: string | string[]
    host?: string
  }
  export type Sitemap = Array<{
    url: string
    lastModified?: string | Date
    changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
    priority?: number
    alternates?: { languages?: Record<string, string> }
  }>
}

const KEYS = new Set<string>([
  'metadataBase', 'title', 'description', 'applicationName', 'authors', 'generator', 'keywords', 'referrer', 'creator',
  'publisher', 'robots', 'alternates', 'icons', 'manifest', 'openGraph', 'twitter', 'verification', 'formatDetection',
  'category', 'classification', 'other',
])
const OG = new Set<string>([
  'title', 'description', 'url', 'siteName', 'locale', 'countryName', 'images', 'videos', 'audio', 'alternateLocale',
  'type', 'publishedTime', 'modifiedTime', 'expirationTime', 'authors', 'section', 'tags',
])
const TW = new Set<string>(['card', 'site', 'siteId', 'creator', 'creatorId', 'title', 'description', 'images'])
const VIEW = new Set<string>([
  'width', 'height', 'initialScale', 'minimumScale', 'maximumScale', 'userScalable', 'viewportFit', 'interactiveWidget',
  'themeColor', 'colorScheme',
])

const refuse = (where: string, known: Set<string>, value: object | undefined) => {
  for (const key of Object.keys(value ?? {})) if (!known.has(key)) throw new Error(`${where}.${key} is not rendered by @hanzo/vite`)
}

/** What a resolved head holds: the inputs, with titles made absolute and images listed. */
export interface Head {
  base: URL | null
  title: string | null
  template: string | null
  meta: Metadata
  image?: Image
  noindex?: boolean
}

const titled = (title: Title, template: string | null): { absolute: string | null; template: string | null } => {
  if (title === null || title === undefined) return { absolute: null, template: null }
  if (typeof title === 'string') return { absolute: template ? template.replace(/%s/g, title) : title, template: null }
  let absolute: string | null = null
  if (title.default !== undefined) absolute = template ? template.replace(/%s/g, title.default) : title.default
  if (title.absolute) absolute = title.absolute
  return { absolute, template: title.template ?? null }
}

/**
 * Resolve a route's levels. `levels[i]` is that level's metadata, already
 * awaited; `images[i]` the opengraph-image a level's directory carries.
 * The last level is the page, the one before it the leaf layout.
 */
export function resolve(levels: Array<Metadata | undefined>, images: Array<Image | undefined>): Head {
  const out: Head = { base: null, title: null, template: null, meta: {} }
  let template: string | null = null
  levels.forEach((m, i) => {
    if (m) {
      refuse('metadata', KEYS, m)
      refuse('metadata.openGraph', OG, m.openGraph)
      refuse('metadata.twitter', TW, m.twitter)
      if ('metadataBase' in m) out.base = m.metadataBase ?? null
      for (const [key, value] of Object.entries(m)) {
        if (key === 'metadataBase') continue
        if (key === 'title') {
          const t = titled(value as Title, template)
          out.title = t.absolute
          out.template = t.template
          continue
        }
        ;(out.meta as Record<string, unknown>)[key] = value
      }
    }
    const image = images[i]
    if (image && !(m?.openGraph && 'images' in m.openGraph)) out.meta.openGraph = { ...out.meta.openGraph, images: [image] }
    if (i < levels.length - 2) template = out.template
  })
  return out
}

export function viewport(levels: Array<Viewport | undefined>): Viewport {
  const out: Viewport = { width: 'device-width', initialScale: 1 }
  for (const v of levels) {
    refuse('viewport', VIEW, v)
    Object.assign(out, v)
  }
  return out
}

const list = <T,>(v: T | T[] | undefined | null): T[] => (v === undefined || v === null ? [] : Array.isArray(v) ? v : [v])

const absolute = (url: Url, base: URL | null): string => {
  if (url instanceof URL) return url.toString()
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return url
  if (!base) return url
  return new URL(url, base).toString()
}

const images = (value: Images | undefined, base: URL | null): Image[] =>
  list(value as Url | Image | Array<Url | Image>).map((i) => (typeof i === 'string' || i instanceof URL ? { url: absolute(i, base) } : { ...i, url: absolute(i.url, base) }))

const robots = (r: Omit<Robots, 'googleBot'>): string => {
  const out: string[] = []
  if (r.index !== undefined) out.push(r.index ? 'index' : 'noindex')
  if (r.follow !== undefined) out.push(r.follow ? 'follow' : 'nofollow')
  for (const flag of ['noarchive', 'nosnippet', 'noimageindex', 'nocache', 'notranslate', 'indexifembedded', 'nositelinkssearchbox'] as const) if (r[flag]) out.push(flag)
  if (r.unavailable_after) out.push(`unavailable_after:${r.unavailable_after}`)
  for (const key of ['max-video-preview', 'max-image-preview', 'max-snippet'] as const) if (r[key] !== undefined) out.push(`${key}:${r[key]}`)
  return out.join(', ')
}

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)

/** One image's tags: the url under its base name, each other key under base:key, in the order the object states them. */
function shown(prefix: string, attr: 'property' | 'name', image: Image, key: string): ReactNode[] {
  return Object.entries(image).flatMap(([k, v]) =>
    v === undefined ? [] : [<meta key={`${key}${k}`} {...{ [attr]: k === 'url' ? prefix : `${prefix}:${k === 'secureUrl' ? 'secure_url' : k}` }} content={String(v)} />],
  )
}

/** An icon's href is written as stated: the App Router resolves no icon against metadataBase. */
const icon = (rel: string, i: Url | Icon, key: string): ReactNode => {
  if (typeof i === 'string' || i instanceof URL) return <link key={key} rel={rel} href={String(i)} />
  const { url, rel: own, ...rest } = i
  return <link key={key} rel={own ?? rel} href={String(url)} {...rest} />
}

/** The head as elements, in the order the App Router writes them. */
export function render(head: Head, view: Viewport): ReactNode[] {
  const { base, meta } = head
  const out: ReactNode[] = []
  const add = (node: ReactNode) => out.push(node)
  add(<meta key="charset" charSet="utf-8" />)
  const { themeColor, colorScheme, ...size } = view
  add(
    <meta
      key="viewport"
      name="viewport"
      content={Object.entries(size)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${kebab(k)}=${typeof v === 'boolean' ? (v ? 'yes' : 'no') : v}`)
        .join(', ')}
    />,
  )
  if (head.noindex) add(<meta key="noindex" name="robots" content="noindex" />)
  list(themeColor as string | { media?: string; color: string } | Array<{ media?: string; color: string }>).forEach((t, i) =>
    add(typeof t === 'string' ? <meta key={`theme${i}`} name="theme-color" content={t} /> : <meta key={`theme${i}`} name="theme-color" media={t.media} content={t.color} />),
  )
  if (colorScheme) add(<meta key="scheme" name="color-scheme" content={colorScheme} />)

  if (head.title !== null) add(<title key="title">{head.title}</title>)
  if (meta.description) add(<meta key="description" name="description" content={meta.description} />)
  if (meta.applicationName) add(<meta key="app" name="application-name" content={meta.applicationName} />)
  list(meta.authors).forEach((a, i) => {
    if (a.url) add(<link key={`authorurl${i}`} rel="author" href={absolute(a.url, base)} />)
    if (a.name) add(<meta key={`author${i}`} name="author" content={a.name} />)
  })
  if (meta.manifest) add(<link key="manifest" rel="manifest" href={String(meta.manifest)} />)
  if (meta.generator) add(<meta key="generator" name="generator" content={meta.generator} />)
  if (meta.keywords) add(<meta key="keywords" name="keywords" content={list(meta.keywords).join(',')} />)
  if (meta.referrer) add(<meta key="referrer" name="referrer" content={meta.referrer} />)
  if (meta.creator) add(<meta key="creator" name="creator" content={meta.creator} />)
  if (meta.publisher) add(<meta key="publisher" name="publisher" content={meta.publisher} />)
  if (meta.robots) {
    if (typeof meta.robots === 'string') add(<meta key="robots" name="robots" content={meta.robots} />)
    else {
      const { googleBot, ...rest } = meta.robots
      const basic = robots(rest)
      if (basic) add(<meta key="robots" name="robots" content={basic} />)
      if (googleBot) add(<meta key="googlebot" name="googlebot" content={typeof googleBot === 'string' ? googleBot : robots(googleBot)} />)
    }
  }
  if (meta.category) add(<meta key="category" name="category" content={meta.category} />)
  if (meta.classification) add(<meta key="classification" name="classification" content={meta.classification} />)

  const alt = meta.alternates
  if (alt?.canonical) add(<link key="canonical" rel="canonical" href={absolute(alt.canonical, base)} />)
  for (const [lang, url] of Object.entries(alt?.languages ?? {})) add(<link key={`lang${lang}`} rel="alternate" hrefLang={lang} href={absolute(url, base)} />)
  for (const [media, url] of Object.entries(alt?.media ?? {})) add(<link key={`media${media}`} rel="alternate" media={media} href={absolute(url, base)} />)
  for (const [type, url] of Object.entries(alt?.types ?? {})) add(<link key={`type${type}`} rel="alternate" type={type} href={absolute(url, base)} />)

  for (const [name, values] of Object.entries({ 'google-site-verification': meta.verification?.google, y_key: meta.verification?.yahoo, 'yandex-verification': meta.verification?.yandex, ...meta.verification?.other }))
    list(values).forEach((v, i) => add(<meta key={`verify${name}${i}`} name={name} content={v} />))
  if (meta.formatDetection) {
    const off = Object.entries(meta.formatDetection).filter(([, v]) => v === false).map(([k]) => `${k}=no`)
    if (off.length) add(<meta key="format" name="format-detection" content={off.join(', ')} />)
  }

  const og = meta.openGraph
  const twFill = finish(head)
  if (og) {
    const p = (property: string, content: unknown, k = property) =>
      content === undefined || content === null || content === '' ? undefined : add(<meta key={`og${k}`} property={property} content={String(content)} />)
    p('og:title', twFill.ogTitle)
    p('og:description', twFill.ogDescription)
    if (og.url) p('og:url', absolute(og.url, base))
    p('og:site_name', og.siteName)
    p('og:locale', og.locale)
    p('og:country_name', og.countryName)
    images(og.images, base).forEach((img, i) => out.push(...shown('og:image', 'property', img, `ogimage${i}`)))
    images(og.videos, base).forEach((img, i) => out.push(...shown('og:video', 'property', img, `ogvideo${i}`)))
    images(og.audio, base).forEach((img, i) => out.push(...shown('og:audio', 'property', img, `ogaudio${i}`)))
    list(og.alternateLocale).forEach((l, i) => p('og:locale:alternate', l, `alt${i}`))
    if (og.type) {
      p('og:type', og.type)
      if (og.type === 'article') {
        p('article:published_time', og.publishedTime)
        p('article:modified_time', og.modifiedTime)
        p('article:expiration_time', og.expirationTime)
        list(og.authors).forEach((a, i) => p('article:author', a, `author${i}`))
        p('article:section', og.section)
        list(og.tags).forEach((t, i) => p('article:tag', t, `tag${i}`))
      }
    }
  }
  const tw = twFill.twitter
  if (tw) {
    const n = (name: string, content: unknown, k = name) =>
      content === undefined || content === null || content === '' ? undefined : add(<meta key={`tw${k}`} name={name} content={String(content)} />)
    n('twitter:card', tw.card)
    n('twitter:site', tw.site)
    n('twitter:site:id', tw.siteId)
    n('twitter:creator', tw.creator)
    n('twitter:creator:id', tw.creatorId)
    n('twitter:title', tw.title)
    n('twitter:description', tw.description)
    tw.images.forEach((img, i) => out.push(...shown('twitter:image', 'name', img, `twimage${i}`)))
  }

  const icons = meta.icons
  if (icons) {
    const set =
      typeof icons === 'string' || icons instanceof URL || Array.isArray(icons) || 'url' in (icons as object)
        ? { icon: icons as Url | Icon | Array<Url | Icon> }
        : (icons as { icon?: Url | Icon | Array<Url | Icon>; shortcut?: Url | Icon | Array<Url | Icon>; apple?: Url | Icon | Array<Url | Icon>; other?: Icon | Icon[] })
    list(set.shortcut).forEach((i, k) => add(icon('shortcut icon', i, `short${k}`)))
    list(set.icon).forEach((i, k) => add(icon('icon', i, `icon${k}`)))
    list(set.apple).forEach((i, k) => add(icon('apple-touch-icon', i, `apple${k}`)))
    list(set.other).forEach((i, k) => add(icon(i.rel ?? 'icon', i, `other${k}`)))
  }
  for (const [name, values] of Object.entries(meta.other ?? {})) list(values).forEach((v, i) => add(<meta key={`other${name}${i}`} name={name} content={String(v)} />))
  return out
}

/**
 * openGraph's and twitter's title and description, filled from the page's own
 * when they state none; twitter's images from openGraph's.
 */
function finish(head: Head) {
  const { meta, base } = head
  const og = meta.openGraph
  const ogTitle = og ? (og.title === undefined || og.title === null ? head.title : titled(og.title, null).absolute) : undefined
  const ogDescription = og ? (og.description ?? meta.description ?? undefined) : undefined
  let twitter: { card?: string; site?: string; siteId?: string; creator?: string; creatorId?: string; title?: string | null; description?: string; images: Image[] } | undefined
  if (meta.twitter || og) {
    const tw = meta.twitter ?? {}
    const imgs = 'images' in tw && tw.images ? images(tw.images, base) : images(og?.images, base)
    twitter = {
      card: tw.card ?? (imgs.length ? 'summary_large_image' : 'summary'),
      site: tw.site,
      siteId: tw.siteId,
      creator: tw.creator,
      creatorId: tw.creatorId,
      title: tw.title !== undefined && tw.title !== null ? titled(tw.title, null).absolute : og ? ogTitle : head.title,
      description: tw.description ?? (og ? ogDescription : meta.description ?? undefined),
      images: imgs,
    }
  }
  return { ogTitle, ogDescription, twitter }
}

/** robots.txt, as the App Router writes it. */
export function robotsText(r: MetadataRoute.Robots): string {
  let out = ''
  for (const rule of list(r.rules)) {
    for (const agent of list(rule.userAgent ?? '*')) out += `User-Agent: ${agent}\n`
    for (const a of list(rule.allow)) out += `Allow: ${a}\n`
    for (const d of list(rule.disallow)) out += `Disallow: ${d}\n`
    if (rule.crawlDelay) out += `Crawl-delay: ${rule.crawlDelay}\n`
    out += '\n'
  }
  if (r.host) out += `Host: ${r.host}\n`
  for (const s of list(r.sitemap)) out += `Sitemap: ${s}\n`
  return out
}

/** sitemap.xml, as the App Router writes it. */
export function sitemapText(entries: MetadataRoute.Sitemap): string {
  const alternates = entries.some((e) => e.alternates?.languages && Object.keys(e.alternates.languages).length)
  let out = '<?xml version="1.0" encoding="UTF-8"?>\n'
  out += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${alternates ? ' xmlns:xhtml="http://www.w3.org/1999/xhtml"' : ''}>\n`
  for (const e of entries) {
    out += '<url>\n'
    out += `<loc>${e.url}</loc>\n`
    for (const [lang, href] of Object.entries(e.alternates?.languages ?? {})) out += `<xhtml:link rel="alternate" hreflang="${lang}" href="${href}" />\n`
    if (e.lastModified) out += `<lastmod>${e.lastModified instanceof Date ? e.lastModified.toISOString() : e.lastModified}</lastmod>\n`
    if (e.changeFrequency) out += `<changefreq>${e.changeFrequency}</changefreq>\n`
    if (typeof e.priority === 'number') out += `<priority>${e.priority}</priority>\n`
    out += '</url>\n'
  }
  out += '</urlset>\n'
  return out
}
