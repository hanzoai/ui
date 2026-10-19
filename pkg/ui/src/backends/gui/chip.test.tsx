// @vitest-environment jsdom

/**
 * Chip: 20/24px, a 4px gutter, square or round, grounds one rung apart, and a
 * pressable chip that is a real control lifting under the pointer. Read off the
 * server markup, where only a style that reached a rule shows as a class.
 */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { audit } from '../../../test/axe'
import { Chip } from './chip'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(<GuiProvider config={config} defaultTheme="dark">{node}</GuiProvider>)
const tag = (markup: string, slot = 'chip') => markup.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ''

describe('Chip markup', () => {
  it('sm is 20 tall with a 4px gutter and the 4px corner', () => {
    const el = tag(html(<Chip label="Acme" />))
    expect(el).toMatch(/_height-20px/)
    expect(el).toMatch(/_pl-c-space-1/)
    expect(el).toMatch(/_btlr-c-radius-xs/)
    expect(el).toMatch(/_bg-transparent/)
  })

  it('md is 24; round is the pill', () => {
    const el = tag(html(<Chip size="md" shape="round" label="x" />))
    expect(el).toMatch(/_height-24px/)
    expect(el).toMatch(/_btlr-c-radius-10/)
  })

  it.each([
    ['soft', '_bg-hover'],
    ['solid', '_bg-raised'],
  ] as const)('%s lifts its ground one rung', (variant, cls) => {
    expect(tag(html(<Chip variant={variant} label="x" />))).toContain(cls)
  })

  it('a pressable chip is a button, lifts under the pointer and meets the 44px floor', () => {
    const el = tag(html(<Chip label="x" onPress={() => {}} />))
    expect(el).toMatch(/role="button"/)
    expect(el).toMatch(/_bg-0hover-hover/)
    expect(el).toContain('data-touch-y="12"')
  })

  it('a static chip does not lift and is not a control', () => {
    const el = tag(html(<Chip label="x" />))
    expect(el).not.toMatch(/role="button"/)
    expect(el).not.toMatch(/0hover/)
  })

  it('with an address it is a link', () => {
    expect(tag(html(<Chip href="/r/1" label="x" />)).startsWith('<a')).toBe(true)
  })

  it('secondary and disabled read in quieter inks', () => {
    expect(html(<Chip color="secondary" label="x" />)).toMatch(/_col-aside/)
    const off = html(<Chip disabled onPress={() => {}} label="x" />)
    expect(off).toMatch(/_col-hush/)
    expect(tag(off)).toMatch(/aria-disabled="true"/)
  })

  it('the end element sits behind a hairline when asked', () => {
    const el = tag(html(<Chip label="x" endElement={<i />} endElementDivider />), 'chip-end')
    expect(el).toMatch(/_borderLeftWidth-1px/)
  })
})

describe('Chip behaviour', () => {
  let host: HTMLDivElement
  let root: Root
  beforeEach(() => {
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    host = document.createElement('div')
    document.body.appendChild(host)
    root = createRoot(host)
  })
  afterEach(() => {
    act(() => root.unmount())
    host.remove()
  })

  it('runs on Enter and Space, and passes axe', async () => {
    const run = vi.fn()
    act(() => root.render(<GuiProvider config={config} defaultTheme="dark"><Chip label="Acme" onPress={run} /></GuiProvider>))
    const el = host.querySelector('[data-slot="chip"]') as HTMLElement
    act(() => {
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
      el.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
    })
    expect(run).toHaveBeenCalledTimes(2)
    expect(await audit(host)).toEqual([])
  })
})
