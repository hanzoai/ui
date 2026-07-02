import { test, expect, describe, mock } from 'bun:test'
import {
  registerField,
  getFieldRenderers,
  hasField,
  registeredFieldTypes,
} from './registry'
import type { FieldType } from './types'

// @hanzo/gui is a runtime peer (resolves only in a consuming app), so stub it
// here — the CRM-editability tests only need registerDefaults to WIRE the
// renderers into the registry, not to render them.
const guiStub = () => null
mock.module('@hanzo/gui', () => ({
  Button: guiStub, Input: guiStub, Text: guiStub, XStack: guiStub, YStack: guiStub,
  Stack: guiStub, View: guiStub, styled: (c: unknown) => c,
}))

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

describe('default renderers — CRM editability', () => {
  test('every non-system field type is now EDITABLE (has an Input)', async () => {
    const { registerDefaultFields } = await import('./registerDefaults')
    registerDefaultFields()
    // The full set that a CRM/CMS record form must be able to edit.
    const editable: FieldType[] = [
      'text', 'longText', 'richText', 'number', 'percent', 'currency', 'boolean',
      'select', 'multiSelect', 'date', 'dateTime', 'email', 'url', 'phone', 'rating',
      'relation', 'files', 'links', 'json', 'fullName', 'address',
    ]
    for (const t of editable) {
      const r = getFieldRenderers(t)
      expect(r, `${t} must be registered`).toBeDefined()
      expect(r?.Display, `${t} needs a Display`).toBeDefined()
      expect(r?.Input, `${t} must be editable (Input)`).toBeDefined()
    }
  })

  test('system/read-only types render but are not directly editable', async () => {
    const { registerDefaultFields } = await import('./registerDefaults')
    registerDefaultFields()
    for (const t of ['uuid', 'position', 'actor'] as FieldType[]) {
      const r = getFieldRenderers(t)
      expect(r?.Display, `${t} needs a Display`).toBeDefined()
      expect(r?.Input, `${t} stays read-only`).toBeUndefined()
    }
  })
})
