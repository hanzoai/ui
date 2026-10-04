// @vitest-environment jsdom

/**
 * CodeEditor's contract on a live DOM: CodeMirror mounts inside the gui frame,
 * the toolbar's controls appear and hide on their props, a controlled value
 * replaces the text without echoing to `onChange`, an edit does reach it, JSON
 * is checked and a broken document is marked on its line and named in the
 * footer, Format re-indents, the footer resizes by keyboard and resets on a
 * double-click, and Copy reports both outcomes.
 *
 * jsdom lays nothing out, so a height here is read from the inline style the
 * editor sets, never from a measured box — the browser specs measure boxes.
 */
import { describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { GuiProvider } from '@hanzo/gui'
import type { EditorView } from '@codemirror/view'

import config from '../../gui-config'
import { CodeEditor } from './code-editor'
import type { JsonCheck } from './json'
import { toast } from './toaster'

vi.mock('./toaster', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mount = (node: React.ReactNode) => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  const render = (next: React.ReactNode) =>
    act(() =>
      root.render(
        <GuiProvider config={config} defaultTheme="dark">
          {next}
        </GuiProvider>,
      ),
    )
  render(node)
  const q = <T extends Element = HTMLElement>(sel: string) => host.querySelector<T>(sel)
  return {
    host,
    render,
    q,
    slot: (name: string) => q(`[data-slot="${name}"]`),
    content: () => q('.cm-content'),
    editor: () => q('.cm-editor'),
    status: () => q('[data-slot="code-editor-status-text"]')?.textContent ?? '',
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

const press = (el: Element | null, init: KeyboardEventInit) =>
  act(() => {
    el?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init }))
  })

describe('CodeEditor', () => {
  it('mounts CodeMirror in the frame, with the toolbar and a named, editable surface', () => {
    const ui = mount(<CodeEditor defaultValue={'a\nb\nc'} label="notes.txt" />)

    expect(ui.slot('code-editor')).not.toBeNull()
    expect(ui.slot('code-editor-toolbar')).not.toBeNull()
    expect(ui.slot('code-editor-language-trigger')).not.toBeNull()
    expect(ui.slot('code-editor-copy-button')).not.toBeNull()
    expect(ui.content()?.getAttribute('aria-label')).toBe('notes.txt')
    expect(ui.content()?.getAttribute('contenteditable')).toBe('true')
    expect(ui.host.querySelectorAll('.cm-line')).toHaveLength(3)
    expect(ui.host.querySelector('.cm-lineNumbers')).not.toBeNull()
    ui.cleanup()
  })

  it('hides the toolbar controls independently, and shows the language as a label without the menu', () => {
    const ui = mount(<CodeEditor showLanguageSelector={false} language="typescript" defaultValue="x" />)
    expect(ui.slot('code-editor-language-trigger')).toBeNull()
    expect(ui.slot('code-editor-language')?.textContent).toBe('TypeScript')
    ui.cleanup()

    const bare = mount(<CodeEditor showLanguageSelector={false} showCopyButton={false} defaultValue="x" />)
    expect(bare.slot('code-editor-toolbar')).toBeNull()
    bare.cleanup()
  })

  it('draws no gutter when lineNumbers is off, and refuses edits when readOnly', () => {
    const ui = mount(<CodeEditor lineNumbers={false} readOnly defaultValue="x" />)
    expect(ui.host.querySelector('.cm-lineNumbers')).toBeNull()
    expect(ui.content()?.getAttribute('contenteditable')).toBe('false')
    ui.cleanup()
  })

  it('replaces the text when a controlled value moves, without echoing it to onChange', () => {
    const onChange = vi.fn()
    const ui = mount(<CodeEditor value="one" onChange={onChange} />)
    ui.render(<CodeEditor value="two" onChange={onChange} />)

    expect(ui.content()?.textContent).toBe('two')
    expect(onChange).not.toHaveBeenCalled()
    ui.cleanup()
  })

  it('never writes back a value it reported itself, however late the parent hands it back', () => {
    let view: EditorView | undefined
    const onChange = vi.fn()
    const ui = mount(<CodeEditor value="a" onChange={onChange} onMount={(v) => (view = v)} />)
    act(() => view?.dispatch({ changes: { from: 1, insert: 'b' } }))
    act(() => view?.dispatch({ changes: { from: 2, insert: 'c' } }))
    expect(onChange.mock.calls.map((c) => c[0])).toEqual(['ab', 'abc'])

    // A parent one keystroke behind renders 'ab' after the editor already holds 'abc'.
    ui.render(<CodeEditor value="ab" onChange={onChange} onMount={(v) => (view = v)} />)
    expect(ui.content()?.textContent).toBe('abc')
    // A value the editor never reported is the parent's own, and it wins.
    ui.render(<CodeEditor value="reset" onChange={onChange} onMount={(v) => (view = v)} />)
    expect(ui.content()?.textContent).toBe('reset')
    ui.cleanup()
  })

  it('reports an edit to onChange, and hands the view to onMount once', () => {
    const onChange = vi.fn()
    let view: EditorView | undefined
    const onMount = vi.fn((v: EditorView) => (view = v))
    const ui = mount(<CodeEditor defaultValue="start" onChange={onChange} onMount={onMount} />)

    act(() => view?.dispatch({ changes: { from: 5, insert: '!' } }))

    expect(onChange).toHaveBeenCalledWith('start!')
    expect(onMount).toHaveBeenCalledTimes(1)
    ui.cleanup()
  })

  it('checks JSON: valid says so, broken marks its line and names line, column and reason', () => {
    const checks: JsonCheck[] = []
    const ui = mount(<CodeEditor language="json" value={'{\n  "a": 1\n}'} onCheck={(c) => checks.push(c)} />)
    expect(ui.status()).toBe('Valid JSON')
    expect(ui.host.querySelector('.cm-fault')).toBeNull()

    ui.render(<CodeEditor language="json" value={'{\n  "a": 1\n  "b": 2\n}'} onCheck={(c) => checks.push(c)} />)

    expect(ui.status()).toBe("Line 3, column 3: Expected ',' or '}' after property value, found character '\"'")
    const lines = ui.host.querySelectorAll('.cm-line')
    expect(lines[2]?.classList.contains('cm-fault')).toBe(true)
    expect(ui.host.querySelector('.cm-fault-at')?.textContent).toBe('"')
    expect(checks.at(-1)).toMatchObject({ kind: 'error', line: 3, column: 3 })
    ui.cleanup()
  })

  it('passes plain text when allowText says it may, and still holds an object to JSON', () => {
    const ui = mount(<CodeEditor language="json" allowText value="customer says hi" />)
    expect(ui.status()).toBe('Plain text')
    ui.render(<CodeEditor language="json" allowText value="{ customer: 1 }" />)
    expect(ui.status()).toMatch(/^Line 1, column 3: Expected a double-quoted property name/)
    ui.cleanup()
  })

  it('formats valid JSON from the toolbar, and offers nothing to format when it is broken', () => {
    const onChange = vi.fn()
    const ui = mount(<CodeEditor language="json" defaultValue='{"a":[1,2]}' onChange={onChange} />)
    const button = ui.slot('code-editor-format-button') as HTMLButtonElement

    act(() => button.click())

    expect(onChange).toHaveBeenLastCalledWith('{\n  "a": [\n    1,\n    2\n  ]\n}')
    expect(ui.host.querySelectorAll('.cm-line')).toHaveLength(6)
    ui.cleanup()

    const broken = mount(<CodeEditor language="json" defaultValue='{"a":' />)
    expect(broken.slot('code-editor-format-button')?.getAttribute('aria-disabled')).toBe('true')
    broken.cleanup()
  })

  it('follows its text between the bounds, and a fixed height overrides them', () => {
    const ui = mount(<CodeEditor defaultValue="x" minHeight={80} maxHeight={300} />)
    expect(ui.editor()?.style.minHeight).toBe('80px')
    expect(ui.editor()?.style.maxHeight).toBe('300px')
    expect(ui.editor()?.style.height).toBe('')
    ui.cleanup()

    const fixed = mount(<CodeEditor defaultValue="x" height="100%" />)
    expect(fixed.editor()?.style.height).toBe('100%')
    expect(fixed.editor()?.style.maxHeight).toBe('')
    expect(fixed.slot('code-editor-footer')).toBeNull()
    fixed.cleanup()
  })

  it('resizes from the footer by keyboard, past the cap, and hands the height back on a double-click', () => {
    const ui = mount(<CodeEditor language="json" defaultValue="{}" minHeight={80} maxHeight={120} />)
    const footer = ui.slot('code-editor-footer')
    const grip = ui.slot('code-editor-resize')
    expect(grip?.getAttribute('role')).toBe('separator')
    expect(grip?.getAttribute('aria-valuetext')).toBe('Fits its text')
    // The status is read, not swallowed by the separator.
    expect(grip?.contains(ui.slot('code-editor-status'))).toBe(false)
    expect(footer?.getAttribute('style')).toMatch(/touch-action:\s*none/)

    // jsdom measures every box at 0, so the first step lands on the floor.
    press(grip, { key: 'ArrowDown' })
    expect(ui.editor()?.style.height).toBe('80px')
    expect(ui.editor()?.style.maxHeight).toBe('')

    vi.spyOn(ui.editor()!, 'getBoundingClientRect').mockReturnValue({ height: 140 } as DOMRect)
    press(grip, { key: 'ArrowDown' })
    expect(ui.editor()?.style.height).toBe('164px')
    expect(grip?.getAttribute('aria-valuenow')).toBe('164')

    act(() => {
      footer?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
    })
    expect(ui.editor()?.style.height).toBe('')
    expect(ui.editor()?.style.maxHeight).toBe('120px')
    ui.cleanup()
  })

  it('copies the current text and reports it, briefly', async () => {
    vi.useFakeTimers()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    const ui = mount(<CodeEditor defaultValue="copy me" />)
    const button = ui.slot('code-editor-copy-button') as HTMLButtonElement

    await act(async () => {
      button.click()
      await Promise.resolve()
    })
    expect(writeText).toHaveBeenCalledWith('copy me')
    expect(toast.success).toHaveBeenCalledWith('Code copied to clipboard')
    expect(button.textContent).toContain('Copied!')

    await act(async () => {
      vi.advanceTimersByTime(2000)
    })
    expect(button.textContent).not.toContain('Copied!')
    ui.cleanup()
    vi.useRealTimers()
  })

  it('says so when the clipboard refuses', async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } })
    const ui = mount(<CodeEditor defaultValue="copy me" />)

    await act(async () => {
      ;(ui.slot('code-editor-copy-button') as HTMLButtonElement).click()
      await Promise.resolve()
    })
    expect(toast.error).toHaveBeenCalledWith('Failed to copy code')
    ui.cleanup()
  })
})
