import { describe, it, expect } from 'vitest'

import { filterOptions, isKnownOption, type ComboOption } from './filter'

const opts: ComboOption[] = [
  { value: 'zen-omni', label: 'Zen Omni', hint: 'hanzo' },
  { value: 'gpt-4o-mini', label: 'GPT-4o mini', hint: 'openai' },
  { value: 'claude-sonnet-4-5', hint: 'anthropic' },
]

describe('filterOptions', () => {
  it('returns every option for an empty / whitespace query', () => {
    expect(filterOptions(opts, '')).toHaveLength(3)
    expect(filterOptions(opts, '   ')).toHaveLength(3)
  })

  it('matches on value (case-insensitive substring)', () => {
    expect(filterOptions(opts, 'ZEN').map((o) => o.value)).toEqual(['zen-omni'])
    expect(filterOptions(opts, 'sonnet').map((o) => o.value)).toEqual(['claude-sonnet-4-5'])
  })

  it('matches on label', () => {
    expect(filterOptions(opts, 'GPT-4o').map((o) => o.value)).toEqual(['gpt-4o-mini'])
  })

  it('matches on hint (the provider)', () => {
    expect(filterOptions(opts, 'anthropic').map((o) => o.value)).toEqual(['claude-sonnet-4-5'])
    expect(filterOptions(opts, 'openai').map((o) => o.value)).toEqual(['gpt-4o-mini'])
  })

  it('returns nothing when nothing matches (the typed value is still usable by the caller)', () => {
    expect(filterOptions(opts, 'llama')).toEqual([])
  })

  it('treats the query as a LITERAL string, never a regex (no ReDoS / injection)', () => {
    // A regex-special query must match literally (or not at all) — never be compiled.
    expect(filterOptions(opts, '.*')).toEqual([]) // no option literally contains ".*"
    expect(filterOptions(opts, '(')).toEqual([]) // an unbalanced paren would throw if compiled
    expect(filterOptions(opts, '[a-z')).toEqual([]) // an invalid char class would throw if compiled
    // A literal hyphen (regex-benign but proves substring semantics):
    expect(filterOptions(opts, '4o-mini').map((o) => o.value)).toEqual(['gpt-4o-mini'])
  })
})

describe('isKnownOption', () => {
  it('is true only for an exact value match (case-sensitive)', () => {
    expect(isKnownOption(opts, 'zen-omni')).toBe(true)
    expect(isKnownOption(opts, 'ZEN-OMNI')).toBe(false)
    expect(isKnownOption(opts, 'custom-model')).toBe(false)
  })
})
