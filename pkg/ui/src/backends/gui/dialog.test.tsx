// @vitest-environment jsdom

/**
 * `DialogContent` owns the overlay, and owning it is not the same as hiding it.
 *
 * Content mounts its own portal and overlay so that a caller can mount Content
 * alone — that is the point, and it stays. But the overlay took no props from
 * anywhere, so the dim, the stacking order and the click target were unreachable
 * from outside the package: a consumer stacking one dialog over another had no
 * way to say which one dims which. Downstream that is not a preference, it is
 * three files that cannot leave Radix, because Radix's Dialog lets them render
 * the overlay themselves.
 *
 * Asserted on a LIVE tree for the reason alert-dialog gives: the panel mounts
 * into gui's portal host, and @hanzo/gui drops an unrecognised prop with no
 * throw and no type error — so a pass-through that silently went nowhere would
 * look exactly like a pass-through that worked.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './dialog'

let root: Root | null = null
let host: HTMLDivElement | null = null

const mount = (ui: React.ReactNode) => {
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
  act(() => {
    root!.render(
      <GuiProvider config={config} defaultTheme="dark">
        {ui}
      </GuiProvider>,
    )
  })
}

afterEach(() => {
  act(() => root?.unmount())
  host?.remove()
  root = null
  host = null
})

const overlay = () => document.querySelector('[data-slot="dialog-overlay"]') as HTMLElement | null

describe('DialogContent’s overlay', () => {
  it('renders by default, so a caller that says nothing is unaffected', () => {
    mount(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Untouched</DialogTitle>
        </DialogContent>
      </Dialog>,
    )
    expect(overlay()).not.toBeNull()
  })

  it('takes the caller’s props — the whole point, and the thing that silently did not happen', () => {
    mount(
      <Dialog open>
        <DialogContent overlay={{ 'data-probe': 'reached', zIndex: 1234 }}>
          <DialogTitle>Stacked</DialogTitle>
        </DialogContent>
      </Dialog>,
    )
    const el = overlay()
    expect(el).not.toBeNull()
    // The attribute proves the object ARRIVED; the z-index proves it was
    // APPLIED rather than swallowed, which is the failure gui makes silent.
    expect(el!.getAttribute('data-probe')).toBe('reached')
    // COMPUTED, never `el.style`. gui compiles a style prop to one atomic class
    // (here `_z-1234`) and writes no inline style at all, so `el.style.zIndex`
    // is `''` on an overlay that is correctly stacked — a reading that fails
    // against working code. Written that way first, and the test caught it.
    expect(getComputedStyle(el!).zIndex).toBe('1234')
  })

  it('still marks itself, so the caller replaces values and not the identity', () => {
    // A caller passing props must not cost the overlay its `data-slot`, which is
    // how every other rule in the sheet — and this test — finds it.
    mount(
      <Dialog open>
        <DialogContent overlay={{ zIndex: 7 }}>
          <DialogTitle>Marked</DialogTitle>
        </DialogContent>
      </Dialog>,
    )
    expect(overlay()).not.toBeNull()
  })
})

const close = () => document.querySelector('[data-slot="dialog-close"][aria-label="Close"]') as HTMLElement | null

describe('DialogContent’s close button', () => {
  it('is pinned to the top end corner, not dropped into the flow', () => {
    mount(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Pinned</DialogTitle>
        </DialogContent>
      </Dialog>,
    )
    const el = close()
    expect(el).not.toBeNull()
    // `touch()` writes `position: relative` on web to host its hit-area overlay.
    // Spread AFTER the pin it won, and the ✕ drew in flow at the content's
    // bottom-left — on every dialog, and half off the screen in a left Sheet.
    // COMPUTED, for the same reason as the overlay's z-index above.
    const style = getComputedStyle(el!)
    expect(style.position).toBe('absolute')
    expect(style.top).toBe('16px')
    // The end corner: the right under LTR, the left under RTL. jsdom resolves
    // no logical property, so the class is read for the side.
    expect(el!.className).toMatch(/_insetInlineEnd-16px/)
    expect(el!.className).not.toMatch(/_(l|r|left|right)-/)
    expect(style.bottom).toBe('auto')
  })

  it('keeps its 44px hit area after the reorder', () => {
    mount(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Reachable</DialogTitle>
        </DialogContent>
      </Dialog>,
    )
    // 16px glyph, 14px each side: the same pad `touch(16)` wrote before.
    expect(close()!.getAttribute('data-touch-x')).toBe('14')
    expect(close()!.getAttribute('data-touch-y')).toBe('14')
  })

  it('is absent when the caller says so', () => {
    mount(
      <Dialog open>
        <DialogContent showCloseButton={false}>
          <DialogTitle>Bare</DialogTitle>
        </DialogContent>
      </Dialog>,
    )
    expect(close()).toBeNull()
  })
})

describe('DialogContent size', () => {
  const sized = (size?: 'sm' | 'md' | 'fullscreen') =>
    mount(
      <Dialog open>
        <DialogContent size={size}>
          <DialogHeader>
            <DialogTitle>Delete field</DialogTitle>
            <DialogDescription>This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogBody>Body</DialogBody>
          <DialogFooter>Actions</DialogFooter>
        </DialogContent>
      </Dialog>,
    )
  const content = () => document.querySelector('[data-slot="dialog-content"]') as HTMLElement

  it('a sized dialog is the record frame: its width, an 8px corner, no edge, no inset, the 72% scrim', () => {
    sized('md')
    expect(content().getAttribute('data-size')).toBe('md')
    expect(content().className).toMatch(/_width-400px/)
    expect(content().className).toMatch(/_btlr-c-radius-3/)
    expect(content().className).toMatch(/_btw-0px/)
    expect(content().className).toMatch(/_pt-0px/)
    expect(overlay()!.className).toMatch(/_o-1/)
  })

  it('its sections take the source kit’s insets and centre the title', () => {
    sized('sm')
    const header = document.querySelector('[data-slot="dialog-header"]')!.className
    expect(header).toMatch(/_pt-24px/)
    expect(document.querySelector('[data-slot="dialog-body"]')!.className).toMatch(/_pb-24px/)
    expect(document.querySelector('[data-slot="dialog-title"]')!.className).toMatch(/_text-center/)
    expect(content().className).toMatch(/_width-300px/)
  })

  it('no size is the 512-wide panel every surface has', () => {
    sized()
    expect(content().hasAttribute('data-size')).toBe(false)
    expect(content().className).toMatch(/_maxW-512px/)
    expect(document.querySelector('[data-slot="dialog-header"]')!.className).not.toMatch(/_pt-24px/)
  })
})
