// @vitest-environment jsdom

/**
 * Editor's contract, on compiled markup and on a live DOM: the toolbar's four
 * commands, the contentEditable surface, `onChange` firing on input, the
 * controlled value path, `readOnly`, and the placeholder attribute.
 */
import { describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Editor } from './editor'

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
    surface: () => host.querySelector<HTMLElement>('[data-slot="editor-surface"]'),
    bold: () => host.querySelector<HTMLButtonElement>('[data-slot="editor-bold"]'),
    italic: () => host.querySelector<HTMLButtonElement>('[data-slot="editor-italic"]'),
    bulletList: () => host.querySelector<HTMLButtonElement>('[data-slot="editor-bullet-list"]'),
    orderedList: () => host.querySelector<HTMLButtonElement>('[data-slot="editor-ordered-list"]'),
    rerender: (next: React.ReactNode) => act(() => root.render(wrap(next))),
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

const tag = (markup: string, slotName: string) =>
  markup.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slotName}"[^>]*>`))?.[0] ?? ''

describe('Editor', () => {
  it('renders a toolbar with the four formatting commands and an editable surface', () => {
    const markup = html(<Editor />)

    expect(tag(markup, 'editor')).not.toBe('')
    expect(tag(markup, 'editor-toolbar')).not.toBe('')
    expect(tag(markup, 'editor-bold')).not.toBe('')
    expect(tag(markup, 'editor-italic')).not.toBe('')
    expect(tag(markup, 'editor-bullet-list')).not.toBe('')
    expect(tag(markup, 'editor-ordered-list')).not.toBe('')
    expect(tag(markup, 'editor-surface')).toContain('contentEditable="true"')
  })

  it('carries the placeholder onto the surface', () => {
    const markup = html(<Editor placeholder="Write here" />)

    expect(tag(markup, 'editor-surface')).toContain('data-placeholder="Write here"')
  })

  it('turns the surface non-editable when readOnly', () => {
    const markup = html(<Editor readOnly />)

    expect(tag(markup, 'editor-surface')).toContain('contentEditable="false"')
  })

  it('runs the bold command on the selection and reports the new HTML', () => {
    document.execCommand = vi.fn(() => true)
    const onChange = vi.fn()
    const view = mount(<Editor onChange={onChange} />)
    const surface = view.surface()!
    surface.innerHTML = '<b>x</b>'

    act(() => {
      view.bold()!.click()
    })

    expect(document.execCommand).toHaveBeenCalledWith('bold')
    expect(onChange).toHaveBeenCalledWith('<b>x</b>')
    view.cleanup()
  })

  it('runs the list commands by name', () => {
    document.execCommand = vi.fn(() => true)
    const view = mount(<Editor />)

    act(() => {
      view.bulletList()!.click()
    })
    expect(document.execCommand).toHaveBeenCalledWith('insertUnorderedList')

    act(() => {
      view.orderedList()!.click()
    })
    expect(document.execCommand).toHaveBeenCalledWith('insertOrderedList')

    act(() => {
      view.italic()!.click()
    })
    expect(document.execCommand).toHaveBeenCalledWith('italic')

    view.cleanup()
  })

  it('writes a controlled value into the surface and keeps it in sync on change', () => {
    const view = mount(<Editor value="<p>one</p>" />)

    expect(view.surface()!.innerHTML).toBe('<p>one</p>')

    view.rerender(<Editor value="<p>two</p>" />)
    expect(view.surface()!.innerHTML).toBe('<p>two</p>')

    view.cleanup()
  })

  it('marks the surface empty until it holds text', () => {
    const view = mount(<Editor />)

    expect(view.surface()!.getAttribute('data-empty')).toBe('true')

    act(() => {
      view.surface()!.textContent = 'hello'
      view.surface()!.dispatchEvent(new Event('input', { bubbles: true }))
    })

    expect(view.surface()!.getAttribute('data-empty')).toBeNull()
    view.cleanup()
  })
})
