import { describe, expect, it } from 'vitest'
import { baseCollectionToFields, fromBase, optionsOf, recordFromBase, toBase } from '../lib/base-data/fields'
import { plain, timelineFilter } from '../lib/crm'
import { cellText, companyKey, domainOf, fillEmpty, guessTarget, parseCsv, personId, plan, readRow, toCsv } from './csv'
import { importPeople, type Store } from './importer'
import { CUSTOMER_BY_HAND, OBJECTS, movedView, objectOf, openingView, starter, viewFits } from './objects'
import { shape } from './schema'

/** The people collection as module crm declares it (the fields the CRM reads). */
const PEOPLE = {
  name: 'people',
  fields: [
    { name: 'id', type: 'text', system: true },
    { name: 'name', type: 'fullName', label: 'Name', position: 1 },
    { name: 'emails', type: 'emails', label: 'Emails', position: 2 },
    { name: 'company', type: 'relation', label: 'Company', collectionId: 'hbc_1', maxSelect: 1, position: 5 },
    { name: 'type', type: 'select', label: 'Type', maxSelect: 1, values: ['prospect', 'investor'], options: [{ value: 'investor', label: 'Investor', color: 'purple' }], position: 8 },
    { name: 'consent', type: 'json', label: 'Consent', position: 12 },
    { name: 'created', type: 'autodate', label: 'Created', position: 20 },
  ],
}
const OPPS = {
  name: 'opportunities',
  fields: [
    { name: 'name', type: 'text', label: 'Name', position: 1 },
    { name: 'pipeline', type: 'select', maxSelect: 1, values: ['sales', 'fundraising'], position: 2 },
    {
      name: 'stage',
      type: 'select',
      maxSelect: 1,
      values: ['new', 'meeting', 'customer', 'intro', 'diligence', 'term_sheet', 'closed', 'lost'],
      options: [{ value: 'term_sheet', label: 'Term sheet', color: 'turquoise' }],
      position: 3,
    },
    { name: 'amount', type: 'currency', label: 'Amount', position: 4 },
  ],
}

describe('a Base schema as the table draws it', () => {
  it('takes the module label, the option labels and hues, and names a relation by its target', () => {
    const fields = baseCollectionToFields(PEOPLE, { names: new Map([['hbc_1', 'companies']]) })
    expect(fields.map((f) => [f.name, f.type, f.label])).toEqual([
      ['id', 'text', 'ID'],
      ['name', 'fullName', 'Name'],
      ['emails', 'email', 'Emails'],
      ['company', 'relation', 'Company'],
      ['type', 'select', 'Type'],
      ['consent', 'json', 'Consent'],
      ['created', 'dateTime', 'Created'],
    ])
    expect(fields.find((f) => f.name === 'company')!.metadata).toEqual({ objectName: 'companies', shape: 'square' })
    expect(optionsOf(PEOPLE.fields[4] as never)).toEqual([
      { value: 'prospect', label: 'prospect' },
      { value: 'investor', label: 'Investor', color: 'purple' },
    ])
  })

  it('draws a pipeline tab with its own stages, in order, and no pipeline column', () => {
    const s = shape(OBJECTS.fundraising, OPPS)
    expect(s.fields.map((f) => f.name)).toEqual(['name', 'stage', 'amount'])
    const stage = s.fields.find((f) => f.name === 'stage')!
    expect((stage.metadata as { options: { value: string; label: string; color?: string }[] }).options).toEqual([
      { value: 'intro', label: 'intro' },
      { value: 'meeting', label: 'meeting' },
      { value: 'diligence', label: 'diligence' },
      { value: 'term_sheet', label: 'Term sheet', color: 'teal' },
      { value: 'closed', label: 'closed' },
      { value: 'lost', label: 'lost' },
    ])
    expect(s.names.has('pipeline')).toBe(true)
  })
})

describe('values across the boundary', () => {
  it('reads money and links into @hanzo/data shapes, and writes them back', () => {
    expect(fromBase('currency', { amountMicros: 1_500_000_000_000, currencyCode: 'USD' })).toEqual({ amount: 1_500_000, currencyCode: 'USD' })
    expect(toBase('currency', { amount: 250000, currencyCode: 'USD' })).toEqual({ amountMicros: 250_000_000_000, currencyCode: 'USD' })
    expect(toBase('currency', 1200)).toEqual({ amountMicros: 1_200_000_000, currencyCode: 'USD' })
    expect(fromBase('links', { primaryLinkUrl: 'https://acme.test', primaryLinkLabel: '', secondaryLinks: [{ url: 'https://x.test' }] })).toEqual([
      { url: 'https://acme.test' },
      { url: 'https://x.test' },
    ])
    expect(toBase('links', [{ url: 'https://acme.test' }])).toEqual({ primaryLinkUrl: 'https://acme.test', primaryLinkLabel: '', secondaryLinks: [] })
  })

  it('keeps the parts an editor does not show', () => {
    expect(toBase('emails', 'NEW@acme.test', { primaryEmail: 'old@acme.test', additionalEmails: ['b@acme.test'] })).toEqual({
      primaryEmail: 'new@acme.test',
      additionalEmails: ['b@acme.test'],
    })
    expect(toBase('phones', { number: '555 0100' }, { primaryPhoneCountryCode: 'US', primaryPhoneCallingCode: '1' })).toEqual({
      primaryPhoneNumber: '555 0100',
      primaryPhoneCountryCode: 'US',
      primaryPhoneCallingCode: '1',
      additionalPhones: [],
    })
    expect(toBase('fullName', { first: 'Ada', last: 'Lovelace' })).toEqual({ firstName: 'Ada', lastName: 'Lovelace' })
    expect(toBase('fullName', 'Ada King Lovelace')).toEqual({ firstName: 'Ada', lastName: 'King Lovelace' })
    expect(toBase('date', '2026-10-30')).toBe('2026-10-30 00:00:00.000Z')
    expect(toBase('relation', { id: 'abc', name: 'Acme' })).toBe('abc')
  })

  it('reads a stamp the hosted Base writes as createdAt under the field the schema names created', () => {
    expect(recordFromBase([{ name: 'created', type: 'autodate' }], { id: 'p1', createdAt: '2026-10-30 10:00:00.000Z' })).toEqual({ id: 'p1', created: '2026-10-30 10:00:00.000Z' })
    expect(recordFromBase([{ name: 'created', type: 'autodate' }], { id: 'p1', created: '2026-10-29 10:00:00.000Z', createdAt: 'x' })).toEqual({ id: 'p1', created: '2026-10-29 10:00:00.000Z' })
  })

  it('reads an expanded relation as the record it names', () => {
    const r = recordFromBase([{ name: 'company', type: 'relation' }], { id: 'p1', company: 'c1', expand: { company: { id: 'c1', name: 'Acme' } } })
    expect(r).toEqual({ id: 'p1', company: { id: 'c1', name: 'Acme' } })
  })
})

describe('objects and their views', () => {
  it('lands an old address on what replaced it', () => {
    expect(objectOf('')?.id).toBe('people')
    expect(objectOf('leads')?.id).toBe('people')
    expect(objectOf('investors')?.id).toBe('fundraising')
    expect(objectOf('opportunities')?.id).toBe('deals')
    expect(objectOf('nonsense')).toBeNull()
  })

  it('opens /customers on the Customers view, not on everyone in People', () => {
    expect(objectOf('customers')?.id).toBe('people')
    expect(movedView('customers')).toBe('customers')
    expect(movedView('Customers')).toBe('customers')
    expect(movedView('leads')).toBeUndefined()
    const starters = OBJECTS.people.views.map((v) => ({ config: starter(OBJECTS.people, v) }))
    expect(openingView(starters, 'customers')?.config).toMatchObject({ id: 'starter:customers', filters: [{ field: 'type', op: 'is', value: 'customer' }] })
    expect(openingView(starters, null)?.config.id).toBe('starter:all')
    expect(openingView(starters, 'nonsense')?.config.id).toBe('starter:all')
    expect(openingView([], 'customers')).toBeUndefined()
  })

  it('says on the Customers view what makes a person a customer', () => {
    expect(OBJECTS.people.views.find((v) => v.id === 'customers')?.note).toBe(CUSTOMER_BY_HAND)
  })

  it('offers a starter view only when the CRM has its fields', () => {
    const investors = OBJECTS.people.views.find((v) => v.id === 'investors')!
    expect(viewFits(investors, new Set(['name', 'type', 'contacted']))).toBe(true)
    expect(viewFits(investors, new Set(['name']))).toBe(false)
    expect(starter(OBJECTS.fundraising, OBJECTS.fundraising.views[0])).toMatchObject({ kind: 'board', groupField: 'stage', pageSize: 50 })
  })
})

describe('CSV', () => {
  it('reads quotes, doubled quotes, CRLF and a BOM', () => {
    expect(parseCsv('﻿name,email\r\n"Lovelace, Ada","ada@x.test"\r\n"say ""hi""",b@x.test\n\n')).toEqual([
      ['name', 'email'],
      ['Lovelace, Ada', 'ada@x.test'],
      ['say "hi"', 'b@x.test'],
    ])
  })

  it('writes what a spreadsheet will not run as a formula', () => {
    expect(toCsv(['a', 'b'], [['=SUM(1)', 'x,y']])).toBe("a,b\r\n'=SUM(1),\"x,y\"\r\n")
  })

  it('names a column by its header', () => {
    expect(['Email Address', 'First Name', 'Company', 'Website', 'Title', 'Zip'].map((h) => guessTarget(h, 'people'))).toEqual(['email', 'firstName', 'company', 'domain', 'job_title', 'skip'])
    expect(guessTarget('Company', 'companies')).toBe('name')
  })

  it('writes a cell as a person reads it', () => {
    expect(cellText({ name: 'n', label: 'Name', type: 'fullName' }, { firstName: 'Ada', lastName: 'Lovelace' })).toBe('Ada Lovelace')
    expect(cellText({ name: 'e', label: 'E', type: 'email' }, { primaryEmail: 'a@x.test', additionalEmails: ['b@x.test'] })).toBe('a@x.test; b@x.test')
    expect(cellText({ name: 'a', label: 'A', type: 'currency' }, { amount: 1500, currencyCode: 'USD' })).toBe('1500 USD')
    expect(cellText({ name: 'c', label: 'C', type: 'relation' }, { id: 'c1', name: 'Acme' })).toBe('Acme')
    expect(cellText({ name: 't', label: 'T', type: 'select', metadata: { options: [{ value: 'term_sheet', label: 'Term sheet' }] } }, 'term_sheet')).toBe('Term sheet')
  })

  it('reads a domain from a website, an address or a bare name', () => {
    expect(['https://www.Acme.com/about', 'ada@acme.com', 'acme.com', ''].map(domainOf)).toEqual(['acme.com', 'acme.com', 'acme.com', ''])
  })
})

describe('an import plan', () => {
  const rows = [
    ['email', 'name', 'company'],
    ['Ada@Acme.test', 'Ada Lovelace', 'Acme'],
    ['ada@acme.test', '', 'Acme Corp'],
    ['grace@first.test', 'Grace Partner', ''],
    ['', 'No Address', 'X'],
    ['not-an-address', 'Bad', 'X'],
  ]
  const mapping = rows[0].map((h) => guessTarget(h, 'people'))
  const p = plan(rows.slice(1).map((r) => readRow(r, mapping)), 'people')

  it('is one person per address, a repeat merged, the unkeyed refused by line', () => {
    expect(p.rows.map((r) => r.key)).toEqual(['ada@acme.test', 'grace@first.test'])
    expect(p.merged).toBe(1)
    expect(p.rows[0].row.company).toBe('Acme')
    expect(p.invalid).toEqual([
      { line: 5, why: 'no email' },
      { line: 6, why: '"not-an-address" is not an email address' },
    ])
  })

  it('names a company by the domain a work address gives, never a free one', () => {
    expect(companyKey({ email: 'ada@acme.test', company: 'Acme' })).toEqual({ domain: 'acme.test', name: 'Acme' })
    expect(companyKey({ email: 'ada@gmail.com' })).toBeNull()
  })

  it('fills only what a held record lacks', () => {
    expect(fillEmpty({ job_title: 'CTO', name: { firstName: '', lastName: '' } }, { job_title: 'Engineer', name: { firstName: 'Ada', lastName: '' }, emails: { primaryEmail: 'x' } })).toEqual({
      name: { firstName: 'Ada', lastName: '' },
    })
  })

  it('derives a person id exactly as the cloud does', async () => {
    // cloud apps/crm personID: sha256("person\x00" + lower(address))[:15]
    expect(await personId(' Ada@Acme.test ')).toBe(await personId('ada@acme.test'))
    expect(await personId('ada@acme.test')).toMatch(/^[0-9a-f]{15}$/)
  })
})

describe('an import against the store', () => {
  /** A Base that answers filters by id and primary address, and counts every write. */
  function fake(held: Record<string, unknown>[]): Store & { writes: string[] } {
    const rows = new Map<string, Record<string, unknown>[]>([['people', held], ['companies', []], ['list_members', []]])
    const writes: string[] = []
    return {
      writes,
      list: async (c, q) => {
        const ids = [...q.filter.matchAll(/id = "([^"]+)"/g)].map((m) => m[1])
        const mails = [...q.filter.matchAll(/emails\.primaryEmail = "([^"]+)"/g)].map((m) => m[1])
        const names = [...q.filter.matchAll(/name = "([^"]+)"/g)].map((m) => m[1])
        return {
          items: (rows.get(c) ?? []).filter(
            (r) => ids.includes(String(r.id)) || mails.includes(String((r.emails as { primaryEmail?: string } | undefined)?.primaryEmail)) || names.includes(String(r.name)),
          ),
        }
      },
      create: async (c, b) => {
        if (b.id && (rows.get(c) ?? []).some((r) => r.id === b.id)) throw new Error('exists')
        writes.push(`create ${c} ${String(b.id ?? '')}`)
        rows.set(c, [...(rows.get(c) ?? []), b])
        return b
      },
      update: async (c, id, b) => {
        writes.push(`update ${c} ${id} ${Object.keys(b).join(',')}`)
        return { id, ...b }
      },
    }
  }

  it('makes each new person once, fills a held one, makes their company, and lists them', async () => {
    const ada = await personId('ada@acme.test')
    const store = fake([{ id: 'team0000000001', emails: { primaryEmail: 'grace@first.test' }, job_title: 'GP' }])
    const p = plan(
      [
        { email: 'ada@acme.test', name: 'Ada Lovelace', company: 'Acme' },
        { email: 'grace@first.test', name: 'Grace Partner', job_title: 'Partner' },
      ],
      'people',
    )
    let progress = 0
    const t = await importPeople(store, p, { type: 'investor', list: 'list1' }, (n) => (progress = n))
    // Acme by name, and first.test by Grace's work address: a person's company is the one their address names.
    expect(t).toMatchObject({ created: 1, updated: 1, unchanged: 0, companies: 2, listed: 2, failed: 0 })
    expect(progress).toBe(2)
    expect(store.writes).toContain(`create people ${ada}`)
    // Grace is the team's record (not the derived id): she gains a name and a type, and keeps her title.
    expect(store.writes).toContain('update people team0000000001 name,type,company')

    // The same file again changes nothing that exists.
    const again = await importPeople(store, p, { type: 'investor' }, () => {})
    expect(again).toMatchObject({ created: 0, companies: 0, failed: 0 })
  })
})

describe("a candidate's page (hanzo-inc/cloud#478)", () => {
  it('reads the timeline by the candidate, as it does a person', () => {
    expect(timelineFilter({ candidate: 'c1' })).toBe('candidate = "c1"')
    expect(timelineFilter({ person: 'p1' })).toBe('person = "p1"')
    expect(timelineFilter({ candidate: 'c"1' })).toBe('candidate = "c1"')
    expect(timelineFilter({ email: ' Ada@Acme.com ' })).toBe('data.to = "ada@acme.com"')
  })

  it('reads an editor field as the words it says, and writes its paragraphs back', () => {
    const background = "<p>I&#39;m a product designer and developer.</p><p>At Bitcoin.com, I lead a team<br>of five.</p>"
    const text = fromBase('editor', background)
    expect(text).toBe("I'm a product designer and developer.\n\nAt Bitcoin.com, I lead a team\nof five.")
    expect(toBase('editor', text)).toBe("<p>I'm a product designer and developer.</p><p>At Bitcoin.com, I lead a team<br>of five.</p>")
    expect(fromBase('editor', toBase('editor', text))).toBe(text)
    expect(toBase('editor', 'a < b & c')).toBe('<p>a &lt; b &amp; c</p>')
    expect(fromBase('editor', 'Plain words, no markup.')).toBe('Plain words, no markup.')
    expect(fromBase('editor', null)).toBe(null)
  })
})

describe('a mail on the timeline', () => {
  it('reads an HTML mail filed inside the editor as the words it said', () => {
    const filed = '<p>&lt;div style=&#34;font-family:sans-serif&#34;&gt;</p><p>&lt;p&gt;Thanks for applying.&lt;/p&gt;</p><p>&lt;p&gt;Your code &amp;amp; more.&lt;/p&gt;&lt;/div&gt;</p>'
    expect(plain(filed)).toBe('Thanks for applying.\nYour code & more.')
    expect(plain('<p>Hi Ada,</p><p>Two lines<br>here.</p>')).toBe('Hi Ada,\nTwo lines\nhere.')
  })
})
