'use client'

/**
 * `<LocaleProvider locale="ar">` — the reader's language for everything inside.
 *
 * `locale` is a BCP-47 tag. The ones the catalogs cover are `en`, `es`, `fr`,
 * `de`, `it`, `pt-BR`, `ru`, `tr`, `ar`, `hi`, `id`, `vi`, `th`, `ja`, `ko`,
 * `zh-CN` and `zh-TW`; any other tag `@hanzo/i18n` knows (`fa`, `he`, `nl`, …)
 * still negotiates, sets direction, and falls back to English wherever this
 * package has no sentence for it. `messages` overlays the catalog, key by
 * English source, so a host can correct one string without replacing the rest.
 *
 * The provider sets `dir` and `lang` on a box that does not generate its own
 * layout (`display: contents`), so a right-to-left locale turns the subtree
 * without inserting a flex item. `syncDocument` also writes `<html lang dir>`,
 * which a page wants and a nested widget usually does not.
 */
import { useLayoutEffect, type CSSProperties, type ReactNode } from 'react'

import { catalogFor } from './catalogs'
import { catalogCode, htmlLang, localeDirection } from './locales'
import { LocaleContext, makeValue } from './react'
import type { Messages } from './source'

export interface LocaleProviderProps {
  children?: ReactNode
  /**
   * BCP-47 tag. Omitted, the provider still mounts (so `messages` apply) and
   * reads as English.
   */
  locale?: string
  /** Overrides and additions, keyed by the English source. Wins over the catalog. */
  messages?: Messages
  /** Also set `<html lang dir>`. A document does this; a widget inside one does not. */
  syncDocument?: boolean
}

const BOX = { display: 'contents' } as CSSProperties

export function LocaleProvider({ children, locale, messages, syncDocument = false }: LocaleProviderProps) {
  const code = catalogCode(locale)
  const merged: Messages = messages ? { ...catalogFor(code), ...messages } : catalogFor(code)
  const value = makeValue(code, merged)
  const dir = localeDirection(code)
  // The tag the caller asked for, so `/zh-TW` stays `zh-TW` on `<html lang>` even
  // though the catalog file is `zh-Hant`. English is `en`.
  const lang = htmlLang(locale)

  useLayoutEffect(() => {
    if (!syncDocument || typeof document === 'undefined') return
    const root = document.documentElement
    const prevLang = root.lang
    const prevDir = root.dir
    root.lang = lang
    root.dir = dir
    return () => {
      root.lang = prevLang
      root.dir = prevDir
    }
  }, [syncDocument, lang, dir])

  return (
    <LocaleContext.Provider value={value}>
      <div dir={dir} lang={lang} style={BOX}>
        {children}
      </div>
    </LocaleContext.Provider>
  )
}
