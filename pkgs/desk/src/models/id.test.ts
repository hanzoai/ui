import { describe, expect, it } from 'vitest'

import { canonicalOrg, getOrgAndSlug, orgDisplayName } from './id.js'

/**
 * What a model id means, checked on ids the gateway actually serves.
 */

describe('the two halves of an id', () => {
  it('splits an id that names its lab', () => {
    expect(getOrgAndSlug('anthropic/claude-opus-4.8')).toEqual({
      org: 'anthropic',
      slug: 'claude-opus-4.8',
    })
  })

  it('reads a bare slug as ours, because that is what a bare slug means', () => {
    expect(getOrgAndSlug('zen5-pro')).toEqual({ org: 'hanzo', slug: 'zen5-pro' })
  })

  it('keeps a slug that contains a slash whole, splitting on the first one only', () => {
    expect(getOrgAndSlug('meta-llama/llama-3.1/8b')).toEqual({
      org: 'meta-llama',
      slug: 'llama-3.1/8b',
    })
  })

  it('reads an empty id as a bare slug rather than throwing', () => {
    expect(getOrgAndSlug('')).toEqual({ org: 'hanzo', slug: '' })
  })
})

describe('one lab, however it reaches the gateway', () => {
  it('folds a lab that arrives under two namespaces onto one', () => {
    expect(canonicalOrg('meta-llama')).toBe('meta')
    expect(canonicalOrg('meta')).toBe('meta')
    expect(canonicalOrg('bytedance-seed')).toBe('bytedance')
    expect(canonicalOrg('bytedance')).toBe('bytedance')
  })

  it('reads the latest-alias `~` as the same lab, not another one', () => {
    expect(canonicalOrg('~anthropic')).toBe('anthropic')
    expect(canonicalOrg('~meta-llama')).toBe('meta')
  })

  it('answers hanzo for an id that named no lab', () => {
    expect(canonicalOrg()).toBe('hanzo')
    expect(canonicalOrg(undefined)).toBe('hanzo')
  })

  it('leaves a lab it has never heard of alone rather than inventing a fold', () => {
    expect(canonicalOrg('some-new-lab')).toBe('some-new-lab')
  })
})

describe('what a lab is called', () => {
  it('capitalises the labs whose namespace is not their name', () => {
    expect(orgDisplayName('openai')).toBe('OpenAI')
    expect(orgDisplayName('x-ai')).toBe('xAI')
    expect(orgDisplayName('mistralai')).toBe('Mistral')
    expect(orgDisplayName('z-ai')).toBe('Z.ai')
    expect(orgDisplayName('meta-llama')).toBe('Meta')
  })

  it('answers Hanzo for an id that named no lab', () => {
    expect(orgDisplayName()).toBe('Hanzo')
  })

  it('answers with the namespace itself for a lab not in the table', () => {
    expect(orgDisplayName('some-new-lab')).toBe('some-new-lab')
  })

  it('names both namespaces of a folded lab, because either can arrive', () => {
    // `canonicalOrg` folds them; a caller that did not fold still gets a name.
    expect(orgDisplayName('meta')).toBe('Meta')
    expect(orgDisplayName('bytedance')).toBe('ByteDance')
    expect(orgDisplayName('bytedance-seed')).toBe('ByteDance Seed')
  })
})
