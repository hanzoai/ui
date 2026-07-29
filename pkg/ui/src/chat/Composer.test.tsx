// @vitest-environment jsdom

/**
 * The composer's keyboard contract, against a live DOM.
 *
 * `send.test.ts` asserts the RULES and this asserts the WIRING, because the two
 * fail independently: `sends` can be perfectly correct while the field never
 * calls it. That is not hypothetical — the field is a `@hanzo/gui` `TextArea`,
 * and `onKeyDown` reaches the DOM only because gui forwards unknown props. A
 * refactor that stops forwarding, or that drops `keyCode` out of the `Mods` it
 * builds, leaves every pure test green and silently restores the bug this
 * module exists to end: an Enter that submits a half-typed word out from under
 * a Japanese, Chinese or Korean writer mid-candidate.
 *
 * So these mount the real component and dispatch real `keydown` events.
 */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import config from '../gui-config'
import { Composer } from './Composer'

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

const field = () => {
  const el = host.querySelector('textarea')
  if (!el) throw new Error('the composer rendered no textarea')
  return el
}

/** Dispatch a real keydown and report whether the composer claimed it. */
const keydown = (key: string, init: KeyboardEventInit = {}) => {
  const ev = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })
  act(() => {
    field().dispatchEvent(ev)
  })
  return ev.defaultPrevented
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

describe('the composer is wired to its own rules', () => {
  it('renders a real field and a labelled send control', () => {
    mount(<Composer value="" onChange={() => {}} onSend={() => {}} />)
    expect(field().getAttribute('data-slot')).toBe('composer-field')
    expect(field().getAttribute('placeholder')).toBe('Ask anything')
    expect(host.querySelector('[data-slot="composer-send"]')?.getAttribute('aria-label')).toBe('Send')
  })

  it('sends on a bare Enter, and swallows it so no newline lands', () => {
    const onSend = vi.fn()
    mount(<Composer value="hi" onChange={() => {}} onSend={onSend} />)
    expect(keydown('Enter')).toBe(true)
    expect(onSend).toHaveBeenCalledOnce()
  })

  // The bug. Every signal a browser uses to say "the IME owns this keystroke"
  // has to reach `sends` through the component, not just through the unit test.
  it.each([
    ['isComposing', { isComposing: true }],
    ["Safari's keyCode 229", { keyCode: 229 }],
  ])('leaves Enter to the IME (%s) and does not send', (_name, mods) => {
    const onSend = vi.fn()
    mount(<Composer value="にほん" onChange={() => {}} onSend={onSend} />)
    // Not prevented: the keystroke has to stay with the IME to accept the candidate.
    expect(keydown('Enter', mods)).toBe(false)
    expect(onSend).not.toHaveBeenCalled()
  })

  it('leaves the Process key to the IME', () => {
    const onSend = vi.fn()
    mount(<Composer value="にほん" onChange={() => {}} onSend={onSend} />)
    expect(keydown('Process', { keyCode: 229 })).toBe(false)
    expect(onSend).not.toHaveBeenCalled()
  })

  it('writes a newline on Shift+Enter rather than sending', () => {
    const onSend = vi.fn()
    mount(<Composer value="hi" onChange={() => {}} onSend={onSend} />)
    expect(keydown('Enter', { shiftKey: true })).toBe(false)
    expect(onSend).not.toHaveBeenCalled()
  })

  it('force-sends on Cmd/Ctrl+Enter, even with Shift held', () => {
    for (const mods of [{ metaKey: true }, { ctrlKey: true }, { metaKey: true, shiftKey: true }]) {
      const onSend = vi.fn()
      mount(<Composer value="hi" onChange={() => {}} onSend={onSend} />)
      expect(keydown('Enter', mods)).toBe(true)
      expect(onSend).toHaveBeenCalledOnce()
    }
  })

  it('swallows Enter but sends nothing when the draft is only whitespace', () => {
    const onSend = vi.fn()
    mount(<Composer value="   " onChange={() => {}} onSend={onSend} />)
    expect(keydown('Enter')).toBe(true)
    expect(onSend).not.toHaveBeenCalled()
  })

  it('sends nothing while a turn is in flight', () => {
    const onSend = vi.fn()
    mount(<Composer value="hi" busy onSend={onSend} onChange={() => {}} />)
    expect(onSend).not.toHaveBeenCalled()
    expect(keydown('Enter')).toBe(true)
    expect(onSend).not.toHaveBeenCalled()
  })

  it('turns the send control into stop while busy', () => {
    mount(<Composer value="hi" busy onSend={() => {}} onStop={() => {}} onChange={() => {}} />)
    expect(host.querySelector('[data-slot="composer-send"]')?.getAttribute('aria-label')).toBe('Stop')
  })
})
