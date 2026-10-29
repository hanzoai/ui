import { useTranslate } from '@hanzo/ui'
import type { Href } from 'one'
import { Link, usePathname } from 'one'
import type { ComponentProps, ReactNode } from 'react'

import { LOCALE_NAMES, LOCALES, splitLocale, withLocale, alternates, type SiteLocale } from '~/i18n/locale'

/** Prefix an in-site href with the locale the reader is on. */
export function useLocalHref() {
  const { locale } = splitLocale(usePathname() || '/')
  return (href: string) => withLocale(href, locale)
}

export function useSiteLocale(): SiteLocale | null {
  return splitLocale(usePathname() || '/').locale
}

/** The path without its locale prefix, for comparing nav items. */
export function useBarePath(): string {
  return splitLocale(usePathname() || '/').rest
}

/** hreflang alternates for the page the reader is on. */
export function Alternates() {
  const path = usePathname() || '/'
  return (
    <>
      {alternates(path).map((alt) => (
        <link key={alt.hreflang} rel="alternate" hrefLang={alt.hreflang} href={alt.href} />
      ))}
    </>
  )
}

/** The language list. Each option is named in its own language. */
export function LanguageSwitch() {
  const t = useTranslate()
  const path = usePathname() || '/'
  const { locale, rest } = splitLocale(path)
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center' }}>
      <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{t('Language')}</span>
      <select
        aria-label={t('Language')}
        value={locale ?? 'en'}
        onChange={(event) => {
          const next = event.target.value
          const href = withLocale(rest, next === 'en' ? null : next)
          window.location.assign(href)
        }}
        style={{
          maxWidth: 148,
          height: 36,
          color: 'inherit',
          background: 'transparent',
          border: '1px solid transparent',
          borderRadius: 8,
          paddingInline: 8,
          font: 'inherit',
        }}
      >
        <option value="en">{LOCALE_NAMES.en}</option>
        {LOCALES.map((code) => (
          <option key={code} value={code} lang={code}>
            {LOCALE_NAMES[code]}
          </option>
        ))}
      </select>
    </label>
  )
}

/** A link that keeps the current locale. */
export function LocaleLink({ href, children, ...rest }: { href: string; children: ReactNode } & Omit<ComponentProps<typeof Link>, 'href' | 'children'>) {
  const local = useLocalHref()
  return (
    <Link href={local(href) as Href} {...rest}>
      {children}
    </Link>
  )
}
