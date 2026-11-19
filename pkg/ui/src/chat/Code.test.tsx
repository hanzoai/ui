// @vitest-environment jsdom

/** The code block's own controls: line numbers, word wrap, download, fold and hand-off. */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import config from '../gui-config'
import { ChatHandoffProvider, Code } from './Code'

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean
}

let host: HTMLDivElement
let root: Root

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})

afterEach(() => {
  act(() => root.unmount())
  host.remove()
})

const mount = (ui: React.ReactNode) =>
  act(() =>
    root.render(
      <GuiProvider config={config} defaultTheme="dark">
        {ui}
      </GuiProvider>,
    ),
  )
const press = (slot: string) => act(() => host.querySelector<HTMLElement>(`[data-slot="${slot}"]`)!.click())
const lines = (n: number) => Array.from({ length: n }, (_, i) => `line ${i + 1}`).join('\n')

describe('Code', () => {
  it('turns line numbers on and off', () => {
    mount(<Code language="ts" value={'a\nb'}>{'a\nb'}</Code>)
    const toggle = host.querySelector('[data-slot="code-lines-toggle"]')!
    expect(toggle.getAttribute('aria-pressed')).toBe('false')
    press('code-lines-toggle')
    expect(host.querySelector('[data-slot="code-lines-toggle"]')!.getAttribute('aria-pressed')).toBe('true')
    expect(host.textContent).toContain('2')
  })

  it('says whether it wraps', () => {
    mount(<Code value="x">x</Code>)
    expect(host.querySelector('[data-slot="code-wrap-toggle"]')!.getAttribute('aria-pressed')).toBe('false')
    press('code-wrap-toggle')
    expect(host.querySelector('[data-slot="code-wrap-toggle"]')!.getAttribute('aria-pressed')).toBe('true')
  })

  it('downloads the snippet with an extension from its language', () => {
    Object.assign(URL, { createObjectURL: () => 'blob:x', revokeObjectURL: () => {} })
    const names: string[] = []
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      names.push(this.download)
    })
    mount(<Code language="python" value="print(1)">print(1)</Code>)
    press('code-download')
    expect(names).toEqual(['snippet.py'])
    click.mockRestore()
  })

  it('folds a long block and opens it on demand', () => {
    mount(<Code value={lines(40)}>{lines(40)}</Code>)
    expect(host.textContent).not.toContain('line 40')
    press('code-fold')
    expect(host.textContent).toContain('line 40')
  })

  it('hands its code to Dev only where the surface provides the hand-off', () => {
    mount(<Code language="ts" value="x">x</Code>)
    expect(host.querySelector('[data-slot="code-open-in-dev"]')).toBeNull()
    const openInDev = vi.fn()
    mount(
      <ChatHandoffProvider value={{ openInDev }}>
        <Code language="ts" value="x">x</Code>
      </ChatHandoffProvider>,
    )
    press('code-open-in-dev')
    expect(openInDev).toHaveBeenCalledWith({ code: 'x', language: 'ts' })
  })
})
