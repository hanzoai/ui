import { describe, it, expect } from 'vitest'
import {
  BUILDER_FIELD_TYPES,
  fieldTypeLabel,
  fieldNeedsOptions,
  fieldNameFromLabel,
  blankField,
  starterFields,
  fieldsFromDocType,
  moveField,
  validateBuilder,
  toDocField,
  toDocType,
  type BuilderField,
} from './builder-logic'
import type { DocType } from './types'

const field = (over: Partial<BuilderField>): BuilderField => ({
  key: 'k', label: '', type: 'Data', required: false, inListView: false, options: '', ...over,
})

describe('builder-logic', () => {
  it('offers every framework fieldtype including RichText', () => {
    const types = BUILDER_FIELD_TYPES.map((t) => t.type)
    expect(types).toContain('RichText')
    expect(types).toContain('Data')
    expect(types).toContain('Select')
    expect(types).toContain('Link')
    // labels resolve
    expect(fieldTypeLabel('RichText')).toBe('Rich text')
    expect(fieldTypeLabel('Data')).toBe('Text')
  })

  it('knows which types need options', () => {
    expect(fieldNeedsOptions('Select')).toBe(true)
    expect(fieldNeedsOptions('Link')).toBe(true)
    expect(fieldNeedsOptions('Table')).toBe(true)
    expect(fieldNeedsOptions('Data')).toBe(false)
    expect(fieldNeedsOptions('RichText')).toBe(false)
  })

  it('derives an identifier-safe fieldname from a label', () => {
    expect(fieldNameFromLabel('First Name')).toBe('first_name')
    expect(fieldNameFromLabel('SEO Title')).toBe('seo_title')
    expect(fieldNameFromLabel('  Body  ')).toBe('body')
    expect(fieldNameFromLabel('2 cool')).toBe('f_2_cool') // no leading digit
    expect(fieldNameFromLabel('Prix (€)')).toBe('prix')
  })

  it('starter fields include Title/Slug/Body(RichText)/Status/Project', () => {
    const f = starterFields()
    const byLabel = Object.fromEntries(f.map((x) => [x.label, x]))
    expect(byLabel['Title'].required).toBe(true)
    expect(byLabel['Body'].type).toBe('RichText')
    expect(byLabel['Status'].type).toBe('Select')
    expect(byLabel['Project']).toBeTruthy()
    // unique client keys
    expect(new Set(f.map((x) => x.key)).size).toBe(f.length)
    expect(blankField('RichText').type).toBe('RichText')
  })

  it('validateBuilder rejects a bad name / no fields / dup / missing options', () => {
    expect(validateBuilder('', [field({ label: 'A' })]).formError).toBeTruthy()
    expect(validateBuilder('Bad Name', [field({ label: 'A' })]).formError).toBeTruthy()
    expect(validateBuilder('Ok', []).formError).toBeTruthy()

    const dup = validateBuilder('Ok', [field({ key: 'a', label: 'Name' }), field({ key: 'b', label: 'name' })])
    expect(dup.ok).toBe(false)
    expect(dup.fieldErrors['b']).toContain('Duplicate')

    const noOpts = validateBuilder('Ok', [field({ key: 's', label: 'Status', type: 'Select', options: '' })])
    expect(noOpts.fieldErrors['s']).toBeTruthy()

    const noTarget = validateBuilder('Ok', [field({ key: 'l', label: 'Author', type: 'Link', options: '' })])
    expect(noTarget.fieldErrors['l']).toBeTruthy()

    const blank = validateBuilder('Ok', [field({ key: 'x', label: '' })])
    expect(blank.fieldErrors['x']).toBeTruthy()
  })

  it('validateBuilder accepts a well-formed collection', () => {
    const v = validateBuilder('Recipe', [
      field({ key: 't', label: 'Title', required: true, inListView: true }),
      field({ key: 'b', label: 'Body', type: 'RichText' }),
      field({ key: 's', label: 'Status', type: 'Select', options: 'Draft\nPublished' }),
    ])
    expect(v.ok).toBe(true)
    expect(v.formError).toBeNull()
    expect(Object.keys(v.fieldErrors)).toHaveLength(0)
  })

  it('toDocField maps a row to a DocField, coercing options + flags', () => {
    const df = toDocField(field({ label: 'Body', type: 'RichText', required: true, inListView: true }))
    expect(df).toEqual({ fieldname: 'body', fieldtype: 'RichText', label: 'Body', reqd: true, inListView: true })

    const sel = toDocField(field({ label: 'Status', type: 'Select', options: ' Draft\nPublished ' }))
    expect(sel.options).toBe('Draft\nPublished')

    const plain = toDocField(field({ label: 'Tags', type: 'Data' }))
    expect(plain.reqd).toBeUndefined()
    expect(plain.options).toBeUndefined()
  })

  it('toDocType auto-derives autoname/titleField from slug+title', () => {
    const dt = toDocType('Article', 'cms', [
      field({ label: 'Title', required: true }),
      field({ label: 'Slug', required: true }),
      field({ label: 'Body', type: 'RichText' }),
    ])
    expect(dt.name).toBe('Article')
    expect(dt.module).toBe('cms')
    expect(dt.autoname).toBe('field:slug')
    expect(dt.titleField).toBe('title')
    expect(dt.fields.map((f) => f.fieldname)).toEqual(['title', 'slug', 'body'])
  })

  it('toDocType omits autoname/titleField when those fields are absent', () => {
    const dt = toDocType('Widget', 'cms', [field({ label: 'Code' })])
    expect(dt.autoname).toBeUndefined()
    expect(dt.titleField).toBeUndefined()
  })

  it('moveField swaps a row and is a no-op at either end', () => {
    const rows = [field({ key: 'a', label: 'A' }), field({ key: 'b', label: 'B' }), field({ key: 'c', label: 'C' })]
    expect(moveField(rows, 'b', -1).map((f) => f.key)).toEqual(['b', 'a', 'c'])
    expect(moveField(rows, 'b', 1).map((f) => f.key)).toEqual(['a', 'c', 'b'])
    expect(moveField(rows, 'a', -1)).toBe(rows) // same array back — nothing moved
    expect(moveField(rows, 'c', 1)).toBe(rows)
    expect(moveField(rows, 'nope', 1)).toBe(rows)
  })

  it('fieldsFromDocType round-trips an existing schema into editable rows', () => {
    const dt: DocType = {
      name: 'Article',
      module: 'cms',
      fields: [
        { fieldname: 'title', fieldtype: 'Data', label: 'Title', reqd: true, inListView: true },
        { fieldname: 'status', fieldtype: 'Select', options: 'Draft\nPublished' },
        { fieldname: 'no_label', fieldtype: 'Data' },
      ],
    }
    const rows = fieldsFromDocType(dt)
    expect(rows.map((r) => r.label)).toEqual(['Title', 'status', 'no_label'])
    expect(rows[0]).toMatchObject({ type: 'Data', required: true, inListView: true })
    expect(rows[1].options).toBe('Draft\nPublished')
    expect(new Set(rows.map((r) => r.key)).size).toBe(rows.length) // unique React keys
    // and back out again unchanged in substance
    expect(toDocType('Article', 'cms', rows).fields.map((f) => f.fieldname)).toEqual(['title', 'status', 'no_label'])
  })
})
