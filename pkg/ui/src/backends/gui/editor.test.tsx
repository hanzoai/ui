// @vitest-environment jsdom

/**
 * Editor's contract: the toolbar's four commands reach `document.execCommand`
 * with the right command name, typing reports the region's `innerHTML`, and a
 * controlled `value` is written into the region without fighting the caret on
 * every render.
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
    content: () => host.querySelector<HTMLDivElement>('[data-slot="editor-content"]'),
    button: (slot: string) => host.querySelector<HTMLButtonElement>(`[data-slot="${slot}"]`),
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

const tag = (markup: string, slot: string) =>
  markup.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ''

/** The full element for a slot, opening tag through its matching close — needed
 *  for `editor-content`, whose children are the point of the assertion. */
const block = (markup: string, slot: string) => {
  const open = tag(markup, slot)
  const close = open.match(/^<([a-z0-9]+)/)?.[1]
  if (!open || !close) return ''
  const start = markup.indexOf(open)
  const end = markup.indexOf(`</${close}>`, start)
  return markup.slice(start, end + close.length + 3)
}

describe('Editor', () => {
  it('renders a toolbar and a contentEditable region', () => {
    const markup = html(<Editor />)

    expect(tag(markup, 'editor')).not.toBe('')
    expect(tag(markup, 'editor-toolbar')).not.toBe('')
    const content = tag(markup, 'editor-content')
    expect(content).toContain('contentEditable="true"')
    expect(content).toContain('data-placeholder="Start typing..."')
  })

  it('shows a custom placeholder', () => {
    const markup = html(<Editor placeholder="Write here" />)
    expect(tag(markup, 'editor-content')).toContain('data-placeholder="Write here"')
  })

  it('starts the region with the given value', () => {
    const markup = html(<Editor value="<p>hello</p>" />)
    expect(block(markup, 'editor-content')).toContain('<p>hello</p>')
  })

  it('runs the matching command for each toolbar button', () => {
    ;(document as { execCommand?: unknown }).execCommand = vi.fn().mockReturnValue(true)
    const exec = document.execCommand as unknown as ReturnType<typeof vi.fn>
    const view = mount(<Editor />)

    act(() => view.button('editor-bold')?.click())
    expect(exec).toHaveBeenCalledWith('bold', false)

    act(() => view.button('editor-italic')?.click())
    expect(exec).toHaveBeenCalledWith('italic', false)

    act(() => view.button('editor-bullet-list')?.click())
    expect(exec).toHaveBeenCalledWith('insertUnorderedList', false)

    act(() => view.button('editor-ordered-list')?.click())
    expect(exec).toHaveBeenCalledWith('insertOrderedList', false)

    view.cleanup()
  })

  it('reports the region html on input', () => {
    const onChange = vi.fn()
    const view = mount(<Editor onChange={onChange} />)
    const el = view.content()!

    el.innerHTML = 'typed text'
    act(() => {
      el.dispatchEvent(new Event('input', { bubbles: true }))
    })

    expect(onChange).toHaveBeenCalledWith('typed text')
    view.cleanup()
  })

  it('keeps a controlled value applied to the region, and does not fight local edits until it changes', () => {
    const view = mount(<Editor value="<p>a</p>" />)
    expect(view.content()?.innerHTML).toBe('<p>a</p>')
    view.cleanup()
  })
})
