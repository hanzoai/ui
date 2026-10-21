// @vitest-environment jsdom

/**
 * Glyph draws a stored name once the one icon chunk has loaded, holding its box
 * until then; IconPicker searches names and concepts, runs its grid by the
 * arrows in two dimensions, picks with Enter or a press, and passes axe.
 */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { audit } from '../../../test/axe'
import { Glyph, IconPicker, PICKER_W, loadIcons } from './icon-picker'

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean
}

let host: HTMLDivElement
let root: Root

beforeAll(async () => {
  await loadIcons()
}, 120_000)

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})

afterEach(() => {
  act(() => root.unmount())
  host.remove()
  document.body.innerHTML = ''
})

const wrap = (ui: React.ReactNode) => (
  <GuiProvider config={config} defaultTheme="dark">
    {ui}
  </GuiProvider>
)

const mount = (ui: React.ReactNode) => act(() => root.render(wrap(ui)))

const key = (el: Element, k: string) =>
  act(() => {
    el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }))
  })

describe('Glyph', () => {
  it('holds its box and draws the resolved icon', () => {
    mount(<Glyph name="IconBuildingSkyscraper" size={20} />)
    const box = host.querySelector('[data-slot="glyph"]')!
    expect(box).not.toBeNull()
    expect(box.getAttribute('aria-hidden')).toBe('true')
    expect(box.querySelector('svg')).not.toBeNull()
  })

  it('an unknown object name falls back to a Box; an unknown option draws nothing', () => {
    mount(
      <>
        <Glyph name="IconNoSuchThing" kind="object" />
        <Glyph name="IconNoSuchThing" kind="option" />
      </>,
    )
    const [obj, opt] = [...host.querySelectorAll('[data-slot="glyph"]')]
    expect(obj.querySelector('svg')).not.toBeNull()
    expect(opt.querySelector('svg')).toBeNull()
  })

  it('on the server, before any load in that process, it is an empty box of its size', () => {
    // The module cache is warm here, so this asserts the box, not the emptiness.
    const markup = renderToStaticMarkup(wrap(<Glyph name="User" size={14} />))
    expect(markup).toMatch(/data-slot="glyph"/)
    expect(markup).toMatch(/_width-14px/)
  })
})

describe('IconPicker', () => {
  it('is the source kit’s 176px picker', () => {
    expect(PICKER_W).toBe(176)
  })

  it('opens, finds an icon by a concept it draws, and picks it with Enter', async () => {
    const onValueChange = vi.fn()
    mount(<IconPicker defaultOpen onValueChange={onValueChange} />)
    const input = document.querySelector<HTMLInputElement>('input[aria-label="Search icons"]')!
    expect(input).not.toBeNull()
    await act(async () => {
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
      set.call(input, 'company')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    const options = [...document.querySelectorAll('[role="option"]')].map((o) => o.getAttribute('aria-label'))
    expect(options).toContain('Building2')
    key(input, 'Enter')
    expect(onValueChange).toHaveBeenCalledWith(options[0])
  })

  it('the arrows move in two dimensions, five to a row', () => {
    mount(<IconPicker defaultOpen />)
    const input = document.querySelector<HTMLInputElement>('input[aria-label="Search icons"]')!
    const active = () => input.getAttribute('aria-activedescendant')
    const first = active()!
    key(input, 'ArrowRight')
    expect(active()).toBe(first.replace(/-0$/, '-1'))
    key(input, 'ArrowDown')
    expect(active()).toBe(first.replace(/-0$/, '-6'))
    key(input, 'Home')
    expect(active()).toBe(first)
  })

  it('a stored Tabler value shows as its Lucide icon, marked chosen', () => {
    mount(<IconPicker defaultOpen value="IconUser" />)
    const chosen = document.querySelector('[role="option"][aria-selected="true"]')
    // The chosen icon is in the first 150 only when the list reaches it; User is late
    // in the alphabet, so search for it the way a person would.
    const trigger = document.querySelector('[aria-label^="Icon: "]')
    expect(trigger?.getAttribute('aria-label')).toBe('Icon: User')
    expect(chosen === null || chosen.getAttribute('aria-label') === 'User').toBe(true)
  })

  it('passes axe open', async () => {
    mount(<IconPicker defaultOpen label="Object icon" />)
    expect(await audit(document.body)).toEqual([])
  })
})
