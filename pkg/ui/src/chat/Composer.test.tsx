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
import { audit } from '../../test/axe'
import { Composer, ComposerTool } from './Composer'

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

describe('the field is bounded at both ends', () => {
  /** gui compiles a style value to an atomic class, so the decision is legible
   *  in the class list. jsdom does no layout; the resulting height is measured
   *  in a browser. */
  const classes = () => field().className

  it('stands one line tall, not three', () => {
    // `Textarea` defaults to 64px, three lines of chrome for a composer.
    mount(<Composer value="" onChange={() => {}} onSend={() => {}} />)
    expect(classes()).toContain('_maxH-200px')
    expect(classes()).toContain('_minH-44px')
  })

  it('takes a ceiling, for a surface with a narrower frame', () => {
    mount(<Composer value="" onChange={() => {}} onSend={() => {}} maxHeight={110} />)
    expect(classes()).toContain('_maxH-110px')
  })
})

describe('the context row above and the controls below', () => {
  it('draws no wrapper when there is nothing above or below — the frame is the root', () => {
    mount(<Composer value="" onChange={() => {}} onSend={() => {}} />)
    const frame = host.querySelector('[data-slot="composer"]')!
    expect(host.querySelector('[data-slot="composer-shell"]')).toBeNull()
    // The provider's own wrapper is the only thing between host and frame.
    expect(frame.parentElement?.parentElement).toBe(host)
  })

  it('draws `head` above the frame and `foot` under it, outside the frame', () => {
    mount(
      <Composer
        value=""
        onChange={() => {}}
        onSend={() => {}}
        head={<span data-testid="chips">chips</span>}
        foot={<span data-testid="tools">tools</span>}
      />,
    )
    const shell = host.querySelector('[data-slot="composer-shell"]')!
    const parts = [...shell.children].map((c) => c.getAttribute('data-slot'))
    expect(parts).toEqual(['composer-head', 'composer', 'composer-foot'])
    const frame = host.querySelector('[data-slot="composer"]')!
    expect(frame.querySelector('[data-testid="chips"]')).toBeNull()
    expect(frame.querySelector('[data-testid="tools"]')).toBeNull()
  })
})

describe('the one-line frame', () => {
  it('puts the field and the send mark in one row inside the frame', () => {
    mount(<Composer inline value="hi" onChange={() => {}} onSend={() => {}} />)
    const frame = host.querySelector('[data-slot="composer"]')!
    const send = frame.querySelector('[data-slot="composer-send"]')!
    expect(send.parentElement).toBe(frame)
    expect(frame.contains(field())).toBe(true)
    expect(send.getAttribute('aria-label')).toBe('Send')
    expect(send.getAttribute('aria-disabled')).toBe('false')
  })

  it('keeps the Enter rule and the IME guard', () => {
    const onSend = vi.fn()
    mount(<Composer inline value="にほん" onChange={() => {}} onSend={onSend} />)
    expect(keydown('Enter', { isComposing: true })).toBe(false)
    expect(onSend).not.toHaveBeenCalled()
    expect(keydown('Enter')).toBe(true)
    expect(onSend).toHaveBeenCalledOnce()
  })

  it('sends from the mark by pointer and by keyboard, and not while empty', () => {
    const onSend = vi.fn()
    mount(<Composer inline value="" onChange={() => {}} onSend={onSend} />)
    const send = host.querySelector<HTMLElement>('[data-slot="composer-send"]')!
    expect(send.getAttribute('aria-disabled')).toBe('true')
    act(() => send.click())
    expect(onSend).not.toHaveBeenCalled()

    mount(<Composer inline value="go" onChange={() => {}} onSend={onSend} />)
    const live = host.querySelector<HTMLElement>('[data-slot="composer-send"]')!
    act(() => live.click())
    act(() => {
      live.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
    })
    expect(onSend).toHaveBeenCalledTimes(2)
  })

  it('becomes Stop while busy', () => {
    const onStop = vi.fn()
    mount(<Composer inline value="" busy onChange={() => {}} onSend={() => {}} onStop={onStop} />)
    const send = host.querySelector<HTMLElement>('[data-slot="composer-send"]')!
    expect(send.getAttribute('aria-label')).toBe('Stop')
    act(() => send.click())
    expect(onStop).toHaveBeenCalledOnce()
  })

  it('stands one line tall', () => {
    mount(<Composer inline value="" onChange={() => {}} onSend={() => {}} />)
    expect(field().className).toContain('_minH-38px')
  })
})

describe('ComposerTool', () => {
  it('is a named control that answers the keyboard', () => {
    const onPress = vi.fn()
    mount(<ComposerTool label="Attach" onPress={onPress} />)
    const tool = host.querySelector<HTMLElement>('[data-slot="composer-tool"]')!
    expect(tool.getAttribute('aria-label')).toBe('Attach')
    act(() => {
      tool.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
    })
    act(() => tool.click())
    expect(onPress).toHaveBeenCalledTimes(2)
  })

  it('says it opens a menu when it carries a caret', () => {
    mount(<ComposerTool label="Mode" text="Auto" caret />)
    const tool = host.querySelector<HTMLElement>('[data-slot="composer-tool"]')!
    expect(tool.getAttribute('aria-haspopup')).toBe('menu')
    expect(tool.textContent).toBe('Auto')
  })
})

describe('accessibility', () => {
  it('has no axe violations in either layout, with a head and a foot', async () => {
    mount(
      <Composer
        inline
        value="draft"
        onChange={() => {}}
        onSend={() => {}}
        label="Describe a task"
        head={<ComposerTool label="Environment" text="Default" />}
        foot={<ComposerTool label="Attach" />}
      />,
    )
    expect(await audit(host)).toEqual([])
    mount(<Composer value="draft" onChange={() => {}} onSend={() => {}} hint="Enter to send" />)
    expect(await audit(host)).toEqual([])
  })
})
