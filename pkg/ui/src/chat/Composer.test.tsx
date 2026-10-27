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
import { writeComposing } from '@hanzo/appearance'

import { Composer } from './Composer'
import { ComposerStatusProvider } from './Status'

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
  writeComposing({})
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
    expect(classes()).toContain('_minH-26px')
  })

  it('takes a ceiling, for a surface with a narrower frame', () => {
    mount(<Composer value="" onChange={() => {}} onSend={() => {}} maxHeight={110} />)
    expect(classes()).toContain('_maxH-110px')
  })
})

describe('the slots', () => {
  it('draws `head` above the frame, `pills` inside it, and the chips under it', () => {
    mount(
      <Composer
        value=""
        onChange={() => {}}
        onSend={() => {}}
        head={<span data-testid="banner">banner</span>}
        pills={<span data-testid="pill">pill</span>}
        chips={[{ id: 'issues', label: 'Issues', onPress: () => {} }]}
      />,
    )
    const shell = host.querySelector('[data-slot="composer-shell"]')!
    const parts = [...shell.children].map((c) => c.getAttribute('data-slot'))
    expect(parts).toEqual(['composer-head', 'composer', 'composer-foot'])
    const frame = host.querySelector('[data-slot="composer"]')!
    expect(frame.querySelector('[data-testid="banner"]')).toBeNull()
    expect(frame.querySelector('[data-slot="composer-pills"] [data-testid="pill"]')).not.toBeNull()
    expect(host.querySelector('[data-slot="composer-foot"] [data-slot="composer-chip"]')?.textContent).toBe('Issues')
  })

  it('draws what the draft carries after `+`, each with its own remove', () => {
    const onRemove = vi.fn()
    mount(<Composer value="" onChange={() => {}} onSend={() => {}} carried={[{ id: 'f', label: 'notes.md', onRemove }]} />)
    const remove = host.querySelector<HTMLElement>('[data-slot="composer-carried"] [aria-label="Remove notes.md"]')!
    act(() => remove.click())
    expect(onRemove).toHaveBeenCalledOnce()
  })

  it('lists `/` shelves above the frame and picks the lit row on Enter', () => {
    const pick = vi.fn()
    const onChange = vi.fn()
    const onSend = vi.fn()
    mount(
      <Composer
        value="fix it /rev"
        onChange={onChange}
        onSend={onSend}
        slash={{ rows: [{ id: 'review', label: 'review' }, { id: 'plan', label: 'plan' }], pick }}
      />,
    )
    expect(host.querySelector('[data-slot="composer-head"] [data-slot="mention"]')).not.toBeNull()
    expect(keydown('Enter')).toBe(true)
    expect(pick).toHaveBeenCalledWith('review')
    expect(onChange).toHaveBeenCalledWith('fix it ')
    expect(onSend).not.toHaveBeenCalled()
  })
})

describe("the person's setting is the one every composer reads", () => {
  it('sends on Cmd/Ctrl+Enter only, once they chose it', () => {
    writeComposing({ send: 'mod' })
    const onSend = vi.fn()
    mount(<Composer value="hi" onChange={() => {}} onSend={onSend} />)
    expect(keydown('Enter')).toBe(false)
    expect(onSend).not.toHaveBeenCalled()
    expect(keydown('Enter', { metaKey: true })).toBe(true)
    expect(onSend).toHaveBeenCalledOnce()
  })

  it("takes the surface's default for an axis left on Auto, and the person's choice over it", () => {
    const chips = [{ id: 'auto', label: 'Auto', onPress: () => {} }]
    mount(<Composer value="" onChange={() => {}} onSend={() => {}} chips={chips} defaults={{ chips: false }} />)
    expect(host.querySelector('[data-slot="composer-chip"]')).toBeNull()
    act(() => writeComposing({ chips: true }))
    expect(host.querySelector('[data-slot="composer-chip"]')).not.toBeNull()
    act(() => writeComposing({ chips: false }))
    mount(<Composer value="" onChange={() => {}} onSend={() => {}} chips={chips} />)
    expect(host.querySelector('[data-slot="composer-chip"]')).toBeNull()
  })
})

describe('the model selector', () => {
  const mind = { model: 'enso-auto', models: [], loading: false, error: null, note: '', free: false, pick: () => {} }
  const effort = { value: 'auto', set: () => {}, items: [{ id: 'auto', label: 'Auto', note: 'Adaptive' }] }

  it('is not drawn until the person turns it on, and the effort always is', () => {
    mount(<Composer value="" onChange={() => {}} onSend={() => {}} mind={mind} effort={effort} />)
    expect(host.querySelector('[data-slot="mind"]')).toBeNull()
    expect(host.querySelector('[aria-label="Effort: Auto"]')).not.toBeNull()
    act(() => writeComposing({ model: true }))
    expect(host.querySelector('[data-slot="mind"]')).not.toBeNull()
  })
})

describe('the commands', () => {
  it('open from the field on Ctrl+K', () => {
    const run = vi.fn()
    mount(<Composer value="" onChange={() => {}} onSend={() => {}} commands={[{ id: 'run', label: 'Run', keys: '⌘↵', run }]} />)
    const chip = host.querySelector<HTMLElement>('[data-slot="chip-select"][aria-label="Commands"]')!
    expect(chip.getAttribute('aria-expanded')).toBe('false')
    expect(keydown('k', { ctrlKey: true })).toBe(true)
    expect(chip.getAttribute('aria-expanded')).toBe('true')
  })
})

describe('accessibility', () => {
  it('has no axe violations, with every slot drawn', async () => {
    mount(
      <Composer
        value="draft"
        onChange={() => {}}
        onSend={() => {}}
        label="Describe a task"
        head={<span>banner</span>}
        carried={[{ id: 'f', label: 'notes.md', onRemove: () => {} }]}
        chips={[{ id: 'issues', label: 'Issues', onPress: () => {} }]}
        commands={[{ id: 'run', label: 'Run', run: () => {} }]}
        mode={{ value: 'auto', set: () => {}, items: [{ id: 'auto', label: 'Auto', note: 'Runs on its own' }] }}
      />,
    )
    expect(await audit(host)).toEqual([])
    mount(<Composer value="draft" onChange={() => {}} onSend={() => {}} hint="Enter to send" />)
    expect(await audit(host)).toEqual([])
  })
})


describe('host account usage slot', () => {
  it('shows the inherited control and lets a surface replace or suppress it', () => {
    const props = { value: '', onChange: () => {}, onSend: () => {} }
    const inherited = <button type="button" data-usage="account">Usage</button>
    mount(<ComposerStatusProvider value={inherited}><Composer {...props} /></ComposerStatusProvider>)
    expect(host.querySelector('[data-usage="account"]')).not.toBeNull()
    mount(<ComposerStatusProvider value={inherited}><Composer {...props} status={<button data-usage="conversation">Context</button>} /></ComposerStatusProvider>)
    expect(host.querySelector('[data-usage="account"]')).toBeNull()
    expect(host.querySelector('[data-usage="conversation"]')).not.toBeNull()
    mount(<ComposerStatusProvider value={inherited}><Composer {...props} status={null} /></ComposerStatusProvider>)
    expect(host.querySelector('[data-usage]')).toBeNull()
  })
})
