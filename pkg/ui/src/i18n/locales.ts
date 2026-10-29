/**
 * Locales the component library ships catalogs for.
 *
 * English is the source and the default: a missing key, an unknown tag, and a
 * tree with no provider all render the English that was written in the source.
 * Tags are the ones Hanzo's sites put in the path (`es`, `zh-CN`). `@hanzo/i18n`
 * `resolve` turns each into the catalog it actually ships (`es` → `es-ES`,
 * `zh-TW` → `zh-Hant`), and `direction` says which way it reads, so Arabic and
 * the other Arabic- and Hebrew-script locales are right to left without this
 * list having to name them.
 */
import { direction, resolve } from '@hanzo/i18n'

/** Path and prop tags, English first. */
export const LOCALES = [
  'en',
  'es',
  'fr',
  'de',
  'it',
  'pt-BR',
  'ru',
  'tr',
  'ar',
  'hi',
  'id',
  'vi',
  'th',
  'ja',
  'ko',
  'zh-CN',
  'zh-TW',
] as const

export type Locale = (typeof LOCALES)[number]

/** The catalog file `@hanzo/i18n` loads for a tag, after negotiation. */
export const catalogCode = (locale: string | null | undefined): string => resolve(locale || 'en')

/** `rtl` for Arabic script and Hebrew script, `ltr` otherwise. */
export const localeDirection = (locale: string | null | undefined): 'ltr' | 'rtl' => direction(locale || 'en')

/** A tag this package publishes a catalog for. `en` is the source, not a file. */
export const isLocale = (value: string): value is Locale => (LOCALES as readonly string[]).includes(value)

/**
 * The name a reader of the language recognises. Never a flag. English is the
 * source locale and is named in English; the others are named in themselves.
 */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  'pt-BR': 'Português (Brasil)',
  ru: 'Русский',
  tr: 'Türkçe',
  ar: 'العربية',
  hi: 'हिन्दी',
  id: 'Bahasa Indonesia',
  vi: 'Tiếng Việt',
  th: 'ไทย',
  ja: '日本語',
  ko: '한국어',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
}

/** `lang` on `<html>`: region tags stay as written (`pt-BR`, `zh-CN`). */
export const htmlLang = (locale: string | null | undefined): string => (locale && locale !== 'en' ? locale : 'en')
