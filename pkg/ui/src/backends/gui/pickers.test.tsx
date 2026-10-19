// @vitest-environment jsdom

/**
 * The record kit's pickers — CurrencyPicker, PhoneCountryPicker, CountrySelect
 * — and the searchable list they share, against a live DOM: a picker's whole
 * contract is opening, finding, picking and naming what it picked.
 */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { audit } from '../../../test/axe'
import { CountrySelect } from './country-select'
import { CurrencyPicker } from './currency-picker'
import { flag } from './flag'
import { Input } from './input'
import { InputGroup } from './input-group'
import { PhoneCountryPicker } from './phone-country-picker'

const wrap = (node: React.ReactNode) => (
  <GuiProvider config={config} defaultTheme="dark">
    {node}
  </GuiProvider>
)

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
]
const PHONES = [
  { value: 'US', label: 'United States', callingCode: '1' },
  { value: 'FR', label: 'France', callingCode: '33' },
  { value: 'DE', label: 'Germany', callingCode: '49' },
]
const COUNTRIES = [
  { value: 'FR', label: 'France' },
  { value: 'DE', label: 'Germany' },
]

describe('flag', () => {
  it('is the two regional-indicator letters of an ISO code', () => {
    expect(flag('fr')).toBe('\u{1F1EB}\u{1F1F7}')
    expect(flag('US')).toBe('\u{1F1FA}\u{1F1F8}')
  })
  it.each([null, '', 'USA', '1A', 'é1'])('%j has no flag', (iso) => expect(flag(iso)).toBeNull())
})

describe('the start segment, server-rendered', () => {
  const markup = renderToStaticMarkup(
    wrap(
      <InputGroup size="sm">
        <CurrencyPicker currencies={CURRENCIES} defaultValue="EUR" />
        <Input placeholder="Amount" />
      </InputGroup>,
    ),
  )
  const segment = markup.match(/<button[^>]*data-slot="currency-picker"[^>]*>/)?.[0] ?? ''

  it('is a real button inside the group', () => {
    expect(segment).toContain('type="button"')
    // The popover trigger states what it opens.
    expect(segment).toContain('aria-haspopup="dialog"')
    expect(segment).toContain('aria-label="Currency: Euro"')
  })

  it('takes the group’s inside height, flush with its start, a hairline on its end', () => {
    expect(segment).toMatch(/_height-30px/)
    expect(segment).toMatch(/_ml--8px/)
    expect(segment).toMatch(/_brw-1px/)
    expect(segment).toMatch(/_bg-0hover-hover/)
    expect(markup).toContain('>EUR<')
  })
})

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean
}

let host: HTMLDivElement
let root: Root
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})
afterEach(() => {
  act(() => root.unmount())
  host.remove()
})
const mount = (ui: React.ReactNode) => act(() => root.render(wrap(ui)))

const rows = () => [...document.querySelectorAll<HTMLElement>('[data-slot="command-item"]')]
const visible = () => rows().filter((el) => getComputedStyle(el).display !== 'none')
const search = (text: string) =>
  act(() => {
    const el = document.querySelector<HTMLInputElement>('[data-slot="command-input"]')!
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(el, text)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  })

describe('CurrencyPicker', () => {
  it('opens a list of every currency, labelled "Name (CODE)"', () => {
    mount(<CurrencyPicker currencies={CURRENCIES} />)
    const trigger = host.querySelector<HTMLElement>('[data-slot="currency-picker"]')!
    act(() => trigger.click())
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(rows().map((r) => r.textContent)).toEqual(['US Dollar (USD)$', 'Euro (EUR)€', 'Japanese Yen (JPY)¥'])
  })

  it('finds a currency by its symbol and by its code', () => {
    mount(<CurrencyPicker currencies={CURRENCIES} />)
    act(() => host.querySelector<HTMLElement>('[data-slot="currency-picker"]')!.click())
    search('¥')
    expect(visible().map((r) => r.textContent)).toEqual(['Japanese Yen (JPY)¥'])
    search('eur')
    expect(visible().map((r) => r.textContent)).toEqual(['Euro (EUR)€'])
  })

  it('a pick reports the code, shows it and closes', () => {
    const onValueChange = vi.fn()
    mount(<CurrencyPicker currencies={CURRENCIES} onValueChange={onValueChange} />)
    const trigger = host.querySelector<HTMLElement>('[data-slot="currency-picker"]')!
    act(() => trigger.click())
    act(() => rows().find((r) => r.textContent?.includes('JPY'))!.click())
    expect(onValueChange).toHaveBeenCalledWith('JPY')
    expect(trigger.textContent).toContain('JPY')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  it('a disabled picker does not open', () => {
    mount(<CurrencyPicker currencies={CURRENCIES} disabled />)
    const trigger = host.querySelector<HTMLButtonElement>('[data-slot="currency-picker"]')!
    expect(trigger.disabled).toBe(true)
    act(() => trigger.click())
    expect(rows()).toHaveLength(0)
  })

  it('selectedFirst puts the picked currency first', () => {
    mount(<CurrencyPicker currencies={CURRENCIES} value="JPY" selectedFirst />)
    act(() => host.querySelector<HTMLElement>('[data-slot="currency-picker"]')!.click())
    expect(rows()[0].textContent).toContain('JPY')
  })
})

describe('PhoneCountryPicker', () => {
  it('names the picked country in words, not by its flag', () => {
    mount(<PhoneCountryPicker countries={PHONES} defaultValue="FR" />)
    const trigger = host.querySelector<HTMLElement>('[data-slot="phone-country-picker"]')!
    expect(trigger.textContent).toContain('Country calling code: France +33')
    expect(trigger.hasAttribute('aria-label')).toBe(false)
  })

  it('finds a country by its calling code, with or without the plus, and by ISO code', () => {
    mount(<PhoneCountryPicker countries={PHONES} />)
    act(() => host.querySelector<HTMLElement>('[data-slot="phone-country-picker"]')!.click())
    // A row is its flag, its name and its calling code.
    search('+49')
    expect(visible().map((r) => r.textContent)).toEqual([`${flag('DE')}Germany+49`])
    search('33')
    expect(visible().map((r) => r.textContent)).toEqual([`${flag('FR')}France+33`])
    search('us')
    expect(visible()[0].textContent).toBe(`${flag('US')}United States+1`)
  })

  it('a pick reports the ISO code', () => {
    const onValueChange = vi.fn()
    mount(<PhoneCountryPicker countries={PHONES} onValueChange={onValueChange} />)
    act(() => host.querySelector<HTMLElement>('[data-slot="phone-country-picker"]')!.click())
    act(() => rows().find((r) => r.textContent?.includes('Germany'))!.click())
    expect(onValueChange).toHaveBeenCalledWith('DE')
  })
})

describe('CountrySelect', () => {
  it('puts "No country" first, and picking it reports null', () => {
    const onValueChange = vi.fn()
    mount(<CountrySelect countries={COUNTRIES} defaultValue="FR" onValueChange={onValueChange} aria-label="Country" />)
    const trigger = host.querySelector<HTMLElement>('[data-slot="country-select"]')!
    expect(trigger.textContent).toContain('France')
    act(() => trigger.click())
    expect(rows()[0].textContent).toBe('No country')
    act(() => rows()[0].click())
    expect(onValueChange).toHaveBeenCalledWith(null)
    expect(trigger.textContent).toContain('No country')
  })

  it('a visible label names the trigger', () => {
    mount(<CountrySelect countries={COUNTRIES} label="Country" />)
    const trigger = host.querySelector<HTMLElement>('[data-slot="country-select"]')!
    const id = trigger.getAttribute('aria-labelledby')!
    expect(document.getElementById(id)?.textContent).toBe('Country')
  })

  it('an empty list disables it', () => {
    mount(<CountrySelect countries={[]} aria-label="Country" />)
    expect(host.querySelector<HTMLButtonElement>('[data-slot="country-select"]')!.disabled).toBe(true)
  })

  it('takes the field box of its density: 32 at sm', () => {
    const markup = renderToStaticMarkup(wrap(<CountrySelect countries={COUNTRIES} size="sm" aria-label="Country" />))
    expect(markup.match(/<button[^>]*data-slot="country-select"[^>]*>/)?.[0]).toMatch(/_minH-32px/)
  })
})

describe('accessibility', () => {
  it('the three pickers, closed, pass axe', async () => {
    mount(
      <>
        <InputGroup>
          <CurrencyPicker currencies={CURRENCIES} defaultValue="USD" />
          <Input aria-label="Amount" />
        </InputGroup>
        <InputGroup>
          <PhoneCountryPicker countries={PHONES} defaultValue="US" />
          <Input aria-label="Phone number" />
        </InputGroup>
        <CountrySelect countries={COUNTRIES} label="Country" />
      </>,
    )
    expect(await audit(host)).toEqual([])
  })
})
