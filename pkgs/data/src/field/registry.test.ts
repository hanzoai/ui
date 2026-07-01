import { test, expect, describe } from 'bun:test'
import {
  registerField,
  getFieldRenderers,
  hasField,
  registeredFieldTypes,
} from './registry'
import type { FieldType } from './types'

// The registry is the dispatch core: a FieldType → its renderers. Pure (a Map +
// functions, type-only imports) so it tests without pulling @hanzo/gui. Proves
// register / retrieve / override / read-only-omits-Input / enumeration.

const disp = () => null
const input = () => null

describe('field registry', () => {
  test('register then retrieve Display + Input', () => {
    registerField('text', { Display: disp, Input: input })
    const r = getFieldRenderers('text')
    expect(r?.Display).toBe(disp)
    expect(r?.Input).toBe(input)
    expect(hasField('text')).toBe(true)
  })

  test('a read-only type registers with no Input', () => {
    registerField('uuid', { Display: disp })
    const r = getFieldRenderers('uuid')
    expect(r?.Display).toBe(disp)
    expect(r?.Input).toBeUndefined()
  })

  test('an unregistered type resolves to undefined (safe fallback)', () => {
    expect(hasField('totally-unknown' as FieldType)).toBe(false)
    expect(getFieldRenderers('totally-unknown' as FieldType)).toBeUndefined()
  })

  test('re-registering overrides (last wins) — open/closed extension', () => {
    const first = () => null
    const second = () => null
    registerField('number', { Display: first })
    expect(getFieldRenderers('number')?.Display).toBe(first)
    registerField('number', { Display: second })
    expect(getFieldRenderers('number')?.Display).toBe(second)
  })

  test('registeredFieldTypes enumerates what was registered', () => {
    registerField('email', { Display: disp })
    registerField('currency', { Display: disp, Input: input })
    const types = registeredFieldTypes()
    expect(types).toContain('email')
    expect(types).toContain('currency')
    // No duplicates — it's a Map keyed by type.
    expect(new Set(types).size).toBe(types.length)
  })
})
