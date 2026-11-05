'use client'

/**
 * The locale a tree is reading in.
 *
 * No provider — the default — is English, and `t` returns the sentence it was
 * given. That is what every existing call site already rendered, so mounting
 * nothing changes nothing. A provider (or `<Hanzo locale="…">`) replaces `t`
 * with the catalog for that locale; a key the catalog lacks still comes back
 * in English.
 *
 * When this tree has no provider but an ancestor mounted `@hanzo/i18n`'s
 * `I18nProvider`, `t` is that provider's. A Hanzo locale wins over it, because
 * the prop is the nearer instruction.
 */
import { format as makeFormat, translate, type Format } from '@hanzo/i18n'
import { useI18n } from '@hanzo/i18n/react'
import { createContext, useContext, type ReactNode } from 'react'

import { localeDirection } from './locales'
import type { Messages } from './source'

export type Translate = (source: string, values?: Readonly<Record<string, string | number>>) => string

export interface LocaleValue {
  /** False when no `<LocaleProvider>` is mounted. `t` then follows `@hanzo/i18n`, or English. */
  active: boolean
  /** Negotiated tag (`es-ES`, `zh-Hant`). `en-US` when inactive. */
  locale: string
  dir: 'ltr' | 'rtl'
  messages: Messages
  t: Translate
  format: Format
}

const identity: Translate = (source, values) => translate({}, source, values)

const IDLE: LocaleValue = {
  active: false,
  locale: 'en-US',
  dir: 'ltr',
  messages: {},
  t: identity,
  format: makeFormat('en-US'),
}

export const LocaleContext = createContext<LocaleValue>(IDLE)

export const makeValue = (locale: string, messages: Messages): LocaleValue => {
  const dir = localeDirection(locale)
  return {
    active: true,
    locale,
    dir,
    messages,
    t: (source, values) => translate(messages, source, values),
    format: makeFormat(locale),
  }
}

/** The reader's wording. English, the authored string, when nothing has set a locale. */
export function useTranslate(): Translate {
  const ours = useContext(LocaleContext)
  const theirs = useI18n()
  return ours.active ? ours.t : theirs.t
}

/**
 * Reading direction. A `<LocaleProvider>` wins; otherwise `@hanzo/i18n`'s
 * provider, which is left-to-right when none is mounted.
 */
export function useDirection(): 'ltr' | 'rtl' {
  const tree = useContext(LocaleContext)
  const legacy = useI18n()
  return tree.active ? tree.dir : legacy.dir
}

/** Locale and direction. `active` is false until a provider mounts. */
export function useLocale(): Pick<LocaleValue, 'active' | 'locale' | 'dir'> {
  const ours = useContext(LocaleContext)
  if (ours.active) return { active: true, locale: ours.locale, dir: ours.dir }
  return { active: false, locale: 'en-US', dir: 'ltr' }
}

/**
 * Figures, money, dates and lists for the active locale.
 *
 * With no provider this is English (`en-US`), matching a component that has
 * not been asked to follow a reader. Pass a `locale` prop to a field to pin
 * it regardless.
 */
export function useFormat(): Format {
  const ours = useContext(LocaleContext)
  const theirs = useI18n()
  return ours.active ? ours.format : theirs.format
}

export type { ReactNode }
