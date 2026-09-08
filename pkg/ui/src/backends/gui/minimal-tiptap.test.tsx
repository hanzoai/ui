// @vitest-environment jsdom

import { act, createRef } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { MinimalTiptap } from './minimal-tiptap'

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean
}

let host: HTMLDivElement
let root: Root

const mount = (ui: React.ReactNode) => {
  act(() => {
    root.render(
      <GuiProvider config={config} defaultTheme="dark">
        {ui}
      </GuiProvider>,
    )
  })
}

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

describe('MinimalTiptap', () => {
  it('renders a textarea carrying its own slot', () => {
    mount(<MinimalTiptap value="" onChange={() => {}} />)
    const el = host.querySelector('textarea')
    expect(el).toBeInstanceOf(HTMLTextAreaElement)
    expect(el?.getAttribute('data-slot')).toBe('minimal-tiptap')
  })

  it('reports typed text through onChange as a plain string', () => {
    let got: string | undefined
    mount(<MinimalTiptap value="" onChange={(v: string) => { got = v }} />)
    const el = host.querySelector('textarea') as HTMLTextAreaElement
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')!.set!
    act(() => {
      setter.call(el, 'hello')
      el.dispatchEvent(new Event('input', { bubbles: true }))
    })
    expect(got).toBe('hello')
  })

  it('opens at the 200px floor by default', () => {
    mount(<MinimalTiptap value="" onChange={() => {}} />)
    const cls = host.querySelector('textarea')?.className ?? ''
    expect(cls).toContain('_minH-200px')
  })

  it('lets a caller override the floor', () => {
    mount(<MinimalTiptap value="" onChange={() => {}} minH={80} />)
    const cls = host.querySelector('textarea')?.className ?? ''
    expect(cls).toContain('_minH-80px')
    expect(cls).not.toContain('_minH-200px')
  })

  it('still hands the caller the ref it asked for', () => {
    const ref = createRef<HTMLTextAreaElement>()
    mount(<MinimalTiptap ref={ref} value="" onChange={() => {}} />)
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement)
  })

  it('forwards a placeholder like any other field', () => {
    mount(<MinimalTiptap value="" onChange={() => {}} placeholder="Write something…" />)
    const el = host.querySelector('textarea')
    expect(el?.getAttribute('placeholder')).toBe('Write something…')
  })
})
