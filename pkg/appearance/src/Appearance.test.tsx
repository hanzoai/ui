// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { Appearance } from './Appearance'
import { KEY } from './state'

/**
 * The panel, driven the way a person drives it.
 *
 * The unit tests prove the resolver; this proves the WIRING — that a click lands
 * in the layer the scope selector says it will, and that the document shows the
 * resolved stack rather than the layer being edited. Those are the two places
 * the scoping can be right in principle and wrong on screen.
 */
let root: Root
let host: HTMLDivElement

const render = (el: React.ReactElement) => {
  act(() => {
    root.render(el)
  })
}

const press = (label: string | RegExp) => {
  const match = typeof label === 'string' ? (t: string) => t === label : (t: string) => label.test(t)
  const btn = [...host.querySelectorAll('button')].find((b) => match(b.textContent?.trim() ?? ''))
  if (!btn) throw new Error(`no control labelled ${label} — saw: ${[...host.querySelectorAll('button')].map((b) => b.textContent).join(' | ')}`)
  act(() => {
    btn.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
}

const prop = (name: string) => document.documentElement.style.getPropertyValue(name)
const stored = (key: string) => JSON.parse(localStorage.getItem(key) || '{}')

/**
 * The panel reads the GLOBAL store — it takes no store prop, because a settings
 * panel has exactly one place to save to. jsdom gives this environment a
 * document but no `localStorage`, so the global is supplied here rather than
 * configured: an explicit Map-backed Storage is deterministic, is the same fake
 * `state.test.ts` already uses, and keeps this test from depending on how a
 * given jsdom happens to scope storage to an origin.
 */
const installStore = () => {
  const m = new Map<string, string>()
  const store: Storage = {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, String(v)),
    removeItem: (k) => void m.delete(k),
    clear: () => m.clear(),
    key: (i) => [...m.keys()][i] ?? null,
    get length() {
      return m.size
    },
  } as Storage
  Object.defineProperty(globalThis, 'localStorage', { value: store, configurable: true, writable: true })
  return store
}

beforeEach(() => {
  installStore()
  document.documentElement.removeAttribute('style')
  host = document.createElement('div')
  document.body.append(host)
  act(() => {
    root = createRoot(host)
  })
})

afterEach(() => {
  act(() => root.unmount())
  host.remove()
})

describe('the panel', () => {
  it('does not ask "applies to" when there is no org to apply to', () => {
    // A choice between one option and itself is noise.
    render(<Appearance />)
    expect(host.textContent).not.toContain('Applies to')
  })

  it('writes to the everywhere layer by default, and puts it on the document', () => {
    render(<Appearance />)
    press('Large')
    expect(stored(KEY)).toEqual({ type: 1.15 })
    expect(prop('--type-scale')).toBe('1.15')
  })

  it('sends a save to the org layer once the person scopes it there', () => {
    render(<Appearance org="acme" orgName="Acme" />)
    press('Only Acme')
    press('Airy')

    expect(stored(`${KEY}@acme`)).toEqual({ ratio: 1.2 })
    // The everywhere layer is untouched — that is the whole point of the choice.
    expect(localStorage.getItem(KEY)).toBeNull()
    expect(prop('--type-ratio')).toBe('1.2')
  })

  it('shows the RESOLVED stack, so an org accent survives a personal type change', () => {
    // The regression this catches: patching the resolved value back into the
    // person's own layer would copy the org's accent into it, and the person
    // would stop tracking the org from then on.
    render(<Appearance org="acme" orgName="Acme" orgPref={{ accent: '#ff5c00' }} />)
    press('Large')

    expect(prop('--accent')).toBe('#ff5c00')
    expect(prop('--type-scale')).toBe('1.15')
    expect(stored(KEY)).toEqual({ type: 1.15 })
    expect(stored(KEY).accent).toBeUndefined()
  })

  it('says where a value came from when it did not come from here', () => {
    render(<Appearance org="acme" orgName="Acme" orgPref={{ accent: '#ff5c00' }} />)
    expect(host.textContent).toContain('Set by Acme')
  })

  it('resets only the layer in scope, and the org shows through again', () => {
    render(<Appearance org="acme" orgName="Acme" orgPref={{ density: 'compact' }} />)
    press('Only Acme')
    press('Comfortable')
    expect(prop('--density')).toBe('1.15')

    press(/^Reset for Acme$/)
    expect(stored(`${KEY}@acme`)).toEqual({})
    // Back to what the org asked for — not to the system default.
    expect(prop('--density')).toBe('0.85')
  })

  it('leaves an untouched axis OFF the document rather than writing a neutral', () => {
    // An inline property outranks every stylesheet, so a neutral 1 written here
    // silently overrides a brand that published its own scale.
    render(<Appearance />)
    press('Large')
    expect(prop('--density')).toBe('')
    expect(prop('--type-ratio')).toBe('')
  })
})
