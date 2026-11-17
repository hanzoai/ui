import { describe, it, expect } from 'vitest'

import { baseCollectionToFields, type BaseCollection } from './fields'

/** A modern (`fields` key) collection over the given fields. */
const collection = (fields: BaseCollection['fields']): BaseCollection => ({ name: 'things', fields })

describe('baseCollectionToFields', () => {
  it('maps the scalar Base types to @hanzo/data types', () => {
    const fields = baseCollectionToFields(
      collection([
        { name: 'title', type: 'text' },
        { name: 'count', type: 'number' },
        { name: 'active', type: 'bool' },
        { name: 'contact', type: 'email' },
        { name: 'homepage', type: 'url' },
        { name: 'body', type: 'editor' },
        { name: 'blob', type: 'json' },
        { name: 'spot', type: 'geoPoint' },
      ]),
    )
    expect(fields.map((f) => [f.name, f.type])).toEqual([
      ['title', 'text'],
      ['count', 'number'],
      ['active', 'boolean'],
      ['contact', 'email'],
      ['homepage', 'url'],
      ['body', 'richText'],
      ['blob', 'json'],
      ['spot', 'json'],
    ])
  })

  it('maps date → date and autodate → a read-only dateTime', () => {
    const [due, created] = baseCollectionToFields(
      collection([
        { name: 'due', type: 'date' },
        { name: 'created', type: 'autodate' },
      ]),
    )
    expect(due).toMatchObject({ name: 'due', type: 'date' })
    expect(due.readOnly).toBeUndefined()
    expect(created).toMatchObject({ name: 'created', type: 'dateTime', readOnly: true })
  })

  it('maps a single select (maxSelect unset or 1) → `select` with options from values', () => {
    const [field] = baseCollectionToFields(
      collection([{ name: 'status', type: 'select', maxSelect: 1, values: ['open', 'closed'] }]),
    )
    expect(field.type).toBe('select')
    expect(field.metadata).toEqual({
      options: [
        { value: 'open', label: 'open' },
        { value: 'closed', label: 'closed' },
      ],
    })
  })

  it('maps a multi select (maxSelect > 1) → `multiSelect`', () => {
    const [field] = baseCollectionToFields(
      collection([{ name: 'tags', type: 'select', maxSelect: 3, values: ['a', 'b'] }]),
    )
    expect(field.type).toBe('multiSelect')
    expect(field.metadata).toEqual({
      options: [
        { value: 'a', label: 'a' },
        { value: 'b', label: 'b' },
      ],
    })
  })

  it('maps relation → relation and file → files', () => {
    const fields = baseCollectionToFields(
      collection([
        { name: 'author', type: 'relation', maxSelect: 1 },
        { name: 'attachments', type: 'file', maxSelect: 5 },
      ]),
    )
    expect(fields.map((f) => f.type)).toEqual(['relation', 'files'])
  })

  it('keeps `id` but skips other system fields and all hidden fields', () => {
    const fields = baseCollectionToFields(
      collection([
        { name: 'id', type: 'text', system: true },
        { name: 'tokenKey', type: 'text', system: true, hidden: true },
        { name: 'updated', type: 'autodate', system: true },
        { name: 'secret', type: 'text', hidden: true },
        { name: 'title', type: 'text' },
      ]),
    )
    expect(fields.map((f) => f.name)).toEqual(['id', 'title'])
  })

  it('marks the server-owned `id` field read-only, leaving user fields editable', () => {
    const [id, title] = baseCollectionToFields(
      collection([
        { name: 'id', type: 'text', system: true },
        { name: 'title', type: 'text' },
      ]),
    )
    expect(id).toMatchObject({ name: 'id', type: 'text', readOnly: true })
    expect(title.readOnly).toBeUndefined()
  })

  it('reads the legacy `schema` key and legacy nested `options`', () => {
    const legacy: BaseCollection = {
      name: 'legacy',
      schema: [{ name: 'priority', type: 'select', options: { maxSelect: 2, values: ['lo', 'hi'] } }],
    }
    const [field] = baseCollectionToFields(legacy)
    expect(field.type).toBe('multiSelect')
    expect(field.metadata).toEqual({
      options: [
        { value: 'lo', label: 'lo' },
        { value: 'hi', label: 'hi' },
      ],
    })
  })

  it('humanizes labels and upper-cases known acronyms', () => {
    const fields = baseCollectionToFields(
      collection([
        { name: 'firstName', type: 'text' },
        { name: 'avatar_url', type: 'url' },
        { name: 'id', type: 'text', system: true },
      ]),
    )
    expect(fields.map((f) => f.label)).toEqual(['First Name', 'Avatar URL', 'ID'])
  })

  it('falls back to json for an unknown/future field type', () => {
    const [field] = baseCollectionToFields(collection([{ name: 'weird', type: 'someFutureType' }]))
    expect(field.type).toBe('json')
  })

  it('is total — returns [] for an absent or empty schema', () => {
    expect(baseCollectionToFields(null)).toEqual([])
    expect(baseCollectionToFields(undefined)).toEqual([])
    expect(baseCollectionToFields({})).toEqual([])
    expect(baseCollectionToFields({ fields: [] })).toEqual([])
  })
})
