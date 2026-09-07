// @vitest-environment jsdom

/**
 * DialogStack renders every panel with its own stacking and reports the id of
 * whichever one's close button was pressed.
 */
import { describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { DialogStack, type DialogStackItem } from './dialog-stack'

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
    closers: () => [...host.querySelectorAll<HTMLElement>('[data-slot="dialog-stack-close"]')],
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

const dialogs: DialogStackItem[] = [
  { id: 'a', title: 'Welcome', content: 'First dialog.' },
  { id: 'b', title: 'Settings', content: 'Second dialog.' },
  { id: 'c', title: 'Confirm', content: 'Third dialog.' },
]

const tag = (markup: string, slot: string) =>
  markup.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ''

describe('DialogStack', () => {
  it('renders one item per dialog with an increasing z-index', () => {
    const markup = html(<DialogStack dialogs={dialogs} />)
    const items = [...markup.matchAll(/<[a-z0-9]+[^>]*data-slot="dialog-stack-item"[^>]*>/g)].map(
      (m) => m[0],
    )

    expect(items).toHaveLength(3)
    expect(items.map((_, i) => i)).toEqual([0, 1, 2])
  })

  it('shows every dialog title and content', () => {
    const markup = html(<DialogStack dialogs={dialogs} />)

    expect(markup).toContain('Welcome')
    expect(markup).toContain('Settings')
    expect(markup).toContain('Confirm')
    expect(markup).toContain('First dialog.')
  })

  it('gives the frame the dialog-stack slot', () => {
    const markup = html(<DialogStack dialogs={dialogs} />)

    expect(tag(markup, 'dialog-stack')).not.toBe('')
  })

  it('reports the id of the dialog whose close button was pressed', () => {
    const onClose = vi.fn()
    const view = mount(<DialogStack dialogs={dialogs} onClose={onClose} />)

    act(() => {
      view.closers()[1].click()
    })

    expect(onClose).toHaveBeenCalledWith('b')
    view.cleanup()
  })

  it('renders nothing for an empty stack beyond the frame itself', () => {
    const markup = html(<DialogStack dialogs={[]} />)

    expect(markup).not.toContain('dialog-stack-item')
    expect(tag(markup, 'dialog-stack')).not.toBe('')
  })
})
