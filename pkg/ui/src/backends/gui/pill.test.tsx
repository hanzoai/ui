// @vitest-environment jsdom

/**
 * Pill's behaviour, asserted on the compiled markup and on a live DOM: every
 * variant carries its own `data-variant`, a label renders in place, the
 * remove control is a real button that fires `onRemove`, and omitting
 * `onRemove` drops the button entirely.
 *
 * Imports `./pill` directly rather than the backend barrel, the same reason
 * `accordion.test.tsx` and `announcement.test.tsx` do.
 */
import { describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Pill, pillVariants, type PillVariant } from './pill'

const wrap = (node: React.ReactNode) => (
  <GuiProvider config={config} defaultTheme="dark">
    {node}
  </GuiProvider>
)

const html = (node: React.ReactNode) => renderToStaticMarkup(wrap(node))

const tag = (markup: string, slot: string) =>
  markup.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ''

const mount = (node: React.ReactNode) => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  act(() => root.render(wrap(node)))
  return {
    host,
    remove: () => host.querySelector<HTMLElement>('[data-slot="pill-remove"]'),
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

describe('Pill', () => {
  it('renders its label with the default variant', () => {
    const markup = html(<Pill>Beta</Pill>)
    const pill = tag(markup, 'pill')

    expect(pill).not.toBe('')
    expect(pill).toContain('data-variant="default"')
    expect(markup).toContain('Beta')
  })

  it('stamps every documented variant', () => {
    const variants: PillVariant[] = ['default', 'secondary', 'outline', 'success', 'warning', 'error']

    for (const variant of variants) {
      const markup = html(<Pill variant={variant}>{variant}</Pill>)
      expect(tag(markup, 'pill')).toContain(`data-variant="${variant}"`)
    }
  })

  it('omits the remove control by default', () => {
    const markup = html(<Pill>No remove</Pill>)

    expect(tag(markup, 'pill-remove')).toBe('')
  })

  it('renders a real remove button that never submits a form', () => {
    const markup = html(<Pill onRemove={() => {}}>Closeable</Pill>)
    const button = tag(markup, 'pill-remove')

    expect(button.startsWith('<button')).toBe(true)
    expect(button).toContain('type="button"')
    expect(button).toContain('aria-label="Remove"')
  })

  it('calls onRemove when the remove button is pressed', () => {
    const onRemove = vi.fn()
    const view = mount(<Pill onRemove={onRemove}>Tag</Pill>)
    const button = view.remove()

    expect(button).not.toBeNull()
    act(() => {
      button!.click()
    })

    expect(onRemove).toHaveBeenCalledTimes(1)
    view.cleanup()
  })

  it('forwards extra props to the frame', () => {
    const markup = html(<Pill id="status-pill">Live</Pill>)

    expect(tag(markup, 'pill')).toContain('id="status-pill"')
  })

  it('derives a stable class name per variant', () => {
    expect(pillVariants()).toBe('pill pill-default')
    expect(pillVariants({ variant: 'success' })).toBe('pill pill-success')
  })
})
