/**
 * Localized sitemap for ui.hanzo.ai. English is unprefixed; every other locale
 * is `/<locale><path>`. Each URL carries the whole alternate set.
 *
 *   node apps/ui.hanzo.ai/scripts/sitemap.mjs
 */
import { existsSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const app = join(dirname(fileURLToPath(import.meta.url)), '..')
const origin = 'https://ui.hanzo.ai'
const LOCALES = ['es', 'fr', 'de', 'it', 'pt-BR', 'ru', 'tr', 'ar', 'hi', 'id', 'vi', 'th', 'ja', 'ko', 'zh-CN', 'zh-TW']

function mdx(dir, prefix = '') {
  const out = []
  for (const name of readdirSync(dir)) {
    if (name.endsWith('.mdx')) out.push(prefix + name.replace(/\.mdx$/, ''))
    else {
      try {
        out.push(...mdx(join(dir, name), `${prefix}${name}/`))
      } catch {
        /* file */
      }
    }
  }
  return out
}

function names(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((name) => name.endsWith('.tsx'))
    .map((name) => name.replace(/\.tsx$/, ''))
}

const paths = new Set(['/'])
for (const slug of mdx(join(app, 'data/docs'))) {
  paths.add(slug === 'index' ? '/docs' : `/docs/${slug}`)
}
const groups = ['ui', 'blocks', 'product', 'chat', 'agents', 'settings', 'catalog']
for (const group of groups) {
  paths.add(`/${group}`)
  const dir = group === 'ui' ? join(app, 'examples') : join(app, 'examples', group)
  for (const name of names(dir)) paths.add(`/${group}/${name}`)
}

const page = (path) => (path === '/' ? '' : path)
const href = (locale, path) => `${origin}${locale ? `/${locale}` : ''}${page(path) || '/'}`
const alternates = (path) =>
  [
    ['x-default', href(null, path)],
    ['en', href(null, path)],
    ...LOCALES.map((locale) => [locale, href(locale, path)]),
  ]
    .map(([lang, loc]) => `    <xhtml:link rel="alternate" hreflang="${lang}" href="${loc}"/>`)
    .join('\n')

const urls = []
for (const path of [...paths].sort()) {
  const locals = [null, ...LOCALES]
  for (const locale of locals) {
    urls.push(`  <url>\n    <loc>${href(locale, path)}</loc>\n${alternates(path)}\n  </url>`)
  }
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`
const dest = join(app, 'public/sitemap.xml')
mkdirSync(dirname(dest), { recursive: true })
writeFileSync(dest, xml)
console.log(`${paths.size} paths × ${LOCALES.length + 1} locales → ${dest}`)
