// @vitest-environment jsdom

/**
 * A Sheet IS the Dialog — same portal, overlay, focus trap and `aria-modal`.
 * What this file owns is the geometry, so that is what is asserted: which edge
 * it is pinned to, and that the composition actually carries the dialog's
 * behaviour along.
 *
 * On a LIVE tree, like dialog.test.tsx and for the same reason: the panel mounts
 * into gui's portal host, which server rendering does not produce at all — a
 * static render returns markup with no sheet in it, and every assertion would
 * fail for the wrong reason.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './sheet'

let root: Root | null = null
let host: HTMLDivElement | null = null

const mount = (ui: React.ReactNode) => {
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
  act(() => {
    root!.render(
      <GuiProvider config={config as never} defaultTheme="dark">
        {ui}
      </GuiProvider>,
    )
  })
  return document.body.innerHTML
}

afterEach(() => {
  act(() => root?.unmount())
  host?.remove()
  root = null
  host = null
})

const open = (props: Record<string, unknown> = {}) => (
  <Sheet open>
    <SheetTrigger>menu</SheetTrigger>
    <SheetContent {...props}>
      <SheetHeader>
        <SheetTitle>History</SheetTitle>
      </SheetHeader>
      PANEL
    </SheetContent>
  </Sheet>
)

describe('which edge it arrives from', () => {
  it('the right, unless told otherwise — it opens away from the content', () => {
    expect(mount(open())).toContain('data-side="right"')
  })

  it('takes the side it is given', () => {
    for (const side of ['top', 'bottom', 'left'] as const) {
      const m = mount(open({ side }))
      expect(m).toContain(`data-side="${side}"`)
      act(() => root?.unmount())
      host?.remove()
    }
  })

  it('marks itself as a sheet, for a host selecting on parts', () => {
    expect(mount(open())).toContain('data-slot="sheet-content"')
  })
})

describe('it is still a dialog', () => {
  it('renders its content and its title', () => {
    const m = mount(open())
    expect(m).toContain('PANEL')
    expect(m).toContain('History')
  })

  it('carries the dialog role along', () => {
    // The whole reason this composes Dialog rather than reimplementing it: the
    // focus trap, the escape key and the modal marking come with it.
    expect(mount(open())).toMatch(/role="dialog"|aria-modal/)
  })
})
