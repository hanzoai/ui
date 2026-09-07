// @vitest-environment jsdom

/**
 * Announcement's behaviour, asserted on the compiled markup and on a live DOM:
 * it renders once at the small type scale, the dismiss button is a real button
 * that removes the strip and fires the callback, and `dismissible={false}`
 * drops the button while the message stays.
 *
 * Imports `./announcement` directly rather than the backend barrel, the same
 * reason `accordion.test.tsx` does.
 */
import { describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Announcement } from './announcement'

const wrap = (node: React.ReactNode) => (
  <GuiProvider config={config} defaultTheme="dark">
    {node}
  </GuiProvider>
)

const html = (node: React.ReactNode) => renderToStaticMarkup(wrap(node))

const tag = (markup: string, slot: string) =>
  markup.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ''

/** The compiled class for one style property, e.g. cls(el, 'fs'). */
const cls = (el: string, prop: string) =>
  (el.match(/class="([^"]*)"/)?.[1] ?? '').split(/\s+/).find((c) => c.startsWith(`_${prop}-`)) ?? ''

const mount = (node: React.ReactNode) => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  act(() => root.render(wrap(node)))
  return {
    host,
    dismiss: () => host.querySelector<HTMLElement>('[data-slot="announcement-dismiss"]'),
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

describe('Announcement', () => {
  it('renders its message and a dismiss button by default', () => {
    const markup = html(<Announcement>New feature shipped</Announcement>)
    const button = tag(markup, 'announcement-dismiss')

    expect(tag(markup, 'announcement')).not.toBe('')
    expect(tag(markup, 'announcement-message')).not.toBe('')
    expect(markup).toContain('New feature shipped')
    // A real button, and one that never submits a surrounding form.
    expect(button.startsWith('<button')).toBe(true)
    expect(button).toContain('type="button"')
    expect(button).toContain('aria-label="Dismiss"')
  })

  // The message host carries the small scale itself; a string child must land
  // in it directly, because a nested Text host brings the default scale along
  // and the host's size then styles nothing.
  it('sets the message at the small type scale', () => {
    const markup = html(<Announcement>Small print</Announcement>)
    const message = tag(markup, 'announcement-message')

    expect(cls(message, 'fs')).toBe('_fs-f-size-2')
    expect(markup).toContain(`${message}Small print</div>`)
  })

  it('omits the dismiss button when dismissible is false', () => {
    const markup = html(<Announcement dismissible={false}>Heads up</Announcement>)

    expect(tag(markup, 'announcement-dismiss')).toBe('')
    expect(markup).toContain('Heads up')
  })

  it('unmounts itself and calls onDismiss when the button is pressed', () => {
    const onDismiss = vi.fn()
    const view = mount(<Announcement onDismiss={onDismiss}>Bye soon</Announcement>)

    expect(view.host.textContent).toContain('Bye soon')
    const button = view.dismiss()
    expect(button).not.toBeNull()

    act(() => {
      button!.click()
    })

    expect(onDismiss).toHaveBeenCalledTimes(1)
    expect(view.host.textContent).not.toContain('Bye soon')
    expect(view.dismiss()).toBeNull()

    view.cleanup()
  })

  it('forwards extra props to the frame', () => {
    const markup = html(<Announcement id="promo">Extra props</Announcement>)

    expect(tag(markup, 'announcement')).toContain('id="promo"')
  })
})
