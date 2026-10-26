/**
 * Corner's decisions, as pure functions over plain values: which list gets a
 * search, what a search matches, and the words the panel says. They import
 * nothing but `phrase`, so they are tested in node and a server can load them.
 */
import { phrase } from '@hanzo/i18n'

/** One choice a host offers: its code, its name in its own script, and how it is written. */
export type Option = {
  /** What `onChange` receives: `en`, `ar`, `USD`. */
  code: string
  /** The name shown, in the option's own script for a language: `Deutsch`, `العربية`. */
  label: string
  /** A quieter second name, searched too: `German`, `US dollar`. */
  hint?: string
  /** A language's writing direction, so its name lays out the way it is read. */
  dir?: 'ltr' | 'rtl'
}

/** A preference the host owns. Corner draws it and reports a choice; the host stores it. */
export type Setting = {
  value: string
  options: readonly Option[]
  onChange: (code: string) => void
}

/** What the panel says, in English; Corner draws each word through the host's @hanzo/i18n `t`. */
export type Words = {
  /** The trigger's and the panel's name. */
  open: string
  help: string
  preferences: string
  theme: string
  auto: string
  light: string
  dark: string
  language: string
  currency: string
  /** The face the page is set in, and its four answers. */
  font: string
  sans: string
  system: string
  serif: string
  mono: string
  /** The face Arabic is set in, and its two answers (`sans` names the other). */
  arabic: string
  kufi: string
  search: string
  back: string
  close: string
  /** A search that matched nothing. */
  none: string
}

export const WORDS: Words = {
  open: phrase('Help and preferences'),
  help: phrase('Help'),
  preferences: phrase('Preferences'),
  theme: phrase('Theme'),
  auto: phrase('Auto'),
  light: phrase('Light'),
  dark: phrase('Dark'),
  language: phrase('Language'),
  currency: phrase('Currency'),
  font: phrase('Font'),
  sans: phrase('Sans'),
  system: phrase('System'),
  serif: phrase('Serif'),
  mono: phrase('Mono'),
  arabic: phrase('Arabic font'),
  kufi: phrase('Kufi'),
  search: phrase('Search'),
  back: phrase('Back'),
  close: phrase('Close'),
  none: phrase('No matches'),
}

/** Past this many options a list gets a search field. */
export const LONG = 8

/**
 * Text as a search compares it: lower case, accents dropped, so `francais`
 * finds `Français` and `turk` finds `Türkçe`. Scripts without case or marks
 * pass through unchanged.
 */
export const fold = (s: string): string =>
  s.normalize('NFD').replace(/\p{M}+/gu, '').toLowerCase()

/**
 * The options a search keeps, in the host's order. A literal substring of the
 * label, the hint or the code, never a pattern: the needle is whatever was typed.
 */
export function find(options: readonly Option[], q: string): Option[] {
  const needle = fold(q.trim())
  if (!needle) return options.slice()
  return options.filter((o) => fold(o.label).includes(needle) || fold(o.hint ?? '').includes(needle) || fold(o.code).includes(needle))
}

/**
 * Whether a language is written in Arabic script — Arabic, Persian, Urdu,
 * Pashto, Sindhi, Sorani, Uyghur, Shahmukhi Punjabi — by the script its
 * likeliest subtags name. A malformed tag is not.
 */
export function arabic(tag: string | undefined): boolean {
  if (!tag) return false
  try {
    return new Intl.Locale(tag).maximize().script === 'Arab'
  } catch {
    return false
  }
}

/** The label of the chosen option, or its code when the host did not list it. */
export const shown = (s: Setting): string => s.options.find((o) => o.code === s.value)?.label ?? s.value
