// The lists the address, phone and currency editors pick from, built from the
// platform rather than shipped: names come from Intl.DisplayNames in the
// reader's language, currencies from Intl.supportedValuesOf, calling codes from
// the E.164 table (calling.ts). Pure, memoised per locale.
import { CALLING } from './calling'

export interface Region {
  /** ISO 3166-1 alpha-2. */
  value: string
  label: string
  callingCode: string
}

export interface Currency {
  code: string
  name: string
  symbol?: string
}

const memo = <T,>(build: (locale: string | undefined) => T) => {
  const cache = new Map<string, T>()
  return (locale?: string): T => {
    const key = locale ?? ''
    let hit = cache.get(key)
    if (hit === undefined) cache.set(key, (hit = build(locale)))
    return hit
  }
}

const names = (locale: string | undefined, type: 'region' | 'currency') => {
  try {
    return new Intl.DisplayNames(locale ? [locale] : undefined, { type })
  } catch {
    return null
  }
}

/** Every region a phone number can belong to, named in `locale`, sorted by name. AC and TA keep their codes as names where Intl has none. */
export const regions = memo((locale): Region[] => {
  const dn = names(locale, 'region')
  const collator = new Intl.Collator(locale)
  return Object.entries(CALLING)
    .map(([value, callingCode]) => {
      let label = value
      try {
        label = dn?.of(value) ?? value
      } catch {
        label = value
      }
      return { value, label, callingCode }
    })
    .sort((a, b) => collator.compare(a.label, b.label))
})

/** The currency's symbol in `locale` ("$", "€"), or undefined where it is only its code. */
const symbolOf = (code: string, locale: string | undefined): string | undefined => {
  try {
    const part = new Intl.NumberFormat(locale, { style: 'currency', currency: code, currencyDisplay: 'narrowSymbol' })
      .formatToParts(0)
      .find((p) => p.type === 'currency')?.value
    return part && part !== code ? part : undefined
  } catch {
    return undefined
  }
}

/** The currencies the platform knows (ISO 4217), named in `locale`. A platform without the list answers the common few. */
export const currencies = memo((locale): Currency[] => {
  const supported = (Intl as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf
  const codes = supported ? supported('currency') : ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'CAD', 'AUD', 'CHF', 'INR', 'BRL']
  const dn = names(locale, 'currency')
  return codes.map((code) => {
    let name = code
    try {
      name = dn?.of(code) ?? code
    } catch {
      name = code
    }
    return { code, name, symbol: symbolOf(code, locale) }
  })
})
