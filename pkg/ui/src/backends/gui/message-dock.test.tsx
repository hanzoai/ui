// @vitest-environment jsdom

/**
 * MessageDock's contract, asserted on compiled markup and a live DOM: every
 * message renders its own card, a `type` reaches the card as `data-type`, a
 * click on a card's close button reports that card's id and no other, and the
 * dock anchors to the requested corner via `data-position`.
 *
 * Imports `./message-dock` directly rather than the backend barrel, the same
 * discipline `accordion.test.tsx` uses.
 */
import { describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { MessageDock, type MessageDockMessage } from './message-dock'

const wrap = (node: React.ReactNode) => (
  <GuiProvider config={config} defaultTheme="dark">
    {node}
  </GuiProvider>
)

const html = (node: React.ReactNode) => renderToStaticMarkup(wrap(node))

const mount = (node: React.ReactNode) => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  act(() => root.render(wrap(node)))
  return {
    host,
    closeButtons: () => [...host.querySelectorAll<HTMLElement>('[data-slot="message-dock-card-close"]')],
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

const tag = (markup: string, slot: string, index = 0) =>
  [...markup.matchAll(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`, 'g'))].map((m) => m[0])[
    index
  ] ?? ''

const messages: MessageDockMessage[] = [
  { id: '1', type: 'success', title: 'Saved', description: 'Your changes have been saved.' },
  { id: '2', type: 'info', title: 'Update available' },
  { id: '3', type: 'warning', title: 'Check settings', description: 'Please review.' },
]

describe('MessageDock', () => {
  it('renders one card per message', () => {
    const markup = html(<MessageDock messages={messages} />)
    const cards = [...markup.matchAll(/data-slot="message-dock-card"/g)]

    expect(cards).toHaveLength(3)
    expect(tag(markup, 'message-dock')).not.toBe('')
  })

  it('carries each message type onto its card as data-type', () => {
    const markup = html(<MessageDock messages={messages} />)

    expect(tag(markup, 'message-dock-card', 0)).toContain('data-type="success"')
    expect(tag(markup, 'message-dock-card', 1)).toContain('data-type="info"')
    expect(tag(markup, 'message-dock-card', 2)).toContain('data-type="warning"')
  })

  it('defaults an untyped message to the plain surface', () => {
    const markup = html(<MessageDock messages={[{ id: '4', title: 'Plain' }]} />)

    expect(tag(markup, 'message-dock-card', 0)).toContain('data-type="default"')
  })

  it('anchors to the requested corner via data-position, defaulting to bottom-right', () => {
    const bottomRight = html(<MessageDock messages={messages} />)
    const topLeft = html(<MessageDock messages={messages} position="top" />)

    expect(tag(bottomRight, 'message-dock')).toContain('data-position="bottom-right"')
    expect(tag(topLeft, 'message-dock')).toContain('data-position="top"')
  })

  it('shows the title and, when given, the description', () => {
    const markup = html(<MessageDock messages={messages} />)

    expect(markup).toContain('Saved')
    expect(markup).toContain('Your changes have been saved.')
    expect(markup).toContain('Update available')
  })

  it('renders no close button when onClose is not given', () => {
    const markup = html(<MessageDock messages={messages} />)

    expect(markup).not.toContain('message-dock-card-close')
  })

  it('reports the id of the card whose close button was pressed, and no other', () => {
    const onClose = vi.fn()
    const view = mount(<MessageDock messages={messages} onClose={onClose} />)

    act(() => {
      view.closeButtons()[1].click()
    })

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledWith('2')
    view.cleanup()
  })
})
