// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'

import { LANGUAGES } from './languages'

describe('the languages dictation listens in', () => {
  it('offers each once, by its own name', () => {
    expect(LANGUAGES.map((l) => l.id)).toEqual(['en', 'es', 'fr', 'de', 'ja', 'zh'])
    expect(LANGUAGES.find((l) => l.id === 'de')?.label).toBe('Deutsch')
  })
})
