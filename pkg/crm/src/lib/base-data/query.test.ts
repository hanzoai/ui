import { describe, expect, it } from 'vitest'
import { baseQuery, lit, ruleFilter, searchFilter, sortOf } from './query'
import type { BaseField } from './fields'

/**
 * Every string here was run against a real Base with module crm installed and
 * seeded (hanzoai/base modules/crm, FindRecordsByFilter) and returned exactly the
 * records the rule names; this suite holds the compiler to those strings.
 */
const people: BaseField[] = [
  { name: 'name', type: 'fullName' },
  { name: 'emails', type: 'emails' },
  { name: 'phones', type: 'phones' },
  { name: 'job_title', type: 'text' },
  { name: 'company', type: 'relation', maxSelect: 1 },
  { name: 'address', type: 'address' },
  { name: 'linkedin', type: 'links' },
  { name: 'type', type: 'select', maxSelect: 1 },
  { name: 'outreach', type: 'select', maxSelect: 1 },
  { name: 'contacted', type: 'date' },
  { name: 'created', type: 'autodate' },
]
const deals: BaseField[] = [
  { name: 'name', type: 'text' },
  { name: 'stage', type: 'select', maxSelect: 1 },
  { name: 'amount', type: 'currency' },
  { name: 'close_date', type: 'date' },
  { name: 'company', type: 'relation', maxSelect: 1 },
  { name: 'contact', type: 'relation', maxSelect: 1 },
]
const f = (fields: BaseField[], name: string) => fields.find((x) => x.name === name)!

describe('a rule as a Base filter', () => {
  it('searches a composite part by part, never its JSON keys', () => {
    // `name ~ "first"` would read {"firstName":…} and find everyone.
    expect(ruleFilter(f(people, 'name'), { field: 'name', op: 'contains', value: 'first' })).toBe('(name.firstName ~ "first" || name.lastName ~ "first")')
    expect(ruleFilter(f(people, 'name'), { field: 'name', op: 'notContains', value: 'ada' })).toBe(
      '((name.firstName = null || name.firstName !~ "ada") && (name.lastName = null || name.lastName !~ "ada"))',
    )
  })

  it('compares a primary address exactly, lower-cased', () => {
    expect(ruleFilter(f(people, 'emails'), { field: 'emails', op: 'is', value: 'GRACE@First.test' })).toBe('emails.primaryEmail = "grace@first.test"')
  })

  it('reads an empty composite as NULL or a blank primary part', () => {
    expect(ruleFilter(f(people, 'emails'), { field: 'emails', op: 'isEmpty' })).toBe('(emails = null || emails.primaryEmail = "")')
    expect(ruleFilter(f(people, 'emails'), { field: 'emails', op: 'isNotEmpty' })).toBe('(emails != null && emails.primaryEmail != "")')
    expect(ruleFilter(f(people, 'address'), { field: 'address', op: 'isEmpty' })).toBe('address = null')
  })

  it('matches a select by value, any of several by or', () => {
    expect(ruleFilter(f(people, 'type'), { field: 'type', op: 'isAnyOf', value: ['investor', 'partner'] })).toBe('(type = "investor" || type = "partner")')
    expect(ruleFilter(f(people, 'type'), { field: 'type', op: 'isNot', value: 'investor' })).toBe('type != "investor"')
    expect(ruleFilter(f(people, 'type'), { field: 'type', op: 'isAnyOf', value: [] })).toBe('')
  })

  it('takes a calendar day whole, and "before" only a day that is set', () => {
    expect(ruleFilter(f(people, 'contacted'), { field: 'contacted', op: 'is', value: '2026-10-20' })).toBe(
      '(contacted >= "2026-10-20 00:00:00.000Z" && contacted <= "2026-10-20 23:59:59.999Z")',
    )
    expect(ruleFilter(f(people, 'contacted'), { field: 'contacted', op: 'between', value: ['2026-10-01', '2026-10-20'] })).toBe(
      '(contacted >= "2026-10-01 00:00:00.000Z" && contacted <= "2026-10-20 23:59:59.999Z")',
    )
    expect(ruleFilter(f(people, 'contacted'), { field: 'contacted', op: 'lt', value: '2026-10-20' })).toBe('(contacted != "" && contacted < "2026-10-20 00:00:00.000Z")')
    expect(ruleFilter(f(people, 'contacted'), { field: 'contacted', op: 'between', value: ['', '2026-10-01'] })).toBe('(contacted != "" && contacted <= "2026-10-01 23:59:59.999Z")')
    expect(ruleFilter(f(people, 'contacted'), { field: 'contacted', op: 'between', value: ['', ''] })).toBe('')
  })

  it('compares money by its micros, from a plain amount or a whole money value', () => {
    expect(ruleFilter(f(deals, 'amount'), { field: 'amount', op: 'between', value: [1000, 2000000] })).toBe('(amount.amountMicros >= 1000000000 && amount.amountMicros <= 2000000000000)')
    expect(ruleFilter(f(deals, 'amount'), { field: 'amount', op: 'gte', value: { amount: 1000000, currencyCode: 'USD' } })).toBe('amount.amountMicros >= 1000000000000')
    expect(ruleFilter(f(deals, 'amount'), { field: 'amount', op: 'isEmpty' })).toBe('amount.amountMicros = null')
  })

  it('searches a relation by the name of what it points at', () => {
    expect(ruleFilter(f(deals, 'company'), { field: 'company', op: 'contains', value: 'fund' })).toBe('company.name ~ "fund"')
    expect(ruleFilter(f(deals, 'contact'), { field: 'contact', op: 'contains', value: 'grace' })).toBe('(contact.name.firstName ~ "grace" || contact.name.lastName ~ "grace")')
    expect(ruleFilter(f(deals, 'company'), { field: 'company', op: 'is', value: 'abc' })).toBe('company = "abc"')
  })

  it('escapes what a person types', () => {
    expect(lit('say "hi" \\ back')).toBe('"say \\"hi\\" \\\\ back"')
    expect(ruleFilter(f(people, 'job_title'), { field: 'job_title', op: 'contains', value: 'a"b' })).toBe('job_title ~ "a\\"b"')
  })

  it('leaves out a rule with no operand yet', () => {
    expect(ruleFilter(f(people, 'job_title'), { field: 'job_title', op: 'contains', value: '  ' })).toBe('')
    expect(ruleFilter(f(deals, 'amount'), { field: 'amount', op: 'gt' })).toBe('')
  })
})

describe('a view as one query', () => {
  it('combines by its match, inside the tab scope', () => {
    const q = baseQuery(
      deals,
      {
        filters: [
          { field: 'stage', op: 'is', value: 'meeting' },
          { field: 'name', op: 'contains', value: 'acme' },
        ],
        match: 'or',
        sorts: [],
      },
      'pipeline = "fundraising"',
    )
    // An `or` view never reaches past the tab: the scope is ANDed outside it.
    expect(q.filter).toBe('(pipeline = "fundraising" && (stage = "meeting" || name ~ "acme"))')
  })

  it('searches every text field and the names it relates to', () => {
    expect(searchFilter(deals, 'grace')).toBe('(name ~ "grace" || company.name ~ "grace" || contact.name.firstName ~ "grace" || contact.name.lastName ~ "grace")')
    expect(searchFilter(deals, '  ')).toBe('')
  })

  it('sorts a composite and a relation by the part a person reads', () => {
    expect(sortOf(people, [{ field: 'name', dir: 'asc' }, { field: 'company', dir: 'desc' }, { field: 'emails', dir: 'asc' }])).toBe('name.firstName,-company.name,emails.primaryEmail')
    expect(sortOf(deals, [{ field: 'amount', dir: 'desc' }, { field: 'contact', dir: 'asc' }, { field: 'gone', dir: 'asc' }])).toBe('-amount.amountMicros,contact.name.firstName')
  })

  it('asks nothing of an empty view', () => {
    expect(baseQuery(people, { filters: [], sorts: [] })).toEqual({ filter: '', sort: '' })
  })
})
