// @vitest-environment jsdom

/**
 * Glimpse rides the same popper `hover-card.test.tsx` documents, so the same
 * caveat holds: jsdom fires neither floating-ui's `useHover` nor a
 * `ResizeObserver`, so the panel is opened here through `open`/`defaultOpen`
 * rather than a real hover, and every claim is read back off the live DOM.
 *
 * What is specific to Glimpse and worth its own suite: the edge-to-edge image
 * frame, the broken-image fallback, and the title/description truncation —
 * none of which `hover-card.test.tsx` exercises.
 */
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import {
  Glimpse,
  GlimpseContent,
  GlimpseDescription,
  GlimpseImage,
  GlimpseTitle,
  GlimpseTrigger,
} from './glimpse'

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

const panel = () => document.querySelector('[data-slot="glimpse-content"]')

describe('Glimpse', () => {
  it('mounts a labelled dialog panel the trigger points at', async () => {
    const { getByTestId } = mount(
      <Glimpse open>
        <GlimpseTrigger data-testid="t">kibo-ui.com</GlimpseTrigger>
        <GlimpseContent>
          <GlimpseTitle>Kibo UI</GlimpseTitle>
          <GlimpseDescription>Composable, accessible components.</GlimpseDescription>
        </GlimpseContent>
      </Glimpse>,
    )
    await settle()

    const content = panel()!
    expect(content).not.toBeNull()
    const trigger = getByTestId('t')
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog')
    const floating = content.parentElement!
    expect(floating.getAttribute('role')).toBe('dialog')
    expect(trigger.getAttribute('aria-controls')).toBe(floating.id)
  })

  it('does not open on press — the trigger is a link, not a button', async () => {
    const { getByTestId } = mount(
      <Glimpse>
        <GlimpseTrigger data-testid="t">kibo-ui.com</GlimpseTrigger>
        <GlimpseContent>
          <GlimpseTitle>Kibo UI</GlimpseTitle>
        </GlimpseContent>
      </Glimpse>,
    )

    act(() => void fireEvent.click(getByTestId('t')))
    await settle()
    expect(panel()).toBeNull()
  })

  it('closes on Escape and says so through onOpenChange', async () => {
    const onOpenChange = vi.fn()
    mount(
      <Glimpse defaultOpen onOpenChange={onOpenChange}>
        <GlimpseTrigger>kibo-ui.com</GlimpseTrigger>
        <GlimpseContent>
          <GlimpseTitle>Kibo UI</GlimpseTitle>
        </GlimpseContent>
      </Glimpse>,
    )
    await settle()
    expect(panel()).not.toBeNull()

    act(() => void fireEvent.keyDown(document, { key: 'Escape' }))
    await settle()

    expect(panel()).toBeNull()
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything())
  })

  it('hoists side + align off Content onto the root placement', async () => {
    const { unmount } = mount(
      <Glimpse open>
        <GlimpseTrigger>kibo-ui.com</GlimpseTrigger>
        <GlimpseContent align="start" side="top">
          <GlimpseTitle>Kibo UI</GlimpseTitle>
        </GlimpseContent>
      </Glimpse>,
    )
    await settle()
    expect(panel()?.getAttribute('data-placement')).toBe('top-start')
    unmount()
  })

  it('renders the image edge to edge in a 16:9 frame with no fallback showing', async () => {
    mount(
      <Glimpse open>
        <GlimpseTrigger>kibo-ui.com</GlimpseTrigger>
        <GlimpseContent>
          <GlimpseImage src="https://example.com/og.png" alt="Kibo UI" />
          <GlimpseTitle>Kibo UI</GlimpseTitle>
        </GlimpseContent>
      </Glimpse>,
    )
    await settle()

    const frame = document.querySelector('[data-slot="glimpse-image"]') as HTMLElement
    expect(frame).not.toBeNull()
    // gui compiles `aspectRatio` to an atomic class; read the ratio back off
    // the resolved style rather than assuming an inline one.
    expect(getComputedStyle(frame).aspectRatio).toBe(`${16 / 9} / 1`)
    const img = frame.querySelector('img')!
    expect(img.getAttribute('src')).toBe('https://example.com/og.png')
    expect(frame.querySelector('svg')).toBeNull()
  })

  it('swaps a failed image for an ImageOff glyph', async () => {
    mount(
      <Glimpse open>
        <GlimpseTrigger>kibo-ui.com</GlimpseTrigger>
        <GlimpseContent>
          <GlimpseImage src="https://example.com/broken.png" alt="broken" />
        </GlimpseContent>
      </Glimpse>,
    )
    await settle()

    const frame = document.querySelector('[data-slot="glimpse-image"]') as HTMLElement
    const img = frame.querySelector('img')!
    act(() => void fireEvent.error(img))
    await settle()

    expect(frame.querySelector('img')).toBeNull()
    expect(frame.querySelector('svg')).not.toBeNull()
  })

  it('truncates the title to one line and the description to two', async () => {
    mount(
      <Glimpse open>
        <GlimpseTrigger>kibo-ui.com</GlimpseTrigger>
        <GlimpseContent>
          <GlimpseTitle>Kibo UI</GlimpseTitle>
          <GlimpseDescription>Composable, accessible components.</GlimpseDescription>
        </GlimpseContent>
      </Glimpse>,
    )
    await settle()

    const title = document.querySelector('[data-slot="glimpse-title"]')!
    const description = document.querySelector('[data-slot="glimpse-description"]')!
    expect(title.textContent).toBe('Kibo UI')
    expect(description.textContent).toBe('Composable, accessible components.')
    // `numberOfLines={1}` compiles to single-line ellipsis truncation; anything
    // greater compiles to a webkit line-clamp. Read the atomic classes rather
    // than an inline style — gui puts both there, not on `style`.
    const style = getComputedStyle(title as HTMLElement)
    expect(style.textOverflow).toBe('ellipsis')
    expect(style.whiteSpace).toBe('nowrap')
    expect(getComputedStyle(description as HTMLElement).getPropertyValue('-webkit-line-clamp')).toBe(
      '2',
    )
  })
})
