// @vitest-environment jsdom

/**
 * The HoverCard's props have to ARRIVE. gui drops what it does not recognise, and
 * this component's whole job is moving three of them somewhere else — `side` and
 * `align` off Content onto the root's `placement`, `sideOffset` onto its `offset`
 * — so "it rendered" is exactly the evidence that proves nothing. Every claim
 * below is read back off the live DOM.
 *
 * WHAT THIS SUITE CANNOT DRIVE: the hover itself. gui opens a hoverable popper
 * from `PopperAnchor`'s `onMouseEnter` + floating-ui's `useHover`, and neither
 * fires under jsdom — verified against gui's OWN `Tooltip` and a raw
 * `Popover hoverable`, which stay shut on `mouseOver` here while a press opens
 * the popover fine. So the hover timing (`openDelay`/`closeDelay`) belongs to a
 * browser test, and the panel is opened here through the `open`/`defaultOpen`
 * props — which are the Radix API too, not a test-only door.
 */
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { HoverCard, HoverCardContent, HoverCardTrigger } from './hover-card'

// floating-ui's autoUpdate observes the reference element; jsdom has neither
// observer. Local to this suite — vitest.setup.ts is shared and only owes the
// module-scope matchMedia read.
beforeAll(() => {
  const Noop = class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
  }
  globalThis.ResizeObserver ??= Noop as never
  globalThis.IntersectionObserver ??= Noop as never
})

afterEach(cleanup)

const mount = (node: React.ReactNode) =>
  render(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )

/** Let the popper's effects (portal, position) flush. */
const settle = () => act(async () => void (await new Promise((r) => setTimeout(r, 0))))

const card = () => document.querySelector('[data-slot="hover-card-content"]')
/** gui compiles a style prop to an atomic class; this is how one is read back. */
const cls = (el: Element, prop: string) =>
  [...el.classList].find((c) => c.startsWith(`_${prop}-`)) ?? ''

describe('HoverCard', () => {
  it('mounts a labelled dialog panel the trigger points at', async () => {
    const { getByTestId } = mount(
      <HoverCard open>
        <HoverCardTrigger data-testid="t">@zeekay</HoverCardTrigger>
        <HoverCardContent>joined 2019</HoverCardContent>
      </HoverCard>,
    )
    await settle()

    const panel = card()!
    expect(panel).not.toBeNull()
    // Radix's hover card announces nothing at all; riding gui's popper the
    // trigger says a dialog exists and names it, which is the one deliberate
    // deviation this component makes and the reason it is worth asserting.
    const trigger = getByTestId('t')
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog')
    const floating = panel.parentElement!
    expect(floating.getAttribute('role')).toBe('dialog')
    expect(trigger.getAttribute('aria-controls')).toBe(floating.id)
    expect(trigger.hasAttribute('aria-expanded')).toBe(true)
  })

  // Rename 2, the one the migration notes call out: Radix puts side/align on
  // Content, gui takes one `placement` on the ROOT, and @hanzo/ui's own Popover
  // accepts `align` and throws it away. Read the resolved placement back.
  it('hoists side + align off Content onto the root placement', async () => {
    for (const [side, align, placement] of [
      [undefined, undefined, 'bottom'],
      ['left', 'start', 'left-start'],
      ['top', undefined, 'top'],
      ['right', 'end', 'right-end'],
    ] as const) {
      const { unmount } = mount(
        <HoverCard open>
          <HoverCardTrigger>@zeekay</HoverCardTrigger>
          <HoverCardContent align={align} side={side}>
            joined 2019
          </HoverCardContent>
        </HoverCard>,
      )
      await settle()
      expect(card()?.getAttribute('data-placement'), `${side}/${align}`).toBe(placement)
      unmount()
    }
  })

  // Same rename, other half: `sideOffset` has to reach the popper root's
  // `offset`. It is not an attribute, but the popper publishes the space it left
  // as a custom property, so a changed offset is visible.
  it('hoists sideOffset onto the root offset', async () => {
    const room = async (sideOffset: number) => {
      const { unmount } = mount(
        <HoverCard open>
          <HoverCardTrigger>@zeekay</HoverCardTrigger>
          <HoverCardContent sideOffset={sideOffset}>joined 2019</HoverCardContent>
        </HoverCard>,
      )
      await settle()
      const style = card()!.parentElement!.getAttribute('style') ?? ''
      unmount()
      return style.match(/--hanzogui-popper-available-height:\s*(-?\d+)px/)?.[1]
    }

    expect(await room(0)).toBe('0')
    expect(await room(40)).toBe('-40')
  })

  // gui compiles style props to atomic classes and silently ignores what it does
  // not know. The panel's surface is four of them, and the width is the one that
  // OUTRANKS a Tailwind `w-[300px]` on a migrated call site, because gui injects
  // its sheet after the bundled CSS — so it is asserted, not assumed.
  it('compiles its surface onto the panel and still merges a caller className', async () => {
    mount(
      <HoverCard open>
        <HoverCardTrigger>@zeekay</HoverCardTrigger>
        <HoverCardContent className="text-xs">joined 2019</HoverCardContent>
      </HoverCard>,
    )
    await settle()

    const panel = card()!
    expect(cls(panel, 'width')).toBe('_width-256px')
    expect(cls(panel, 'bg')).toBe('_bg-color2')
    expect(cls(panel, 'btw')).toBe('_btw-1px')
    expect(cls(panel, 'btc')).toBe('_btc-borderColor')
    expect([...panel.classList]).toContain('text-xs')
  })

  // Every desktop call site passes a bare string. A string child of a gui View
  // renders nothing on native unless a Text host wraps it; `ink()` is the one
  // place this backend does that.
  it('renders a bare string child through a text host', async () => {
    mount(
      <HoverCard open>
        <HoverCardTrigger>@zeekay</HoverCardTrigger>
        <HoverCardContent>joined 2019</HoverCardContent>
      </HoverCard>,
    )
    await settle()

    const panel = card()!
    expect(panel.textContent).toBe('joined 2019')
    expect(panel.querySelector('[data-slot="sizable-text"]')?.textContent).toBe('joined 2019')
  })

  it('closes on Escape and says so through onOpenChange', async () => {
    const onOpenChange = vi.fn()
    mount(
      <HoverCard defaultOpen onOpenChange={onOpenChange}>
        <HoverCardTrigger>@zeekay</HoverCardTrigger>
        <HoverCardContent>joined 2019</HoverCardContent>
      </HoverCard>,
    )
    await settle()
    expect(card()).not.toBeNull()

    act(() => void fireEvent.keyDown(document, { key: 'Escape' }))
    await settle()

    expect(card()).toBeNull()
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything())
  })

  // Radix's hover card never toggled on click — its trigger is usually a link
  // whose click must navigate. gui's Popover trigger toggles on press unless it
  // is told not to, so this is a prop that has to have arrived.
  it('does not open on press', async () => {
    const { getByTestId } = mount(
      <HoverCard>
        <HoverCardTrigger data-testid="t">@zeekay</HoverCardTrigger>
        <HoverCardContent>joined 2019</HoverCardContent>
      </HoverCard>,
    )

    act(() => void fireEvent.click(getByTestId('t')))
    await settle()
    expect(card()).toBeNull()
  })
})
