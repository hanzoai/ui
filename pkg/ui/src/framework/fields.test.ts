import { describe, it, expect } from 'vitest'
import type { DocType, FrameworkDoc } from './types'
import {
  docTypeToFields,
  statusField,
  listHiddenFields,
  isMediaDoctype,
  mediaFileField,
  moduleDoctypes,
  titleOf,
  slugify,
  isValidDoctypeName,
  toRecord,
  savePayload,
  autonameSource,
  humanize,
  enrichLinks,
  hasProjectField,
  PROJECT_FIELD,
} from './fields'

const page: DocType = {
  name: 'Page',
  module: 'cms',
  autoname: 'field:slug',
  titleField: 'title',
  fields: [
    { fieldname: 'title', fieldtype: 'Data', label: 'Title', reqd: true, inListView: true },
    { fieldname: 'slug', fieldtype: 'Data', reqd: true, inListView: true },
    { fieldname: 'body', fieldtype: 'Text' },
    { fieldname: 'richbody', fieldtype: 'RichText', label: 'Rich Body' },
    { fieldname: 'project', fieldtype: 'Data', label: 'Project' },
    { fieldname: 'status', fieldtype: 'Select', options: 'Draft\nPublished', default: 'Draft', inListView: true },
    { fieldname: 'author', fieldtype: 'Link', options: 'Author' },
    { fieldname: 'featured_image', fieldtype: 'Attach' },
    { fieldname: 'price', fieldtype: 'Currency' },
    { fieldname: 'active', fieldtype: 'Check' },
    { fieldname: 'when', fieldtype: 'Datetime' },
    { fieldname: 'secret', fieldtype: 'Password' },
    { fieldname: 'internal', fieldtype: 'Data', hidden: true },
  ],
}

describe('docTypeToFields — DocType metadata → @hanzo/data FieldDefinition[]', () => {
  it('maps every fieldtype to the right @hanzo/data type', () => {
    const byName = Object.fromEntries(docTypeToFields(page).map((f) => [f.name, f]))
    expect(byName.title.type).toBe('text')
    expect(byName.body.type).toBe('longText')
    expect(byName.status.type).toBe('select')
    expect(byName.author.type).toBe('relation')
    expect(byName.featured_image.type).toBe('url')
    expect(byName.price.type).toBe('currency')
    expect(byName.active.type).toBe('boolean')
    expect(byName.when.type).toBe('dateTime')
    expect(byName.secret.type).toBe('text')
    // RichText → the @hanzo/data richText renderer (the Lexical WYSIWYG).
    expect(byName.richbody.type).toBe('richText')
  })

  it('carries select options, the currency code, and the relation target', () => {
    const byName = Object.fromEntries(docTypeToFields(page).map((f) => [f.name, f]))
    expect(byName.status.metadata).toEqual({ options: [{ value: 'Draft', label: 'Draft' }, { value: 'Published', label: 'Published' }] })
    expect(byName.price.metadata).toEqual({ currencyCode: 'USD' })
    expect(byName.author.metadata).toEqual({ objectName: 'Author' })
  })

  it('drops hidden fields', () => {
    expect(docTypeToFields(page).find((f) => f.name === 'internal')).toBeUndefined()
  })

  it('makes the autoname source read-only ONLY when editing (immutable URL key)', () => {
    expect(docTypeToFields(page).find((f) => f.name === 'slug')?.readOnly).toBeUndefined()
    expect(docTypeToFields(page, { editing: true }).find((f) => f.name === 'slug')?.readOnly).toBe(true)
    // A non-autoname field stays editable while editing.
    expect(docTypeToFields(page, { editing: true }).find((f) => f.name === 'title')?.readOnly).toBeUndefined()
  })

  it('humanizes a missing label', () => {
    expect(docTypeToFields(page).find((f) => f.name === 'featured_image')?.label).toBe('Featured Image')
    expect(humanize('seo_title')).toBe('SEO Title')
  })
})

describe('publish + list + media helpers', () => {
  it('detects the publish status field', () => {
    expect(statusField(page)).toBe('status')
    expect(statusField({ name: 'X', fields: [{ fieldname: 'state', fieldtype: 'Select', options: 'A\nB' }] })).toBe('')
  })

  it('list columns are the inListView subset', () => {
    expect(listHiddenFields(page)).toContain('body')
    expect(listHiddenFields(page)).not.toContain('title')
  })

  it('recognizes a media doctype by a required Attach', () => {
    const media: DocType = { name: 'Media', fields: [{ fieldname: 'file', fieldtype: 'Attach', reqd: true }] }
    expect(isMediaDoctype(media)).toBe(true)
    expect(mediaFileField(media)).toBe('file')
    expect(isMediaDoctype(page)).toBe(false) // featured_image Attach is optional
  })

  it('filters doctypes by module', () => {
    const dts: DocType[] = [page, { name: 'Ticket', module: 'help', fields: [{ fieldname: 'x', fieldtype: 'Data' }] }]
    expect(moduleDoctypes(dts, 'cms').map((d) => d.name)).toEqual(['Page'])
  })

  it('titleOf uses titleField then name', () => {
    expect(titleOf({ title: 'Hello', name: 'hello' }, page)).toBe('Hello')
    expect(titleOf({ name: 'hello' }, page)).toBe('hello')
  })

  it('autonameSource extracts the field for a field: rule', () => {
    expect(autonameSource(page)).toBe('slug')
    expect(autonameSource({ name: 'X', autoname: 'hash', fields: [] })).toBe('')
  })
})

describe('slugify — URL-safe, space/%-free names', () => {
  it.each([
    ['About Us', 'about-us'],
    ['hello_world', 'hello-world'],
    ['  Trim  Me  ', 'trim-me'],
    ['Already-Slug', 'already-slug'],
    ['Ünïcode!!!', 'unicode'],
    ['!!!', ''],
    ['A/B\\C', 'a-b-c'],
  ])('%s → %s', (input, want) => {
    expect(slugify(input)).toBe(want)
  })

  it('validates doctype names (no spaces)', () => {
    expect(isValidDoctypeName('BlogPost')).toBe(true)
    expect(isValidDoctypeName('blog-post')).toBe(true)
    expect(isValidDoctypeName('Sales Invoice')).toBe(false)
    expect(isValidDoctypeName('')).toBe(false)
  })
})

describe('toRecord — framework doc → @hanzo/data record', () => {
  const doc: FrameworkDoc = {
    name: 'about-us',
    doctype: 'Page',
    docstatus: 0,
    createdAt: 1000,
    updatedAt: 2000,
    title: 'About',
    slug: 'about-us',
    status: 'Published',
    price: 9.99,
    active: 1,
    when: '2026-07-02 10:00:00',
    secret: '__set__',
  }
  const rec = toRecord(doc, page)

  it('sets id = name (the view key) and the envelope', () => {
    expect(rec.id).toBe('about-us')
    expect(rec.createdAt).toBe(1000 * 1000)
    expect(rec.docstatus).toBe(0)
  })
  it('coerces Check → boolean, Currency → {amount,currencyCode}, Datetime space→T', () => {
    expect(rec.active).toBe(true)
    expect(rec.price).toEqual({ amount: 9.99, currencyCode: 'USD' })
    expect(rec.when).toBe('2026-07-02T10:00:00')
  })
  it('NEVER surfaces the redacted Password marker', () => {
    expect(rec.secret).toBe('')
  })
})

describe('savePayload — draft → framework write body', () => {
  it('slugifies the autoname source, coerces, drops undefined', () => {
    const out = savePayload({ title: 'About', slug: 'About Us', active: true, price: { amount: 5, currencyCode: 'USD' } }, page)
    expect(out.slug).toBe('about-us') // slugified → URL-safe name
    expect(out.active).toBe(true)
    expect(out.price).toBe(5)
    expect(out.body).toBeUndefined() // not in the draft → not sent
  })

  it('drops engine read-only fields', () => {
    const dt: DocType = { name: 'X', fields: [{ fieldname: 'a', fieldtype: 'Data' }, { fieldname: 'ro', fieldtype: 'Data', readOnly: true }] }
    const out = savePayload({ a: 'keep', ro: 'drop' }, dt)
    expect(out).toEqual({ a: 'keep' })
  })

  it('extracts the id from a Link value (enriched object OR plain id OR cleared)', () => {
    expect(savePayload({ author: { id: 'ada', label: 'Ada Lovelace' } }, page).author).toBe('ada') // unedited enriched
    expect(savePayload({ author: 'ada' }, page).author).toBe('ada') // picker stored the id
    expect(savePayload({ author: null }, page).author).toBe('') // cleared → '' (engine treats as empty)
  })
})

describe('enrichLinks — relation shows a human label', () => {
  it('replaces a Link id with {id,label} from the loaded options', () => {
    const rec = { name: 'p1', author: 'ada' }
    const out = enrichLinks(rec, page, { author: [{ value: 'ada', label: 'Ada Lovelace' }] })
    expect(out.author).toEqual({ id: 'ada', label: 'Ada Lovelace' })
    // A round trip back through savePayload yields the id again.
    expect(savePayload(out, page).author).toBe('ada')
  })
  it('falls back to the raw id when the target is not in the options', () => {
    const out = enrichLinks({ author: 'ghost' }, page, { author: [] })
    expect(out.author).toEqual({ id: 'ghost', label: 'ghost' })
  })
  it('leaves an empty Link untouched', () => {
    expect(enrichLinks({ author: '' }, page, {}).author).toBe('')
  })
})

describe('project scope helpers', () => {
  it('hasProjectField detects the conventional project field', () => {
    expect(PROJECT_FIELD).toBe('project')
    expect(hasProjectField(page)).toBe(true)
    const noProject: DocType = { name: 'Widget', fields: [{ fieldname: 'code', fieldtype: 'Data' }] }
    expect(hasProjectField(noProject)).toBe(false)
  })

  it('a RichText body round-trips as a plain string through savePayload', () => {
    const lex = '{"root":{"children":[],"type":"root"}}'
    // richbody isn't readOnly, so it's written back verbatim (string passthrough).
    expect(savePayload({ richbody: lex }, page).richbody).toBe(lex)
  })
})
