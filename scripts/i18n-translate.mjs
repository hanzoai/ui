/**
 * Fill missing catalog strings from an OpenAI-compatible chat API.
 *
 * English in `pkg/ui/src/i18n/source.ts` is the source. This writes only keys
 * a locale file lacks, so a reviewed translation is never overwritten.
 * Nothing here is a secret: the key comes from the environment.
 *
 *   HANZO_API_KEY=… node scripts/i18n-translate.mjs
 *   HANZO_API_KEY=… HANZO_API_BASE=https://api.hanzo.ai/v1 node scripts/i18n-translate.mjs --locale es
 *
 * `HANZO_API_BASE` defaults to https://api.hanzo.ai/v1. `HANZO_I18N_MODEL`
 * defaults to `gpt-4o-mini`. Product names (Hanzo, Enso, Kai, Lux, Zoo, Zen),
 * `{placeholders}`, code and URLs must be copied unchanged. The model is
 * asked for that, and this script refuses a reply that drops a placeholder.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const sourcePath = join(root, 'pkg/ui/src/i18n/source.ts')
const catalogDir = join(root, 'pkg/ui/src/i18n/catalogs')

/** Path tag → catalog file `@hanzo/i18n` negotiates it to. */
const FILES = {
  es: 'es-ES.json',
  fr: 'fr-FR.json',
  de: 'de-DE.json',
  it: 'it-IT.json',
  'pt-BR': 'pt-BR.json',
  ru: 'ru.json',
  tr: 'tr.json',
  ar: 'ar.json',
  hi: 'hi-IN.json',
  id: 'id-ID.json',
  vi: 'vi.json',
  th: 'th.json',
  ja: 'ja-JP.json',
  ko: 'ko-KR.json',
  'zh-CN': 'zh-Hans.json',
  'zh-TW': 'zh-Hant.json',
}

const NAMES = {
  es: 'Spanish (Spain)',
  fr: 'French (France)',
  de: 'German',
  it: 'Italian',
  'pt-BR': 'Brazilian Portuguese',
  ru: 'Russian',
  tr: 'Turkish',
  ar: 'Arabic',
  hi: 'Hindi',
  id: 'Indonesian',
  vi: 'Vietnamese',
  th: 'Thai',
  ja: 'Japanese',
  ko: 'Korean',
  'zh-CN': 'Simplified Chinese',
  'zh-TW': 'Traditional Chinese',
}

const keys = [...readFileSync(sourcePath, 'utf8').matchAll(/^ {2}'(.*)',?$/gm)].map((m) => m[1])
const only = process.argv.includes('--locale') ? process.argv[process.argv.indexOf('--locale') + 1] : null
const targets = only ? [only] : Object.keys(FILES)
const base = (process.env.HANZO_API_BASE || 'https://api.hanzo.ai/v1').replace(/\/$/, '')
const key = process.env.HANZO_API_KEY || process.env.OPENAI_API_KEY
const model = process.env.HANZO_I18N_MODEL || 'gpt-4o-mini'

if (!key) {
  console.error('Set HANZO_API_KEY (or OPENAI_API_KEY). No request was sent.')
  process.exit(1)
}

const tokens = (s) => s.match(/\{[a-zA-Z]+\}/g) ?? []

async function translate(locale, batch) {
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: [
            `Translate UI strings into ${NAMES[locale] || locale}.`,
            'Return a JSON object whose keys are the English source strings and whose values are the translations.',
            'Keep {placeholders} exactly, including the braces.',
            'Do not translate Hanzo, Enso, Kai, Lux, Zoo, Zen, URLs, code, or file names.',
            'Natural interface copy, not a gloss. Preserve punctuation the English uses to address a person.',
          ].join(' '),
        },
        { role: 'user', content: JSON.stringify(Object.fromEntries(batch.map((k) => [k, k]))) },
      ],
    }),
  })
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
  const body = await res.json()
  const raw = body.choices?.[0]?.message?.content
  if (!raw) throw new Error('empty completion')
  return JSON.parse(raw)
}

for (const locale of targets) {
  const file = FILES[locale]
  if (!file) {
    console.error(`unknown locale ${locale}`)
    process.exit(1)
  }
  const path = join(catalogDir, file)
  const catalog = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {}
  const missing = keys.filter((k) => typeof catalog[k] !== 'string' || catalog[k].length === 0)
  if (!missing.length) {
    console.log(`${locale}: complete`)
    continue
  }
  console.log(`${locale}: ${missing.length} missing`)
  for (let i = 0; i < missing.length; i += 40) {
    const batch = missing.slice(i, i + 40)
    const got = await translate(locale, batch)
    for (const k of batch) {
      const value = got[k]
      if (typeof value !== 'string' || !value) {
        console.error(`  no translation for ${JSON.stringify(k)}`)
        continue
      }
      for (const token of tokens(k)) {
        if (!value.includes(token)) {
          console.error(`  refused ${JSON.stringify(k)} (dropped ${token})`)
          continue
        }
      }
      catalog[k] = value
    }
  }
  const ordered = {}
  for (const k of keys) if (typeof catalog[k] === 'string') ordered[k] = catalog[k]
  writeFileSync(path, JSON.stringify(ordered, null, 2) + '\n')
  console.log(`${locale}: wrote ${file}`)
}
