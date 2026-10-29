/**
 * Translate docs MDX that does not yet have a locale copy.
 *
 * English lives in apps/ui.hanzo.ai/data/docs. A translation is
 * apps/ui.hanzo.ai/data/i18n/<locale>/<same path>.mdx. Pages without a
 * copy render in English (see docFile in apps/ui.hanzo.ai/mdx.ts).
 *
 * Fenced code, inline code, URLs and the frontmatter keys `title` and
 * `description` stay structured: only the prose is sent to the model, and
 * code fences are put back afterwards. Hanzo, Enso, Kai, Lux, Zoo and Zen
 * stay in Latin script. `{brand.name}` and other MDX expressions stay.
 *
 *   HANZO_API_KEY=… node scripts/i18n-translate-mdx.mjs
 *   HANZO_API_KEY=… node scripts/i18n-translate-mdx.mjs --locale ja --slug index
 *
 * HANZO_API_BASE defaults to https://api.hanzo.ai/v1.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const docs = join(root, 'apps/ui.hanzo.ai/data/docs')
const outRoot = join(root, 'apps/ui.hanzo.ai/data/i18n')
const LOCALES = ['es', 'fr', 'de', 'it', 'pt-BR', 'ru', 'tr', 'ar', 'hi', 'id', 'vi', 'th', 'ja', 'ko', 'zh-CN', 'zh-TW']
const NAMES = {
  es: 'Spanish', fr: 'French', de: 'German', it: 'Italian', 'pt-BR': 'Brazilian Portuguese',
  ru: 'Russian', tr: 'Turkish', ar: 'Arabic', hi: 'Hindi', id: 'Indonesian', vi: 'Vietnamese',
  th: 'Thai', ja: 'Japanese', ko: 'Korean', 'zh-CN': 'Simplified Chinese', 'zh-TW': 'Traditional Chinese',
}

const arg = (name) => {
  const i = process.argv.indexOf(name)
  return i === -1 ? null : process.argv[i + 1]
}
const onlyLocale = arg('--locale')
const onlySlug = arg('--slug')
const base = (process.env.HANZO_API_BASE || 'https://api.hanzo.ai/v1').replace(/\/$/, '')
const key = process.env.HANZO_API_KEY || process.env.OPENAI_API_KEY
const model = process.env.HANZO_I18N_MODEL || 'gpt-4o-mini'
if (!key) {
  console.error('Set HANZO_API_KEY (or OPENAI_API_KEY). No request was sent.')
  process.exit(1)
}

function slugs(dir, prefix = '') {
  const out = []
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (name.endsWith('.mdx')) out.push(prefix + name.replace(/\.mdx$/, ''))
    else if (!name.startsWith('.')) {
      try {
        out.push(...slugs(path, `${prefix}${name}/`))
      } catch {
        /* not a directory */
      }
    }
  }
  return out
}

function shield(source) {
  const fences = []
  const text = source.replace(/```[\s\S]*?```/g, (fence) => {
    fences.push(fence)
    return `\n@@FENCE${fences.length - 1}@@\n`
  })
  return { text, fences }
}

function restore(text, fences) {
  return text.replace(/@@FENCE(\d+)@@/g, (_, n) => fences[Number(n)])
}

async function translate(locale, source) {
  const { text, fences } = shield(source)
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: [
            `Translate this MDX documentation page into ${NAMES[locale]}.`,
            'Keep the frontmatter keys title and description in English; translate their values.',
            'Keep every @@FENCE n @@ marker on its own line, unchanged.',
            'Keep inline code, URLs, import paths, {brand.name}, {brand.org} and component names unchanged.',
            'Do not translate Hanzo, Enso, Kai, Lux, Zoo or Zen.',
            'Preserve Markdown structure: headings, lists, tables, links.',
            'Return only the translated MDX.',
          ].join(' '),
        },
        { role: 'user', content: text },
      ],
    }),
  })
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
  const body = await res.json()
  const raw = body.choices?.[0]?.message?.content
  if (!raw) throw new Error('empty completion')
  const cleaned = raw.replace(/^```(?:mdx|md)?\n/, '').replace(/\n```$/, '')
  if ((cleaned.match(/@@FENCE/g) || []).length !== fences.length) {
    throw new Error(`fence count changed for ${locale}`)
  }
  return restore(cleaned, fences)
}

const pages = slugs(docs).filter((slug) => !onlySlug || slug === onlySlug)
const locales = LOCALES.filter((locale) => !onlyLocale || locale === onlyLocale)

for (const slug of pages) {
  const source = readFileSync(join(docs, `${slug}.mdx`), 'utf8')
  for (const locale of locales) {
    const dest = join(outRoot, locale, `${slug}.mdx`)
    if (existsSync(dest)) {
      console.log(`${locale} ${slug}: present`)
      continue
    }
    console.log(`${locale} ${slug}: translating`)
    const translated = await translate(locale, source)
    mkdirSync(dirname(dest), { recursive: true })
    writeFileSync(dest, translated.endsWith('\n') ? translated : translated + '\n')
  }
}
