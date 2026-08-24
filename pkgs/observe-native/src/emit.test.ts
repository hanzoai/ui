import { describe as group, expect, it, vi } from 'vitest'
import { Stream } from '@hanzo/observe'
import type { Interaction } from '@hanzo/observe'
import type { Analytics } from '@hanzo/event'
import { emit } from './emit'
import { leafNode, scopeNode } from './semantic'

function fakeClient() {
  return { capture: vi.fn(), pageview: vi.fn() }
}

const scope = [scopeNode({ name: 'Dashboard' }), scopeNode({ name: 'UserCard' })]

group('emit', () => {
  it('emits a canonical event through the client with the shared wire shape', () => {
    const client = fakeClient()
    const stream = new Stream<Interaction>()
    emit(client as unknown as Analytics, stream, {
      kind: 'click',
      name: '$click',
      scope,
      leaf: leafNode({ name: 'SaveButton', testid: 'save' }, 'button'),
    })
    expect(client.capture).toHaveBeenCalledTimes(1)
    const [name, props] = client.capture.mock.calls[0]
    expect(name).toBe('$click')
    // The leaf carries a testid, so the label keeps it. `labelOf` used to drop
    // the qualifier whenever a component name was present; it stopped once
    // `data-slot` made those names universal in production, and this binding
    // reads the same `labelFor` from @hanzo/observe that web does — one label,
    // so a tap and a click group together.
    expect(props.$el).toBe('Dashboard/UserCard/SaveButton[save]')
    expect(props.$component).toBe('SaveButton')
    expect(props.$testid).toBe('save')
    expect(props.$path).toEqual(['Dashboard', 'UserCard', 'SaveButton'])
  })

  it('mirrors the interaction into the stream', () => {
    const client = fakeClient()
    const stream = new Stream<Interaction>()
    emit(client as unknown as Analytics, stream, { kind: 'click', name: '$click', scope, leaf: leafNode({ name: 'X' }, 'button') })
    expect(stream.buffer()).toHaveLength(1)
    expect(stream.buffer()[0].semantic.label).toBe('Dashboard/UserCard/X')
  })

  it('routes a nav to pageview, not capture', () => {
    const client = fakeClient()
    emit(client as unknown as Analytics, null, {
      kind: 'nav',
      name: '$pageview',
      scope: [],
      leaf: leafNode({ name: 'Home' }, 'screen'),
      props: { path: 'Home' },
    })
    expect(client.pageview).toHaveBeenCalledWith('Home')
    expect(client.capture).not.toHaveBeenCalled()
  })

  it('is fail-soft: a throwing client never surfaces', () => {
    const client = { capture: () => { throw new Error('boom') }, pageview: () => {} }
    expect(() =>
      emit(client as unknown as Analytics, null, { kind: 'click', name: '$click', scope, leaf: leafNode({ name: 'X' }, 'button') }),
    ).not.toThrow()
  })

  it('works without a client or stream (returns the interaction)', () => {
    const i = emit(null, null, { kind: 'click', name: '$click', scope, leaf: leafNode({ name: 'X' }, 'button') })
    expect(i.name).toBe('$click')
    expect(i.semantic.label).toBe('Dashboard/UserCard/X')
  })
})
