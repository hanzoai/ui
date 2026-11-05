/**
 * Localization for `@hanzo/ui`.
 *
 * English is the source. Built-in copy is a catalog keyed by that English, so
 * a component with no provider renders exactly the words it rendered before
 * this existed. `<LocaleProvider>` or `<Hanzo locale="ja">` switches the
 * catalog. A missing key falls back to English, per call, not per page.
 */
export { LOCALES, LOCALE_NAMES, catalogCode, htmlLang, isLocale, localeDirection, type Locale } from './locales'
export { SOURCE, type MessageKey, type Messages } from './source'
export { CATALOGS, catalogFor } from './catalogs'
export { LocaleProvider, type LocaleProviderProps } from './provider'
export { useDirection, useFormat, useLocale, useTranslate, type LocaleValue, type Translate } from './react'
