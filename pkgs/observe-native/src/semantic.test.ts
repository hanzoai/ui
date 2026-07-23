import { describe as group, expect, it } from 'vitest'
import { buildSemantic, leafNode, redactText, scopeNode } from './semantic'

group('leafNode / scopeNode', () => {
  it('builds a leaf from explicit meta (name → component)', () => {
    expect(leafNode({ name: 'SaveButton', testid: 'save', kind: 'submit' }, 'button')).toEqual({
      tag: 'native',
      role: 'button',
      testid: 'save',
      component: 'SaveButton',
      kind: 'submit',
    })
    // default role applies when none is given
    expect(leafNode({}, 'textbox').role).toBe('textbox')
  })

  it('builds a scope node (default role group)', () => {
    expect(scopeNode({ name: 'Dashboard' })).toEqual({ tag: 'native', role: 'group', component: 'Dashboard' })
  })
})

group('buildSemantic', () => {
  it('composes the scope stack + leaf into the same shape as web, with a label', () => {
    const scope = [scopeNode({ name: 'Dashboard' }), scopeNode({ name: 'UserCard' })]
    const sem = buildSemantic(scope, leafNode({ name: 'SaveButton' }, 'button'))
    expect(sem['@type']).toBe('Interaction')
    expect(sem.label).toBe('Dashboard/UserCard/SaveButton')
    expect(sem.path).toHaveLength(3)
    expect(sem.target.component).toBe('SaveButton')
  })

  it('falls back to the role in the label when a node is unnamed', () => {
    const sem = buildSemantic([scopeNode({ name: 'Screen' })], leafNode({}, 'button'))
    expect(sem.label).toBe('Screen/button')
  })
})

group('redactText', () => {
  it('withholds the value by default, keeping kind + length', () => {
    expect(redactText('hello', { name: 'nickname', kind: 'text' })).toEqual({
      redacted: true,
      kind: 'text',
      length: 5,
    })
  })

  it('always withholds sensitive fields — by kind or by name — no length', () => {
    expect(redactText('hunter2', { kind: 'password' })).toEqual({ redacted: true, kind: 'password' })
    expect(redactText('4111', { name: 'cardNumber', kind: 'text' })).toEqual({ redacted: true, kind: 'text' })
    expect(redactText('a@b.com', { kind: 'email' }).length).toBeUndefined()
    expect(redactText('x', { name: 'q', secure: true }).length).toBeUndefined()
  })

  it('captures a bounded value only with masking off and a safe field', () => {
    expect(redactText('react hooks', { name: 'query', kind: 'text' }, { maskInput: false })).toEqual({
      redacted: false,
      kind: 'text',
      value: 'react hooks',
    })
    // still cannot expose a sensitive field
    expect(redactText('hunter2', { kind: 'password' }, { maskInput: false }).value).toBeUndefined()
  })
})
