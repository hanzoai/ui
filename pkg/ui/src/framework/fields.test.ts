import { describe, it, expect } from 'vitest'
import type { DocType, FrameworkDoc } from './types'
import {
  autonameSource,
  cardFields,
  docTypeToFields,
  enrichLinks,
  hasProjectField,
  humanize,
  isDraft,
  isMediaDoctype,
  isValidDoctypeName,
  listedFieldNames,
  listHiddenFields,
  mediaDocPayload,
  mediaFileField,
  moduleDoctypes,
  PROJECT_FIELD,
  savePayload,
  slugify,
  statusField,
  titleOf,
  toRecord,
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
    expect(byName.richbody.type).toBe('richText')
  })

  it('carries select options, the currency code, and the relation target', () => {
    const byName = Object.fromEntries(docTypeToFields(page).map((f) => [f.name, f]))
    expect(byName.status.metadata).toEqual({
      options: [
        { value: 'Draft', label: 'Draft' },
        { value: 'Published', label: 'Published' },
      ],
    })
    expect(byName.price.metadata).toEqual({ currencyCode: 'USD' })
    expect(byName.author.metadata).toEqual({ objectName: 'Author' })
  })

  it('drops hidden fields', () => {
    expect(docTypeToFields(page).find((f) => f.name === 'internal')).toBeUndefined()
  })

  it('makes the autoname source read-only ONLY when editing (immutable URL key)', () => {
    expect(docTypeToFields(page).find((f) => f.name === 'slug')?.readOnly).toBeUndefined()
    expect(docTypeToFields(page, { editing: true }).find((f) => f.name === 'slug')?.readOnly).toBe(true)
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

  it('a DocType that flags NO list columns hides nothing (every field is a column)', () => {
    const flat: DocType = {
      name: 'Flat',
      fields: [
        { fieldname: 'a', fieldtype: 'Data' },
        { fieldname: 'b', fieldtype: 'Data' },
      ],
    }
    expect(listHiddenFields(flat)).toEqual([])
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

describe('cardFields — what a PHONE card shows', () => {
  const fields = docTypeToFields(page)

  it('is the declared list projection, minus the title the card already draws', () => {
    expect(listedFieldNames(page)).toEqual(['title', 'slug', 'status'])
    expect(cardFields(page, fields).map((f) => f.name)).toEqual(['slug', 'status'])
  })

  it('falls back to the visible fields when the DocType declares no list columns', () => {
    const flat: DocType = {
      name: 'Flat',
      titleField: 'a',
      fields: [
        { fieldname: 'a', fieldtype: 'Data' },
        { fieldname: 'b', fieldtype: 'Data' },
        { fieldname: 'c', fieldtype: 'Data' },
      ],
    }
    expect(cardFields(flat, docTypeToFields(flat)).map((f) => f.name)).toEqual(['b', 'c'])
  })

  it('caps the card body — a card is a summary, not the record', () => {
    const wide: DocType = {
      name: 'Wide',
      fields: Array.from({ length: 12 }, (_, i) => ({ fieldname: `f${i}`, fieldtype: 'Data' as const })),
    }
    expect(cardFields(wide, docTypeToFields(wide))).toHaveLength(4)
    expect(cardFields(wide, docTypeToFields(wide), 2)).toHaveLength(2)
  })
})

describe('mediaDocPayload — metadata-driven, not the CMS Media schema', () => {
  const facts = {
    fileRef: 's3://cms-media/cat-abc.png',
    filename: 'cat.png',
    mime: 'image/png',
    size: 1234,
    width: 800,
    height: 600,
  }

  it('writes the file, the DocType’s OWN title field, and every declared fact', () => {
    const cmsMedia: DocType = {
      name: 'Media',
      titleField: 'title',
      fields: [
        { fieldname: 'title', fieldtype: 'Data' },
        { fieldname: 'file', fieldtype: 'Attach', reqd: true },
        { fieldname: 'mime', fieldtype: 'Data' },
        { fieldname: 'size', fieldtype: 'Int' },
        { fieldname: 'width', fieldtype: 'Int' },
        { fieldname: 'height', fieldtype: 'Int' },
      ],
    }
    expect(mediaDocPayload(cmsMedia, facts)).toEqual({
      file: facts.fileRef,
      title: 'cat.png',
      mime: 'image/png',
      size: 1234,
      width: 800,
      height: 600,
    })
  })

  it('honours a DocType that labels its rows something other than "title"', () => {
    const dam: DocType = {
      name: 'Asset',
      titleField: 'caption',
      fields: [
        { fieldname: 'caption', fieldtype: 'Data' },
        { fieldname: 'blob', fieldtype: 'Attach', reqd: true },
      ],
    }
    // The old hardcoded body wrote `title`, which the engine drops as unknown —
    // producing silently untitled rows. This writes the field that exists.
    expect(mediaDocPayload(dam, facts)).toEqual({ blob: facts.fileRef, caption: 'cat.png' })
  })

  it('never ships a key the DocType has nowhere to put', () => {
    const minimal: DocType = { name: 'File', fields: [{ fieldname: 'file', fieldtype: 'Attach', reqd: true }] }
    expect(mediaDocPayload(minimal, facts)).toEqual({ file: facts.fileRef })
  })
})

describe('isDraft — the engine’s edit/delete precondition', () => {
  it('is true only for docstatus 0', () => {
    expect(isDraft({ docstatus: 0 })).toBe(true)
    expect(isDraft({ docstatus: 1 })).toBe(false)
    expect(isDraft({ docstatus: 2 })).toBe(false)
  })
  it('treats a missing docstatus as a draft (a non-submittable DocType)', () => {
    expect(isDraft({})).toBe(true)
    expect(isDraft(null)).toBe(true)
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
    const out = savePayload(
      { title: 'About', slug: 'About Us', active: true, price: { amount: 5, currencyCode: 'USD' } },
      page,
    )
    expect(out.slug).toBe('about-us') // slugified → URL-safe name
    expect(out.active).toBe(true)
    expect(out.price).toBe(5)
    expect(out.body).toBeUndefined() // not in the draft → not sent
  })

  it('drops engine read-only fields', () => {
    const dt: DocType = {
      name: 'X',
      fields: [
        { fieldname: 'a', fieldtype: 'Data' },
        { fieldname: 'ro', fieldtype: 'Data', readOnly: true },
      ],
    }
    const out = savePayload({ a: 'keep', ro: 'drop' }, dt)
    expect(out).toEqual({ a: 'keep' })
  })

  it('extracts the id from a Link value (enriched object OR plain id OR cleared)', () => {
    expect(savePayload({ author: { id: 'ada', label: 'Ada Lovelace' } }, page).author).toBe('ada')
    expect(savePayload({ author: 'ada' }, page).author).toBe('ada')
    expect(savePayload({ author: null }, page).author).toBe('')
  })
})

describe('enrichLinks — relation shows a human label', () => {
  it('replaces a Link id with {id,label} from the loaded options', () => {
    const rec = { name: 'p1', author: 'ada' }
    const out = enrichLinks(rec, page, { author: [{ value: 'ada', label: 'Ada Lovelace' }] })
    expect(out.author).toEqual({ id: 'ada', label: 'Ada Lovelace' })
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
    expect(savePayload({ richbody: lex }, page).richbody).toBe(lex)
  })
})
