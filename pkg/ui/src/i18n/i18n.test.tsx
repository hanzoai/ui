/**
 * Built-in copy follows the locale, and English is what a tree with no locale
 * already said. A missing key is the English source, not a blank and not a key
 * name.
 */
import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { CATALOGS } from './catalogs'
import { LOCALES } from './locales'
import { LocaleProvider } from './provider'
import { useTranslate } from './react'
import { SOURCE } from './source'

function Probe({ text, values }: { text: string; values?: Record<string, string | number> }) {
  const t = useTranslate()
  return <span data-probe="">{t(text, values)}</span>
}

const text = (node: ReactNode) => {
  const html = renderToStaticMarkup(node)
  return html.replace(/<[^>]+>/g, '')
}

describe('locale catalogs', () => {
  it('renders English when no provider is mounted', () => {
    expect(text(<Probe text="Close" />)).toBe('Close')
  })

  it('translates a built-in string and falls back to English for a missing one', () => {
    const node = (
      <LocaleProvider locale="ar">
        <Probe text="Close" />
      </LocaleProvider>
    )
    expect(text(node)).toBe('إغلاق')
    expect(text(
      <LocaleProvider locale="ja">
        <Probe text="This sentence is not in the catalog." />
      </LocaleProvider>,
    )).toBe('This sentence is not in the catalog.')
  })

  it('fills placeholders and keeps product names', () => {
    expect(text(
      <LocaleProvider locale="fr">
        <Probe text="Remove {name}" values={{ name: 'Hanzo' }} />
      </LocaleProvider>,
    )).toBe('Retirer Hanzo')
  })

  it('sets dir=rtl for Arabic and dir=ltr for Japanese', () => {
    const ar = renderToStaticMarkup(
      <LocaleProvider locale="ar">
        <Probe text="Close" />
      </LocaleProvider>,
    )
    const ja = renderToStaticMarkup(
      <LocaleProvider locale="ja">
        <Probe text="Close" />
      </LocaleProvider>,
    )
    expect(ar).toContain('dir="rtl"')
    expect(ar).toContain('lang="ar"')
    expect(ja).toContain('dir="ltr"')
    expect(ja).toContain('lang="ja"')
  })

  it('negotiates path tags onto the catalog that ships', () => {
    expect(text(
      <LocaleProvider locale="zh-CN">
        <Probe text="Close" />
      </LocaleProvider>,
    )).toBe(CATALOGS['zh-Hans']!['Close'])
    expect(text(
      <LocaleProvider locale="zh-TW">
        <Probe text="Close" />
      </LocaleProvider>,
    )).toBe(CATALOGS['zh-Hant']!['Close'])
    expect(text(
      <LocaleProvider locale="pt-BR">
        <Probe text="Close" />
      </LocaleProvider>,
    )).toBe('Fechar')
  })

  it('lets a host overlay one string', () => {
    expect(text(
      <LocaleProvider locale="es" messages={{ Close: 'Cerrar ya' }}>
        <Probe text="Close" />
      </LocaleProvider>,
    )).toBe('Cerrar ya')
  })

  it('ships every source string in every target locale, placeholders intact', () => {
    const targets = LOCALES.filter((locale) => locale !== 'en')
    expect(targets).toHaveLength(16)
    expect(Object.keys(CATALOGS)).toHaveLength(16)
    for (const code of Object.keys(CATALOGS)) {
      const catalog = CATALOGS[code]!
      for (const key of SOURCE) {
        const value = catalog[key]
        expect(value, `${code} missing ${key}`).toEqual(expect.any(String))
        expect(value!.length, `${code} empty ${key}`).toBeGreaterThan(0)
        for (const token of key.match(/\{[a-zA-Z]+\}/g) ?? []) {
          expect(value, `${code} dropped ${token} from ${key}`).toContain(token)
        }
      }
    }
  })
})
