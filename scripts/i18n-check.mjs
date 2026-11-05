/**
 * Every built-in string has a translation in every target locale.
 *
 * A missing key still renders in English at runtime (`translate` returns the
 * source). This check is what stops a new string from shipping in English only
 * without anyone noticing. Run it after adding a `tr('…')` / `t('…')` call:
 *
 *   node scripts/i18n-check.mjs
 *
 * Exit 1 when a target catalog lacks a key from `pkg/ui/src/i18n/source.ts`,
 * or a `{placeholder}` in the English is missing from a translation.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const source = readFileSync(join(root, 'pkg/ui/src/i18n/source.ts'), 'utf8')
const keys = [...source.matchAll(/^ {2}'(.*)',?$/gm)].map((m) => m[1])
const dir = join(root, 'pkg/ui/src/i18n/catalogs')
const files = readdirSync(dir).filter((name) => name.endsWith('.json'))
let failed = 0

if (keys.length === 0) {
  console.error('no keys in source.ts')
  process.exit(1)
}

for (const file of files) {
  const catalog = JSON.parse(readFileSync(join(dir, file), 'utf8'))
  for (const key of keys) {
    const value = catalog[key]
    if (typeof value !== 'string' || value.length === 0) {
      console.error(`${file} missing ${JSON.stringify(key)}`)
      failed++
      continue
    }
    for (const token of key.match(/\{[a-zA-Z]+\}/g) ?? []) {
      if (!value.includes(token)) {
        console.error(`${file} dropped ${token} from ${JSON.stringify(key)}`)
        failed++
      }
    }
  }
}

if (failed) {
  console.error(`${failed} problem(s). Runtime still falls back to English.`)
  process.exit(1)
}
console.log(`${files.length} catalogs × ${keys.length} strings`)
