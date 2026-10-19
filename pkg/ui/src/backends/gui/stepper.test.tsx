// @vitest-environment jsdom

/**
 * The Stepper's typed value: read leniently, held to its bounds, rounded to its
 * step and its decimals, committed on blur — and still a live region and still
 * two buttons that stop at the bounds. The arithmetic is asserted as functions;
 * the commit against a mounted field, because that is where a value is typed.
 */
import { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { audit } from '../../../test/axe'
import { Density } from './density'
import { Stepper, formatCount, parseCount, settle } from './stepper'

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean
}

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )

describe('the count’s arithmetic', () => {
  it('formats Latin digits, grouping only from five digits up', () => {
    expect(formatCount(1234)).toBe('1234')
    expect(formatCount(12345)).toBe('12,345')
    expect(formatCount(2.5, 2)).toBe('2.5')
    expect(formatCount(2.555, 2)).toBe('2.56')
  })

  it('reads what was typed leniently, or says it is not a number', () => {
    expect(parseCount('12,345')).toBe(12345)
    expect(parseCount(' 7 ')).toBe(7)
    expect(parseCount('1,5')).toBe(1.5)
    expect(parseCount('1.234,5')).toBe(1234.5)
    expect(parseCount('1,234.5')).toBe(1234.5)
    expect(parseCount('-3.25')).toBe(-3.25)
    expect(parseCount('abc')).toBe(null)
    expect(parseCount('')).toBe(null)
  })

  it('holds to the bounds and rounds to the step from min, then the decimals', () => {
    const r = { min: 0, max: 100, step: 1, decimals: 0 }
    expect(settle(150, r)).toBe(100)
    expect(settle(-4, r)).toBe(0)
    expect(settle(7.4, r)).toBe(7)
    expect(settle(7.3, { ...r, step: 0.5, decimals: 1 })).toBe(7.5)
    expect(settle(3, { min: 1, max: 10, step: 2, decimals: 0 })).toBe(3)
  })
})

describe('Stepper', () => {
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
  const mount = (ui: React.ReactNode) =>
    act(() => {
      root.render(
        <GuiProvider config={config} defaultTheme="dark">
          {ui}
        </GuiProvider>,
      )
    })

  function Counted({ start = 2, ...rest }: { start?: number } & Partial<React.ComponentProps<typeof Stepper>>) {
    const [n, setN] = useState(start)
    return (
      <>
        <Stepper label="Decimals" value={n} onChange={setN} min={0} max={10} editable {...rest} />
        <output data-n>{n}</output>
      </>
    )
  }
  const field = () => host.querySelector<HTMLInputElement>('[data-slot="stepper-value"]')!
  const shown = () => host.querySelector('[data-n]')!.textContent
  const type = (text: string) =>
    act(() => {
      const el = field()
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
      set.call(el, text)
      el.dispatchEvent(new Event('input', { bubbles: true }))
    })
  const blur = () => act(() => field().dispatchEvent(new FocusEvent('focusout', { bubbles: true })))

  it('a regular stepper keeps its plain count; editable makes it a field', () => {
    expect(html(<Stepper label="Seats" value={2} onChange={() => {}} />)).not.toContain('data-slot="stepper-value"')
    expect(html(<Stepper label="Seats" value={2} onChange={() => {}} editable />)).toContain('data-slot="stepper-value"')
  })

  it('compact: a field by default, between 24px buttons, and still a live region', () => {
    const markup = html(
      <Density value="compact">
        <Stepper label="Decimals" value={2} onChange={() => {}} />
      </Density>,
    )
    expect(markup).toContain('data-slot="stepper-value"')
    expect(markup).toMatch(/data-size="icon-xs"[^>]*aria-label="Fewer decimals"/)
    expect(markup).toContain('aria-live="polite"')
  })

  it('commits a typed value on blur, held to the bounds', () => {
    mount(<Counted />)
    type('7')
    blur()
    expect(shown()).toBe('7')
    type('42')
    blur()
    expect(shown()).toBe('10')
    expect(field().value).toBe('10')
  })

  it('puts back the value when what was typed is not a number', () => {
    mount(<Counted />)
    type('lots')
    blur()
    expect(shown()).toBe('2')
    expect(field().value).toBe('2')
  })

  it('the buttons step by `step` and stop at the bounds', () => {
    mount(<Counted start={9} step={1} />)
    const more = host.querySelector<HTMLButtonElement>('[aria-label="More decimals"]')!
    act(() => more.click())
    expect(shown()).toBe('10')
    const stop = host.querySelector<HTMLButtonElement>('[aria-label="More decimals"]')!
    expect(stop.disabled || stop.getAttribute('aria-disabled') === 'true').toBe(true)
  })

  it('readOnly shows the value and changes nothing', () => {
    mount(<Counted readOnly />)
    expect(field().readOnly).toBe(true)
    const more = host.querySelector<HTMLButtonElement>('[aria-label="More decimals"]')!
    expect(more.getAttribute('aria-disabled')).toBe('true')
  })

  it('has no accessibility violations', async () => {
    mount(<Counted />)
    expect(await audit(host)).toEqual([])
  })
})
