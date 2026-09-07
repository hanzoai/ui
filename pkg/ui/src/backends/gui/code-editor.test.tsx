// @vitest-environment jsdom

/**
 * CodeEditor's contract, on compiled markup and on a live DOM: the toolbar's
 * two optional controls, the language label, `readOnly`, `wordWrap`, the named
 * palette, the controlled and uncontrolled value paths, Tab's indent, the
 * gutter following the field's scroll, `onMount` firing once, and the copy
 * action's two outcomes.
 *
 * SSR markup proves what a caller can see without a browser: which slots
 * exist, the `readonly` attribute, the compiled `white-space`. Typing, keys,
 * scroll and the copy action need a live DOM, mounted the way
 * `accordion.test.tsx` does.
 */
import { describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { CodeEditor } from './code-editor'
import { toast } from './toaster'

vi.mock('./toaster', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

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
    textarea: () => host.querySelector<HTMLTextAreaElement>('[data-slot="code-editor-textarea"]'),
    gutter: () => host.querySelector<HTMLElement>('[data-slot="code-editor-gutter"] span'),
    copy: () => host.querySelector<HTMLButtonElement>('[data-slot="code-editor-copy-button"]'),
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

const tag = (markup: string, slot: string) =>
  markup.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ''

/** Puts `next` into the field the way a keystroke does, through React's tracker. */
const type = (field: HTMLTextAreaElement | null, next: string) => {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set
  act(() => {
    setter?.call(field, next)
    field?.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

const press = (field: HTMLTextAreaElement | null, init: KeyboardEventInit) => {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init })
  act(() => {
    field?.dispatchEvent(event)
  })
  return event
}

describe('CodeEditor', () => {
  it('renders the toolbar, the gutter and a real textarea', () => {
    const markup = html(<CodeEditor defaultValue={'a\nb\nc'} />)

    expect(tag(markup, 'code-editor')).not.toBe('')
    expect(tag(markup, 'code-editor-toolbar')).not.toBe('')
    expect(tag(markup, 'code-editor-gutter')).not.toBe('')
    expect(tag(markup, 'code-editor-language-trigger')).not.toBe('')
    expect(tag(markup, 'code-editor-copy-button')).not.toBe('')
    expect(tag(markup, 'code-editor-textarea').startsWith('<textarea')).toBe(true)
  })

  it('carries the caller’s class and layout props on its root', () => {
    const root = tag(html(<CodeEditor className="my-editor" maxW={480} defaultValue="x" />), 'code-editor')

    expect(root).toContain('my-editor')
    expect(root).toMatch(/_maxW-480px|max-width:\s*480px/)
  })

  it('starts the language menu on the given language, in its display name', () => {
    const markup = html(<CodeEditor language="typescript" defaultValue="const x = 1" />)

    expect(tag(markup, 'code-editor-language-trigger')).not.toBe('')
    expect(markup).toContain('TypeScript')
  })

  it('hides the language menu and the copy button independently', () => {
    const noLanguage = html(<CodeEditor showLanguageSelector={false} defaultValue="x" />)
    expect(noLanguage).not.toContain('code-editor-language-trigger')
    expect(noLanguage).toContain('code-editor-copy-button')

    const noCopy = html(<CodeEditor showCopyButton={false} defaultValue="x" />)
    expect(noCopy).not.toContain('code-editor-copy-button')
    expect(noCopy).toContain('code-editor-language-trigger')

    const neither = html(
      <CodeEditor showLanguageSelector={false} showCopyButton={false} defaultValue="x" />,
    )
    expect(neither).not.toContain('code-editor-toolbar')
  })

  it('marks the field readonly and disables the copy button on empty content', () => {
    const readOnly = tag(html(<CodeEditor readOnly defaultValue="x" />), 'code-editor-textarea')
    expect(readOnly).toMatch(/readonly=""/i)

    const view = mount(<CodeEditor readOnly defaultValue="x" />)
    expect(view.textarea()?.readOnly).toBe(true)
    view.cleanup()

    const empty = tag(html(<CodeEditor defaultValue="" />), 'code-editor-copy-button')
    expect(empty).toContain('aria-disabled="true"')
  })

  it('numbers every line in the gutter, and draws none when lineNumbers is off', () => {
    const withNumbers = html(<CodeEditor defaultValue={'one\ntwo\nthree'} />)
    expect(withNumbers).toContain('>1\n2\n3<')

    const withoutNumbers = html(<CodeEditor lineNumbers={false} defaultValue={'one\ntwo\nthree'} />)
    expect(withoutNumbers).not.toContain('code-editor-gutter')
  })

  it('sets the wrapping style the wordWrap prop names', () => {
    const wrapped = tag(html(<CodeEditor wordWrap="on" defaultValue="x" />), 'code-editor-textarea')
    expect(wrapped).toMatch(/white-space:\s*pre-wrap/)

    const unwrapped = tag(html(<CodeEditor wordWrap="off" defaultValue="x" />), 'code-editor-textarea')
    expect(unwrapped).toMatch(/white-space:\s*pre(;|")/)
  })

  it('paints a named theme inline and leaves auto to the tokens', () => {
    const dark = tag(html(<CodeEditor theme="dark" defaultValue="x" />), 'code-editor')
    expect(dark).toMatch(/background-color:/)

    const auto = tag(html(<CodeEditor defaultValue="x" />), 'code-editor')
    expect(auto).not.toMatch(/background-color:/)
  })

  it('sizes the type from fontSize without minting a class for it', () => {
    const field = tag(html(<CodeEditor fontSize={17} defaultValue="x" />), 'code-editor-textarea')
    expect(field).toMatch(/font-size:\s*17px/)
    expect(field).toMatch(/line-height:\s*25\.5px/)
    expect(field).not.toContain('_fs-17px')
  })

  it('types into an uncontrolled field and reports every change', () => {
    const onChange = vi.fn()
    const view = mount(<CodeEditor defaultValue="start" onChange={onChange} />)
    const field = view.textarea()
    expect(field?.value).toBe('start')

    type(field, 'start!')

    expect(onChange).toHaveBeenCalledWith('start!')
    expect(field?.value).toBe('start!')
    view.cleanup()
  })

  it('keeps a controlled field pinned to its value prop', () => {
    const onChange = vi.fn()
    const view = mount(<CodeEditor value="fixed" onChange={onChange} />)
    const field = view.textarea()

    type(field, 'typed')

    expect(onChange).toHaveBeenCalledWith('typed')
    // The parent never applied the change back as a new `value`, so the field
    // is restored to what it was actually told to show.
    expect(field?.value).toBe('fixed')
    view.cleanup()
  })

  it('indents on Tab instead of leaving the field, and not when readOnly', () => {
    const onChange = vi.fn()
    const view = mount(<CodeEditor defaultValue="ab" onChange={onChange} />)
    const field = view.textarea()
    field?.setSelectionRange(1, 1)

    const tab = press(field, { key: 'Tab' })
    expect(tab.defaultPrevented).toBe(true)
    expect(field?.value).toBe('a  b')
    expect(onChange).toHaveBeenCalledWith('a  b')
    expect(field?.selectionStart).toBe(3)

    // Shift+Tab is the way back out through the focus order.
    expect(press(field, { key: 'Tab', shiftKey: true }).defaultPrevented).toBe(false)
    view.cleanup()

    const locked = mount(<CodeEditor readOnly defaultValue="ab" />)
    expect(press(locked.textarea(), { key: 'Tab' }).defaultPrevented).toBe(false)
    expect(locked.textarea()?.value).toBe('ab')
    locked.cleanup()
  })

  it('moves the gutter with the field as it scrolls', () => {
    const view = mount(<CodeEditor defaultValue={'a\nb\nc\nd'} />)
    const field = view.textarea()
    expect(view.gutter()?.style.transform).toBe('translateY(0px)')

    // jsdom lays nothing out, so the scroll offset is stated rather than caused.
    Object.defineProperty(field, 'scrollTop', { value: 42, configurable: true })
    act(() => {
      field?.dispatchEvent(new Event('scroll'))
    })

    expect(view.gutter()?.style.transform).toBe('translateY(-42px)')
    view.cleanup()
  })

  it('reports the mounted textarea once, even to a handler recreated each render', () => {
    const onMount = vi.fn()
    const view = mount(<CodeEditor defaultValue="x" onMount={(el) => onMount(el)} />)

    type(view.textarea(), 'xy')

    expect(onMount).toHaveBeenCalledTimes(1)
    expect(onMount).toHaveBeenCalledWith(view.textarea())
    view.cleanup()
  })

  it('copies the current text to the clipboard and reports it, briefly', async () => {
    vi.useFakeTimers()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })

    const view = mount(<CodeEditor defaultValue="copy me" />)
    const button = view.copy()

    await act(async () => {
      button?.click()
      await Promise.resolve()
    })
    expect(writeText).toHaveBeenCalledWith('copy me')
    expect(toast.success).toHaveBeenCalledWith('Code copied to clipboard')
    expect(button?.textContent).toContain('Copied!')

    await act(async () => {
      vi.advanceTimersByTime(2000)
    })
    expect(button?.textContent).toContain('Copy')
    expect(button?.textContent).not.toContain('Copied!')

    view.cleanup()
    vi.useRealTimers()
  })

  it('says so when the clipboard refuses', async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } })

    const view = mount(<CodeEditor defaultValue="copy me" />)
    const button = view.copy()

    await act(async () => {
      button?.click()
      await Promise.resolve()
    })
    expect(toast.error).toHaveBeenCalledWith('Failed to copy code')
    expect(button?.textContent).not.toContain('Copied!')
    view.cleanup()
  })
})
