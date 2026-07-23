import { afterEach, beforeEach, describe as group, expect, it, vi } from 'vitest'
import type { Analytics } from '@hanzo/event'
import { createObserver, observe, stopObserver, stream } from './index'

interface FakeClient {
  capture: ReturnType<typeof vi.fn>
  pageview: ReturnType<typeof vi.fn>
}

function fakeClient(): FakeClient {
  return { capture: vi.fn(), pageview: vi.fn() }
}

let client: FakeClient

beforeEach(() => {
  document.body.innerHTML = ''
  client = fakeClient()
})

afterEach(() => stopObserver())

group('createObserver', () => {
  it('captures interactions and emits them through the client', () => {
    document.body.innerHTML = '<button data-testid="save">Save</button>'
    createObserver(client as unknown as Analytics, { nav: false })
    document.querySelector('button')!.dispatchEvent(new Event('click', { bubbles: true }))

    expect(client.capture).toHaveBeenCalledTimes(1)
    const [name, props] = client.capture.mock.calls[0]
    expect(name).toBe('$click')
    expect(props.$el).toBe('button[save]')
    expect(props.$testid).toBe('save')
  })

  it('routes navigation to pageview', () => {
    createObserver(client as unknown as Analytics, { nav: true })
    history.pushState({}, '', '/pricing')
    expect(client.pageview).toHaveBeenCalledTimes(1)
    expect(client.capture).not.toHaveBeenCalled()
  })

  it('is idempotent — a second call replaces the first engine', () => {
    document.body.innerHTML = '<button>x</button>'
    createObserver(client as unknown as Analytics, { nav: false })
    const second = fakeClient()
    createObserver(second as unknown as Analytics, { nav: false })
    document.querySelector('button')!.dispatchEvent(new Event('click', { bubbles: true }))
    // only the live (second) engine emits
    expect(client.capture).not.toHaveBeenCalled()
    expect(second.capture).toHaveBeenCalledTimes(1)
  })

  it('stopObserver halts capture', () => {
    document.body.innerHTML = '<button>x</button>'
    createObserver(client as unknown as Analytics, { nav: false })
    stopObserver()
    document.querySelector('button')!.dispatchEvent(new Event('click', { bubbles: true }))
    expect(client.capture).not.toHaveBeenCalled()
  })
})

group('observe action', () => {
  it('stamps a stable component name the engine then labels with', () => {
    document.body.innerHTML = '<section><button>Save</button></section>'
    const section = document.querySelector('section')!
    const action = observe(section, { name: 'UserCard' })
    expect(section.getAttribute('data-hz-name')).toBe('UserCard')

    createObserver(client as unknown as Analytics, { nav: false })
    document.querySelector('button')!.dispatchEvent(new Event('click', { bubbles: true }))
    expect(client.capture.mock.calls[0][1].$el).toBe('UserCard/button[Save]')

    action.update({ name: 'Renamed' })
    expect(section.getAttribute('data-hz-name')).toBe('Renamed')
  })

  it('marks private subtrees and view targets', () => {
    const el = document.createElement('div')
    observe(el, { private: true, view: true })
    expect(el.hasAttribute('data-hz-private')).toBe(true)
    expect(el.hasAttribute('data-hz-view')).toBe(true)
    observe(el, {}).update({})
    // a fresh action with empty params clears nothing it didn't set; re-apply empty
    const a = observe(el, { private: true })
    a.update({})
    expect(el.hasAttribute('data-hz-private')).toBe(false)
  })
})

group('stream store', () => {
  it('exposes a live, rolling window of interactions (Svelte store contract)', () => {
    document.body.innerHTML = '<button>x</button>'
    createObserver(client as unknown as Analytics, { nav: false })
    const store = stream({ limit: 10 })

    const seen: number[] = []
    const unsub = store.subscribe((v) => seen.push(v.length))
    expect(seen).toEqual([0]) // synchronous initial call

    document.querySelector('button')!.dispatchEvent(new Event('click', { bubbles: true }))
    expect(seen[seen.length - 1]).toBe(1)
    unsub()
  })
})
