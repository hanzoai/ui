// @vitest-environment jsdom

/**
 * The Terminal's contract, asserted on a live DOM: typing a line and pressing
 * Enter runs a built-in or `onCommand`, arrow keys walk history, Tab completes,
 * and `clear` empties the history. Imports `./terminal` directly rather than
 * the backend barrel, the way `accordion.test.tsx` does.
 */
import { describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Terminal } from './terminal'

const wrap = (node: React.ReactNode) => (
  <GuiProvider config={config} defaultTheme="dark">
    {node}
  </GuiProvider>
)

const mount = (node: React.ReactNode) => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  act(() => root.render(wrap(node)))
  return {
    host,
    input: () => host.querySelector<HTMLInputElement>('[data-slot="terminal-input"]')!,
    commands: () => [...host.querySelectorAll<HTMLElement>('[data-slot="terminal-command"]')],
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

const type = (input: HTMLInputElement, value: string) => {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
  act(() => {
    setter.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

const press = (input: HTMLInputElement, key: string) => {
  act(() => {
    input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
  })
}

describe('Terminal', () => {
  it('renders the surface and a focusable input', () => {
    const view = mount(<Terminal />)

    expect(view.host.querySelector('[data-slot="terminal"]')).not.toBeNull()
    expect(view.host.querySelector('[data-slot="terminal-header"]')).not.toBeNull()
    expect(view.input()).not.toBeNull()
    expect(view.input().getAttribute('aria-label')).toBe('Terminal input')

    view.cleanup()
  })

  it('shows initial commands up front', () => {
    const view = mount(
      <Terminal
        initialCommands={[
          { id: '1', input: 'echo hi', output: 'hi', timestamp: new Date(), type: 'success' },
        ]}
      />,
    )

    expect(view.commands()).toHaveLength(1)
    expect(view.host.textContent).toContain('echo hi')
    expect(view.host.textContent).toContain('hi')

    view.cleanup()
  })

  it('runs a built-in echo and appends the line', async () => {
    const view = mount(<Terminal />)

    type(view.input(), 'echo hello world')
    press(view.input(), 'Enter')
    await act(async () => {})

    expect(view.commands()).toHaveLength(1)
    expect(view.host.textContent).toContain('hello world')
    expect(view.input().value).toBe('')

    view.cleanup()
  })

  it('clears the history on the clear built-in', async () => {
    const view = mount(<Terminal initialCommands={[
      { id: '1', input: 'echo hi', output: 'hi', timestamp: new Date() },
    ]} />)

    expect(view.commands()).toHaveLength(1)
    type(view.input(), 'clear')
    press(view.input(), 'Enter')
    await act(async () => {})

    expect(view.commands()).toHaveLength(0)

    view.cleanup()
  })

  it('routes unrecognised input through onCommand', async () => {
    const onCommand = vi.fn().mockResolvedValue('handled')
    const view = mount(<Terminal onCommand={onCommand} />)

    type(view.input(), 'hello')
    press(view.input(), 'Enter')
    await act(async () => {})
    await act(async () => {})

    expect(onCommand).toHaveBeenCalledWith('hello')
    expect(view.host.textContent).toContain('handled')

    view.cleanup()
  })

  it('reports a command not found without a handler', async () => {
    const view = mount(<Terminal />)

    type(view.input(), 'frobnicate')
    press(view.input(), 'Enter')
    await act(async () => {})

    expect(view.host.textContent).toContain('Command not found: frobnicate')

    view.cleanup()
  })

  it('walks command history with the arrow keys', async () => {
    const view = mount(<Terminal />)

    type(view.input(), 'echo one')
    press(view.input(), 'Enter')
    await act(async () => {})
    type(view.input(), 'echo two')
    press(view.input(), 'Enter')
    await act(async () => {})

    press(view.input(), 'ArrowUp')
    expect(view.input().value).toBe('echo two')
    press(view.input(), 'ArrowUp')
    expect(view.input().value).toBe('echo one')
    press(view.input(), 'ArrowDown')
    expect(view.input().value).toBe('echo two')

    view.cleanup()
  })

  it('completes a partial command on Tab', () => {
    const view = mount(<Terminal autoCompleteCommands={['whoami', 'whoareyou']} />)

    type(view.input(), 'who')
    press(view.input(), 'Tab')

    expect(view.input().value).toBe('whoami')

    view.cleanup()
  })

  it('does not offer history navigation when enableHistory is false', async () => {
    const view = mount(<Terminal enableHistory={false} />)

    type(view.input(), 'echo one')
    press(view.input(), 'Enter')
    await act(async () => {})

    press(view.input(), 'ArrowUp')
    expect(view.input().value).toBe('')

    view.cleanup()
  })

  it('accepts every documented theme', () => {
    for (const theme of ['dark', 'light', 'matrix', 'dracula'] as const) {
      const view = mount(<Terminal theme={theme} />)
      expect(view.host.querySelector('[data-theme]')?.getAttribute('data-theme')).toBe(theme)
      view.cleanup()
    }
  })
})
