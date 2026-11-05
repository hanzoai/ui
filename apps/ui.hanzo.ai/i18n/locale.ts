/**
 * Locale in the path. English is unprefixed (`/docs`). Every other catalog
 * lives at `/<locale>/docs`. Unknown prefixes are not locales, so `/docs`
 * stays the English page.
 */
export const LOCALES = [
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

export type SiteLocale = (typeof LOCALES)[number]

export const LOCALE_NAMES: Record<SiteLocale | 'en', string> = {
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

const SET = new Set<string>(LOCALES)

export const isLocale = (value: string): value is SiteLocale => SET.has(value)

/** `rtl` for Arabic. Other locales this site offers read left to right. */
export const dirFor = (locale: string | null): 'ltr' | 'rtl' => (locale === 'ar' ? 'rtl' : 'ltr')

export function splitLocale(path: string): { locale: SiteLocale | null; rest: string } {
  const clean = path.split('?')[0] || '/'
  const parts = clean.split('/').filter(Boolean)
  const head = parts[0]
  if (head && isLocale(head)) {
    const rest = '/' + parts.slice(1).join('/')
    return { locale: head, rest: rest === '/' ? '/' : rest.replace(/\/$/, '') || '/' }
  }
  return { locale: null, rest: clean || '/' }
}

/** Prefix an in-site path. External URLs and hashes stay as they are. */
export function withLocale(href: string, locale: string | null): string {
  if (!locale || !href.startsWith('/') || href.startsWith('//')) return href
  if (href === '/') return `/${locale}`
  return `/${locale}${href}`
}

export interface Alternate {
  hreflang: string
  href: string
}

/** Reciprocal alternates, including `x-default` on the unprefixed English URL. */
export function alternates(path: string, origin = 'https://ui.hanzo.ai'): Alternate[] {
  const rest = splitLocale(path).rest
  const page = rest === '/' ? '' : rest
  const href = (locale: string | null) => `${origin}${locale ? `/${locale}` : ''}${page || '/'}`
  return [
    { hreflang: 'x-default', href: href(null) },
    { hreflang: 'en', href: href(null) },
    ...LOCALES.map((locale) => ({ hreflang: locale, href: href(locale) })),
  ]
}
