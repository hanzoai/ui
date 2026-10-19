// @vitest-environment jsdom

/**
 * Every field type's editor against a live DOM: what it emits for a keystroke, a
 * pick or a press, the inline-edit keys (Enter commits, Escape cancels), and axe
 * on the interactive ones.
 */
import { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GuiProvider } from '@hanzo/gui'
import { config } from '@hanzo/ui'

import { audit } from '../../../ui/test/axe'
import { FieldInput } from './FieldInput'
import type { FieldDefinition, FieldType } from './types'

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

const settle = async (ms = 80) => {
  await act(async () => {
    await new Promise((r) => setTimeout(r, ms))
  })
}

/** An editor held by a host that keeps the draft, as the table and the record views do. */
function Host({ type, value: initial, metadata, onChange, onSubmit, onCancel, autoFocus }: {
  type: FieldType
  value?: unknown
  metadata?: object
  onChange?: (v: unknown) => void
  onSubmit?: () => void
  onCancel?: () => void
  autoFocus?: boolean
}) {
  const [value, setValue] = useState<unknown>(initial)
  return (
    <FieldInput
      field={{ name: 'f', label: 'Field', type, metadata } as FieldDefinition}
      value={value}
      autoFocus={autoFocus}
      onChange={(v) => {
        setValue(v)
        onChange?.(v)
      }}
      onSubmit={onSubmit}
      onCancel={onCancel}
    />
  )
}

const mount = (props: Parameters<typeof Host>[0]) =>
  act(() => {
    root.render(
      <GuiProvider config={config} defaultTheme="dark">
        <Host {...props} />
      </GuiProvider>,
    )
  })

const inputs = () => [...host.querySelectorAll<HTMLInputElement>('input, textarea')]

/** Type `text` the way React hears it: the native setter, then an input event. */
const type = (el: HTMLInputElement | HTMLTextAreaElement, text: string) =>
  act(() => {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(el, text)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  })

const key = (el: Element, k: string, mods: KeyboardEventInit = {}) =>
  act(() => {
    el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...mods }))
  })

const rows = () => [
  ...document.querySelectorAll<HTMLElement>(
    '[data-slot="dropdown-menu-content"] [role="menuitem"], [data-slot="dropdown-menu-content"] [role="menuitemradio"], [data-slot="dropdown-menu-content"] [role="menuitemcheckbox"]',
  ),
]

describe('text editors and the inline-edit keys', () => {
  it('text emits what is typed; Enter commits, Escape cancels', () => {
    const onChange = vi.fn()
    const onSubmit = vi.fn()
    const onCancel = vi.fn()
    mount({ type: 'text', value: 'Acme', onChange, onSubmit, onCancel })
    const [field] = inputs()
    expect(field.value).toBe('Acme')
    type(field, 'Acme Inc')
    expect(onChange).toHaveBeenLastCalledWith('Acme Inc')
    key(field, 'Enter')
    expect(onSubmit).toHaveBeenCalledTimes(1)
    key(field, 'Escape')
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('Enter during an IME composition is the composition’s, not a commit', () => {
    const onSubmit = vi.fn()
    mount({ type: 'text', value: '', onSubmit })
    const [field] = inputs()
    act(() => {
      const e = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
      Object.defineProperty(e, 'isComposing', { value: true })
      field.dispatchEvent(e)
    })
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('long text keeps Shift+Enter for a new line and commits on Enter', () => {
    const onSubmit = vi.fn()
    mount({ type: 'longText', value: 'a', onSubmit })
    const [area] = inputs()
    expect(area.tagName).toBe('TEXTAREA')
    key(area, 'Enter', { shiftKey: true })
    expect(onSubmit).not.toHaveBeenCalled()
    key(area, 'Enter')
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('an email that is not one is marked invalid, and still emitted', () => {
    const onChange = vi.fn()
    mount({ type: 'email', value: '', onChange })
    const [field] = inputs()
    type(field, 'ada@')
    expect(onChange).toHaveBeenLastCalledWith('ada@')
    expect(inputs()[0].getAttribute('aria-invalid')).toBe('true')
    type(inputs()[0], 'ada@example.com')
    expect(inputs()[0].getAttribute('aria-invalid')).toBeNull()
  })
})

describe('numbers', () => {
  it('a number is parsed as typed and emitted as a number', () => {
    const onChange = vi.fn()
    mount({ type: 'number', value: null, onChange })
    type(inputs()[0], '1,250')
    expect(onChange).toHaveBeenLastCalledWith(1250)
  })

  it('a currency is its picker and its amount, emitted together', () => {
    const onChange = vi.fn()
    mount({ type: 'currency', value: { amount: 10, currencyCode: 'EUR' }, onChange })
    expect(host.querySelector('[data-slot="input-group"]')).not.toBeNull()
    expect(host.querySelector('[data-slot="currency-picker"]')?.textContent).toContain('EUR')
    type(inputs()[0], '42.5')
    expect(onChange).toHaveBeenLastCalledWith({ amount: 42.5, currencyCode: 'EUR' })
  })
})

describe('phone', () => {
  it('a string stays a string: the calling code and the number', () => {
    const onChange = vi.fn()
    mount({ type: 'phone', value: '+33 6 12 34 56 78', onChange })
    const field = inputs()[0]
    expect(field.value).toBe('6 12 34 56 78')
    type(field, '6 00 00 00 00')
    expect(onChange).toHaveBeenLastCalledWith('+33 6 00 00 00 00')
  })

  it('an object value comes back in its own shape', () => {
    const onChange = vi.fn()
    mount({ type: 'phone', value: { number: '4155550100', countryCode: 'US' }, onChange })
    type(inputs()[0], '4155550199')
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ number: '4155550199', countryCode: 'US', callingCode: '+1' }))
  })
})

describe('boolean and rating', () => {
  it('the switch toggles at once', () => {
    const onChange = vi.fn()
    mount({ type: 'boolean', value: false, onChange })
    act(() => host.querySelector<HTMLElement>('[data-slot="switch"]')!.click())
    expect(onChange).toHaveBeenLastCalledWith(true)
  })

  it('the stars are a slider: a press sets, the same press clears, the arrows step', () => {
    const onChange = vi.fn()
    mount({ type: 'rating', value: 2, onChange })
    const slider = host.querySelector<HTMLElement>('[role="slider"]')!
    expect(slider.getAttribute('aria-valuenow')).toBe('2')
    act(() => host.querySelector<HTMLElement>('[data-star="4"]')!.click())
    expect(onChange).toHaveBeenLastCalledWith(4)
    act(() => host.querySelector<HTMLElement>('[data-star="4"]')!.click())
    expect(onChange).toHaveBeenLastCalledWith(0)
    key(slider, 'ArrowRight')
    expect(onChange).toHaveBeenLastCalledWith(1)
    key(slider, 'End')
    expect(onChange).toHaveBeenLastCalledWith(5)
  })
})

describe('pickers', () => {
  const options = [
    { value: 'lead', label: 'Lead', color: 'sky' },
    { value: 'won', label: 'Won', color: 'green' },
    { value: 'lost', label: 'Lost', color: 'red' },
  ]

  it('a select opens in place, lists its options as tags, and emits the pick', async () => {
    const onChange = vi.fn()
    mount({ type: 'select', value: 'lead', metadata: { options }, onChange, autoFocus: true })
    await settle(150)
    const picks = rows().filter((r) => r.getAttribute('role') === 'menuitemradio')
    expect(picks).toHaveLength(3)
    expect(picks[0].getAttribute('aria-checked')).toBe('true')
    act(() => picks[1].click())
    await settle()
    expect(onChange).toHaveBeenLastCalledWith('won')
  })

  it('a set select offers its "No …" row, which clears', async () => {
    const onChange = vi.fn()
    mount({ type: 'select', value: 'lead', metadata: { options }, onChange, autoFocus: true })
    await settle(150)
    const clear = rows().find((r) => r.textContent?.includes('No Field'))!
    act(() => clear.click())
    await settle()
    expect(onChange).toHaveBeenLastCalledWith(null)
  })

  it('a multi-select toggles a set and stays open', async () => {
    const onChange = vi.fn()
    mount({ type: 'multiSelect', value: ['lead'], metadata: { options }, onChange, autoFocus: true })
    await settle(150)
    const boxes = rows().filter((r) => r.getAttribute('role') === 'menuitemcheckbox')
    expect(boxes).toHaveLength(3)
    act(() => boxes[2].click())
    await settle()
    expect(onChange).toHaveBeenLastCalledWith(['lead', 'lost'])
    expect(rows().length).toBeGreaterThan(0)
  })

  it('the open picker passes axe', async () => {
    mount({ type: 'select', value: 'lead', metadata: { options }, autoFocus: true })
    await settle(150)
    expect(await audit(document.body)).toEqual([])
  })

  it('a relation with no candidates is an id field', () => {
    mount({ type: 'relation', value: { id: 'c1', name: 'Acme' } })
    expect(inputs()[0].value).toBe('Acme')
  })

  it('a relation with candidates picks one, faces drawn as avatars', async () => {
    const onChange = vi.fn()
    mount({ type: 'relation', value: null, metadata: { options: [{ value: 'c1', label: 'Acme' }, { value: 'c2', label: 'Globex' }] }, onChange, autoFocus: true })
    await settle(150)
    expect(document.querySelectorAll('[data-slot="dropdown-menu-content"] [data-slot="avatar"]').length).toBe(2)
    act(() => rows().find((r) => r.textContent?.includes('Globex'))!.click())
    await settle()
    expect(onChange).toHaveBeenLastCalledWith('c2')
  })
})

describe('composites', () => {
  it('a full name pasted into the first field splits across both', () => {
    const onChange = vi.fn()
    mount({ type: 'fullName', value: null, onChange })
    type(inputs()[0], 'Ada Lovelace')
    expect(onChange).toHaveBeenLastCalledWith({ first: 'Ada', last: 'Lovelace' })
  })

  it('an address emits its parts as an object, and the empty form as null', () => {
    const onChange = vi.fn()
    mount({ type: 'address', value: { city: 'Paris' }, onChange })
    const city = inputs().find((i) => i.getAttribute('aria-label') === 'City')!
    type(city, '')
    expect(onChange).toHaveBeenLastCalledWith(null)
    const street = inputs().find((i) => i.getAttribute('aria-label') === 'Address 1')!
    type(street, '1 Main St')
    expect(onChange).toHaveBeenLastCalledWith({ street1: '1 Main St' })
  })

  it('links: Enter adds the typed URL, the cross removes one', () => {
    const onChange = vi.fn()
    mount({ type: 'links', value: [{ url: 'https://a.io' }], onChange })
    const add = inputs()[0]
    type(add, 'b.io')
    key(add, 'Enter')
    expect(onChange).toHaveBeenLastCalledWith([{ url: 'https://a.io' }, { url: 'b.io' }])
    act(() => host.querySelector<HTMLElement>('[aria-label="Remove a.io"]')!.click())
    expect(onChange).toHaveBeenLastCalledWith([{ url: 'b.io' }])
  })
})

describe('dates', () => {
  it('a typed day is emitted as that day, never an instant', async () => {
    const onChange = vi.fn()
    mount({ type: 'date', value: '2026-10-19', onChange, autoFocus: true })
    await settle(150)
    const typed = document.querySelector<HTMLInputElement>('input[aria-label="Field, as YYYY-MM-DD"]')!
    expect(typed.value).toBe('2026-10-19')
    type(typed, '2026-12-01')
    expect(onChange).toHaveBeenLastCalledWith('2026-12-01')
  })

  it('a date-time adds the time and emits an ISO instant', async () => {
    const onChange = vi.fn()
    mount({ type: 'dateTime', value: null, onChange, autoFocus: true })
    await settle(150)
    type(document.querySelector<HTMLInputElement>('input[aria-label="Field, as YYYY-MM-DD"]')!, '2026-12-01')
    const last = onChange.mock.calls.at(-1)?.[0] as string
    expect(new Date(last).toString()).not.toBe('Invalid Date')
    expect(last).toMatch(/Z$/)
  })
})
