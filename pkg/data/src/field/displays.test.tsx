// @vitest-environment jsdom

/**
 * Every field type's display, on the record kit: the value drawn, the empty
 * state, and the markup a reader and assistive technology get. Read off the
 * server-rendered markup — gui compiles each style to an atomic class, so the
 * class is the rendered fact.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'
import { config } from '@hanzo/ui'

import { FieldDisplay } from './FieldDisplay'
import type { FieldDefinition, FieldType } from './types'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  ).replace(/<style[^>]*>[\s\S]*?<\/style>/g, '')

const show = (type: FieldType, value: unknown, metadata?: object) =>
  html(<FieldDisplay field={{ name: 'f', label: 'Field', type, metadata } as FieldDefinition} value={value} />)

/** The text a reader sees, tags stripped and whitespace collapsed. */
const text = (markup: string) => markup.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

describe('empty values', () => {
  it.each<FieldType>([
    'text', 'longText', 'richText', 'number', 'percent', 'currency', 'boolean', 'select', 'multiSelect', 'date',
    'dateTime', 'email', 'url', 'links', 'phone', 'relation', 'json', 'files', 'uuid', 'fullName', 'address', 'actor',
  ])('%s with no value shows the one empty glyph, at the faintest ink', (type) => {
    const markup = show(type, null)
    expect(text(markup)).toBe('—')
    expect(markup).toContain('aria-label="Empty"')
  })
})

describe('text family', () => {
  it('text is one cut line at the ink', () => {
    const markup = show('text', 'Acme Corporation')
    expect(text(markup)).toBe('Acme Corporation')
    expect(markup).toMatch(/_col-ink/)
  })

  it('rich text shows its first line, markdown marks stripped', () => {
    expect(text(show('richText', '\n# **Kickoff** notes\n- second'))).toBe('Kickoff notes')
  })

  it('rich text reads a block document', () => {
    const doc = [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello ' }, { type: 'text', text: 'there' }] }]
    expect(text(show('richText', { blocknote: JSON.stringify(doc) }))).toBe('Hello there')
  })
})

describe('pills', () => {
  it('an email is a round mailto pill', () => {
    const markup = show('email', 'ada@example.com')
    expect(markup).toContain('href="mailto:ada@example.com"')
    expect(markup).toMatch(/data-slot="chip"/)
  })

  it('several emails, from the composite, are several pills', () => {
    const markup = show('email', { primaryEmail: 'a@x.io', additionalEmails: ['b@x.io'] })
    expect(markup).toContain('mailto:a@x.io')
    expect(markup).toContain('mailto:b@x.io')
  })

  it('a link pill names its host and opens beside the app', () => {
    const markup = show('links', [{ url: 'https://www.hanzo.ai/pricing/' }])
    expect(text(markup)).toContain('hanzo.ai/pricing')
    expect(markup).toContain('target="_blank"')
    expect(markup).toContain('rel="noopener noreferrer"')
  })

  it('a javascript: URL is drawn, never linked', () => {
    const markup = show('url', 'javascript:alert(1)')
    expect(markup).not.toContain('href=')
  })

  it('a phone is international, with its tel: target', () => {
    const markup = show('phone', '+33 6 12 34 56 78')
    expect(text(markup)).toContain('+33 6 12 34 56 78')
    expect(markup).toContain('href="tel:+33612345678"')
  })

  it('a national number takes the field’s default country', () => {
    const markup = show('phone', '0612345678', { defaultCountry: 'FR' })
    expect(markup).toContain('href="tel:+33612345678"')
  })
})

describe('numbers', () => {
  it('a currency is formatted with its code', () => {
    expect(text(show('currency', { amount: 1234.5, currencyCode: 'EUR' }))).toMatch(/1,234\.50|1\.234,50/)
  })

  it('a percent keeps its decimals', () => {
    expect(text(show('percent', 12.5, { decimals: 1 }))).toBe('12.5%')
  })
})

describe('boolean', () => {
  it('is a check and its word', () => {
    expect(text(show('boolean', true))).toBe('Yes')
    expect(text(show('boolean', false, { falseLabel: 'Off' }))).toBe('Off')
  })
})

describe('select', () => {
  const options = [
    { value: 'lead', label: 'Lead', color: 'sky' },
    { value: 'won', label: 'Won', color: 'green' },
  ]

  it('a select value is a Tag in its option’s hue', () => {
    const markup = show('select', 'won', { options })
    expect(markup).toMatch(/data-slot="tag"[^>]*data-color="green"/)
    expect(text(markup)).toBe('Won')
  })

  it('an option with no colour is gray', () => {
    expect(show('select', 'x', { options: [{ value: 'x', label: 'X' }] })).toMatch(/data-color="gray"/)
  })

  it('a multi-select is a row of tags in one overflowing list', () => {
    const markup = show('multiSelect', ['lead', 'won'], { options })
    expect(markup).toMatch(/data-slot="overflowing-list"/)
    expect(markup.match(/data-slot="tag"/g)?.length).toBeGreaterThanOrEqual(2)
  })
})

describe('dates', () => {
  it('a calendar day is the same day in every zone', () => {
    // UTC formatting: "2026-10-19" never reads as the 18th.
    expect(text(show('date', '2026-10-19'))).toMatch(/19/)
    expect(text(show('date', '2026-10-19'))).not.toMatch(/18/)
  })

  it('relative display reads in words', () => {
    const d = new Date(Date.now() + 3 * 86400_000).toISOString()
    expect(text(show('dateTime', d, { display: 'relative' }))).toMatch(/in 3 days|in 2 days/)
  })
})

describe('records', () => {
  it('a relation is a record chip with an avatar', () => {
    const markup = show('relation', { id: 'c1', name: 'Acme' })
    expect(markup).toMatch(/data-slot="chip"/)
    expect(markup).toMatch(/data-slot="avatar"/)
    expect(text(markup)).toContain('Acme')
  })

  it('a one-to-many relation is a list of chips', () => {
    const markup = show('relation', [{ id: 'p1', name: 'Ada' }, { id: 'p2', name: 'Grace' }])
    expect(markup.match(/data-slot="chip"/g)?.length).toBeGreaterThanOrEqual(2)
  })

  it('an actor that is a person is a round avatar and a name', () => {
    const markup = show('actor', { name: 'Ada Lovelace', source: 'member' })
    expect(markup).toMatch(/data-slot="avatar"/)
    expect(text(markup)).toContain('Ada Lovelace')
  })

  it('an actor that is a source is its icon and its name, no avatar', () => {
    const markup = show('actor', { name: 'Import', source: 'import' })
    expect(markup).not.toMatch(/data-slot="avatar"/)
    expect(text(markup)).toContain('Import')
  })
})

describe('composites', () => {
  it('a full name from either spelling', () => {
    expect(text(show('fullName', { firstName: 'Ada', lastName: 'Lovelace' }))).toBe('Ada Lovelace')
  })

  it('an address is one line, its country by name', () => {
    expect(text(show('address', { street1: '1 Main St', city: 'Paris', country: 'FR' }))).toBe('1 Main St, Paris, France')
  })

  it('a uuid is mono at the tertiary ink', () => {
    expect(show('uuid', '0b8e…')).toMatch(/_col-hint/)
  })

  it('a rating states its level and draws that many lit stars', () => {
    const markup = show('rating', 3)
    expect(markup).toContain('aria-label="3 of 5"')
  })
})

describe('Tag (the package export)', () => {
  it('keeps its { label, color } contract on the kit Tag', async () => {
    const { Tag } = await import('./displays')
    const markup = html(<Tag label="Hot" color="red" />)
    expect(markup).toMatch(/data-slot="tag"[^>]*data-color="red"/)
    expect(text(markup)).toBe('Hot')
  })
})
