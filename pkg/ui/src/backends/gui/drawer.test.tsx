// @vitest-environment jsdom

/**
 * The sheet is rendered at its TALLEST snap point and slid down to the active
 * one, so the offset is arithmetic and can be read straight off the markup —
 * which is worth doing, because getting it backwards produces a sheet that is
 * open when it should be a peek and looks like a state bug rather than a sum.
 */
import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Drawer, DrawerContent, DrawerHandle, DrawerTrigger } from './drawer'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config as never} defaultTheme="dark">
      {node}
    </GuiProvider>,
  ).replace(/<style[^>]*>[\s\S]*?<\/style>/g, '')

const POINTS = ['72px', '620px']

const sheet = (props: Record<string, unknown> = {}, content: Record<string, unknown> = {}) => (
  <Drawer open snapPoints={POINTS} {...props}>
    <DrawerContent {...content}>CONTENTS</DrawerContent>
  </Drawer>
)

describe('where the sheet rests', () => {
  it('at its tallest point it is not slid down at all', () => {
    const m = html(sheet({ activeSnapPoint: '620px' }))
    expect(m).toContain('translateY(0px)')
    expect(m).toMatch(/height:\s*620px/)
  })

  it('at a peek it is slid down by the difference', () => {
    // 620 tall, resting at 72, so 548 of it is below the fold.
    const m = html(sheet({ activeSnapPoint: '72px' }))
    expect(m).toContain('translateY(548px)')
    // and it is still 620 tall, so its content does not reflow on the way.
    expect(m).toMatch(/height:\s*620px/)
  })

  it('an undecided snap point rests at the tallest, not at zero', () => {
    // A store that has not chosen yet holds null. Read as a height that would
    // be 0, and the sheet is open but flat.
    for (const activeSnapPoint of [null, undefined]) {
      expect(html(sheet({ activeSnapPoint }))).toContain('translateY(0px)')
    }
  })
})

describe('what it renders', () => {
  it('nothing at all when closed', () => {
    // A distinctive marker: gui's own markup carries a `font_body` class, so
    // asserting on the word "body" passes for the wrong reason.
    expect(html(
      <Drawer open={false} snapPoints={POINTS}>
        <DrawerContent>CONTENTS</DrawerContent>
      </Drawer>,
    )).not.toContain('CONTENTS')
  })

  it('is a modal dialog with a scrim by default', () => {
    const m = html(sheet())
    expect(m).toContain('role="dialog"')
    expect(m).toContain('aria-modal="true"')
    expect(m).toMatch(/rgba\(0,0,0,\.5\)/)
  })

  it('a non-modal sheet has no scrim, because the page behind it is still live', () => {
    const m = html(sheet({ modal: false }))
    expect(m).not.toMatch(/rgba\(0,0,0,\.5\)/)
    expect(m).toContain('aria-modal="false"')
  })

  it('draws its own handle unless the caller draws one', () => {
    expect(html(sheet())).toContain('aria-label="Resize"')
    expect(html(sheet({}, { defaultHandle: false }))).not.toContain('aria-label="Resize"')
  })

  it('is focusable but not tabbable — the tab order inside belongs to its content', () => {
    expect(html(sheet())).toContain('tabindex="-1"')
  })
})

describe('a handle outside a drawer is refused, rather than failing later', () => {
  it('says so at render', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => html(<DrawerHandle />)).toThrow(/inside a <Drawer>/)
    spy.mockRestore()
  })
})

describe('taking focus', () => {
  it('focuses the sheet when it opens', async () => {
    const { render } = await import('@testing-library/react')
    const { container } = render(
      <GuiProvider config={config as never} defaultTheme="dark">
        {sheet()}
      </GuiProvider>,
    )
    const panel = container.querySelector('[role="dialog"]')
    expect(document.activeElement).toBe(panel)
  })

  it('leaves focus alone when the caller prevents it', async () => {
    // A sheet that opens beside a form someone is typing in must not steal the
    // caret out of it.
    const { render } = await import('@testing-library/react')
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()
    render(
      <GuiProvider config={config as never} defaultTheme="dark">
        {sheet({}, { onOpenAutoFocus: (e: Event) => e.preventDefault() })}
      </GuiProvider>,
    )
    expect(document.activeElement).toBe(input)
    input.remove()
  })
})

describe('what opens it', () => {
  it('asks the caller to open, rather than opening itself', async () => {
    // The sheet is controlled, so the trigger reports the intent and the owner
    // of the state decides — that is what keeps one source of truth for `open`.
    const { render } = await import('@testing-library/react')
    const onOpenChange = vi.fn()
    const { getByText } = render(
      <GuiProvider config={config as never} defaultTheme="dark">
        <Drawer open={false} onOpenChange={onOpenChange} snapPoints={POINTS}>
          <DrawerTrigger>open me</DrawerTrigger>
        </Drawer>
      </GuiProvider>,
    )
    getByText('open me').click()
    expect(onOpenChange).toHaveBeenCalledWith(true)
  })

  it('asChild hands the press to the element you already wrote', async () => {
    // A button inside a button is invalid markup, and a keyboard reaches only
    // the outer one.
    const { render } = await import('@testing-library/react')
    const onOpenChange = vi.fn()
    const { container, getByText } = render(
      <GuiProvider config={config as never} defaultTheme="dark">
        <Drawer open={false} onOpenChange={onOpenChange} snapPoints={POINTS}>
          <DrawerTrigger asChild>
            <button type="button">mine</button>
          </DrawerTrigger>
        </Drawer>
      </GuiProvider>,
    )
    expect(container.querySelectorAll('button')).toHaveLength(1)
    getByText('mine').click()
    expect(onOpenChange).toHaveBeenCalledWith(true)
  })
})
