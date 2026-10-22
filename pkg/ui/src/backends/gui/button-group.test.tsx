// @vitest-environment jsdom

/**
 * ButtonGroup and the Button axes it hands down, read off the server render:
 * gui compiles each style to an atomic class, so a class here IS the style a
 * browser receives (`_marginInlineStart--1px`, `_btlr-0px`, `_btc-red7`).
 */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { audit } from '../../../test/axe'
import { Button } from './button'
import { ButtonGroup } from './button-group'

const wrap = (node: React.ReactNode) => (
  <GuiProvider config={config} defaultTheme="dark">
    {node}
  </GuiProvider>
)
const html = (node: React.ReactNode) => renderToStaticMarkup(wrap(node))

/** Every opening tag carrying `data-slot="<slot>"`, in order. */
const tags = (markup: string, slot: string) =>
  [...markup.matchAll(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`, 'g'))].map((m) => m[0])

describe('ButtonGroup, attached', () => {
  const markup = html(
    <ButtonGroup aria-label="View">
      <Button>Update view</Button>
      <Button>Save as new</Button>
      <Button aria-label="More">⌄</Button>
    </ButtonGroup>,
  )
  const [first, middle, last] = tags(markup, 'button')

  it('is one control to assistive technology', () => {
    const group = tags(markup, 'button-group')[0]
    expect(group).toContain('role="group"')
    expect(group).toContain('aria-label="View"')
  })

  it('squares the corners between buttons and keeps the outer ones', () => {
    expect(first).toMatch(/_btrr-0px/)
    expect(first).toMatch(/_bbrr-0px/)
    expect(first).not.toMatch(/_btlr-0px/)
    expect(middle).toMatch(/_btlr-0px/)
    expect(middle).toMatch(/_btrr-0px/)
    expect(last).toMatch(/_btlr-0px/)
    expect(last).not.toMatch(/_btrr-0px/)
  })

  it('steps every button after the first back over its neighbour’s edge', () => {
    expect(first).not.toMatch(/_marginInlineStart--1px/)
    expect(middle).toMatch(/_marginInlineStart--1px/)
    expect(last).toMatch(/_marginInlineStart--1px/)
  })

  it('draws the focused button above its neighbours', () => {
    expect(middle).toMatch(/_z-0focus-1/)
  })
})

describe('ButtonGroup, unattached and framed', () => {
  it('stands the buttons 2px apart, corners intact', () => {
    const markup = html(
      <ButtonGroup attached={false}>
        <Button>a</Button>
        <Button>b</Button>
      </ButtonGroup>,
    )
    expect(tags(markup, 'button-group')[0]).toMatch(/_gap-c-space-0--5/)
    for (const b of tags(markup, 'button')) expect(b).not.toMatch(/_btlr-0px|_marginInlineStart--1px/)
  })

  it('a frame: $rim edge, 4px corner, 2px padding, panel ground; buttons cut to 1px', () => {
    const markup = html(
      <ButtonGroup framed attached={false} size="icon-2xs" variant="ghost">
        <Button aria-label="Zoom out">-</Button>
        <Button aria-label="Zoom in">+</Button>
      </ButtonGroup>,
    )
    const frame = tags(markup, 'button-group')[0]
    expect(frame).toMatch(/_btc-rim/)
    expect(frame).toMatch(/_btlr-c-radius-xs/)
    expect(frame).toMatch(/_pt-c-space-0--5/)
    expect(frame).toMatch(/_bg-panel/)
    for (const b of tags(markup, 'button')) {
      expect(b).toMatch(/_btlr-1px/)
      // Size and variant arrive through the group.
      expect(b).toContain('data-size="icon-2xs"')
      expect(b).toContain('data-variant="ghost"')
    }
  })

  it('a button that names its own size keeps it', () => {
    const markup = html(
      <ButtonGroup size="xs">
        <Button>a</Button>
        <Button size="sm">b</Button>
      </ButtonGroup>,
    )
    const [a, b] = tags(markup, 'button')
    expect(a).toContain('data-size="xs"')
    expect(b).toContain('data-size="sm"')
  })
})

describe('Button tone', () => {
  it.each([
    ['danger', /_col-bad/, /_btc-red7/],
    ['success', /_col-good/, /_btc-green7/],
  ] as const)('%s on an outline: the state ink and edge', (tone, ink, edge) => {
    const el = tags(html(<Button variant="outline" tone={tone}>Delete</Button>), 'button')[0]
    expect(el).toContain(`data-tone="${tone}"`)
    expect(el).toMatch(ink)
    expect(el).toMatch(edge)
  })

  it('accent is the monochrome accent, --primary, never a hue of its own', () => {
    const outline = tags(html(<Button tone="accent">Select</Button>), 'button')[0]
    expect(outline).toMatch(/_col-primary\b/)
    const solid = tags(html(<Button variant="primary" tone="accent">Create</Button>), 'button')[0]
    expect(solid).toMatch(/_bg-primary\b/)
  })

  it('danger on a ghost: the ink, and the error tint under the pointer', () => {
    const el = tags(html(<Button variant="ghost" tone="danger">Delete</Button>), 'button')[0]
    expect(el).toMatch(/_col-bad/)
    expect(el).toMatch(/_bg-0hover-state-error/)
  })

  it('neutral is the variant as it was', () => {
    const plain = tags(html(<Button variant="outline">x</Button>), 'button')[0]
    const neutral = tags(html(<Button variant="outline" tone="neutral">x</Button>), 'button')[0]
    expect(neutral).toBe(plain)
  })
})

describe('Button: loading, width, elevation, shape', () => {
  it('loadingPosition center keeps the label’s width and hides it', () => {
    const markup = html(
      <Button isLoading loadingPosition="center">
        Saving
      </Button>,
    )
    expect(markup).toContain('Saving')
    expect(markup).toMatch(/_o-0/)
    expect(markup).toMatch(/_pos-absolute/)
  })

  it('loadingPosition end puts the spinner after the label', () => {
    const markup = html(
      <Button isLoading loadingPosition="end">
        Saving
      </Button>,
    )
    expect(markup.indexOf('Saving')).toBeLessThan(markup.indexOf('data-slot="spinner"') === -1 ? markup.lastIndexOf('<svg') : markup.indexOf('data-slot="spinner"'))
  })

  it('fullWidth takes the row', () => {
    expect(tags(html(<Button fullWidth>Continue</Button>), 'button')[0]).toMatch(/_width-10037/)
  })

  it('elevated: the small shadow and, on an outline, the page ground with the stronger edge', () => {
    const el = tags(html(<Button elevated>Continue</Button>), 'button')[0]
    expect(el).toMatch(/class="[^"]*\belevation-1\b/)
    expect(el).toMatch(/_bg-surface-pag/)
    expect(el).toMatch(/_btc-rim/)
  })

  it('shape round makes an icon size a circle', () => {
    expect(tags(html(<Button size="icon-sm" shape="round" aria-label="Add">+</Button>), 'button')[0]).toMatch(/_btlr-c-radius-10/)
  })
})

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean
}

describe('Button in a live DOM', () => {
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

  it('focusableWhenDisabled: reachable, announced disabled, and refuses the press', () => {
    const onPress = vi.fn()
    mount(
      <Button disabled focusableWhenDisabled onPress={onPress}>
        Merge
      </Button>,
    )
    const el = host.querySelector<HTMLElement>('[data-slot="button"]')!
    expect(el.getAttribute('aria-disabled')).toBe('true')
    expect(el.hasAttribute('disabled')).toBe(false)
    el.focus()
    expect(document.activeElement).toBe(el)
    act(() => el.click())
    expect(onPress).not.toHaveBeenCalled()
  })

  it('a string tooltip names an icon-only button, which is its own trigger', async () => {
    mount(
      <Button size="icon-sm" variant="ghost" tooltip="Close side panel">
        ×
      </Button>,
    )
    const el = host.querySelector('[data-slot="button"]')!
    expect(el.getAttribute('aria-label')).toBe('Close side panel')
    // No wrapper: the button is the trigger, so nothing but a button carries
    // the trigger's aria state, and axe passes.
    expect(el.parentElement?.getAttribute('data-slot')).not.toBe('button-tooltip')
    expect(await audit(host)).toEqual([])
  })

  it('a disabled button with a tooltip stays reachable, so the tooltip can say why', () => {
    const onPress = vi.fn()
    mount(
      <Button size="icon-sm" variant="ghost" tooltip="Nothing to undo" disabled onPress={onPress}>
        ↶
      </Button>,
    )
    const el = host.querySelector<HTMLElement>('[data-slot="button"]')!
    expect(el.getAttribute('aria-disabled')).toBe('true')
    expect(el.hasAttribute('disabled')).toBe(false)
    act(() => el.click())
    expect(onPress).not.toHaveBeenCalled()
  })

  it('a group of buttons passes axe', async () => {
    mount(
      <ButtonGroup aria-label="Zoom" framed>
        <Button aria-label="Zoom out">-</Button>
        <Button aria-label="Zoom in">+</Button>
      </ButtonGroup>,
    )
    expect(await audit(host)).toEqual([])
  })
})
