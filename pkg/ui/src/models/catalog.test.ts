import { describe, expect, it } from 'vitest'

import { familyOf } from './catalog'

/**
 * A model is filed under the family that MADE it.
 *
 * The map used to carry `hanzo: 'Zen'`, and it was wrong in both directions.
 * Zoo Labs Foundation makes Zen, not Hanzo; and the gateway does not report Zen
 * as Hanzo's anyway — api.hanzo.ai answers `owned_by: 'zenlm'` for all fourteen
 * Zen models. What `owned_by: 'hanzo'` really names is the twelve models Hanzo
 * serves under its own namespace, so that one entry swept Whisper, Kokoro, GLM,
 * Kimi, Qwen3.5 and MiniMax into "Zen" too. Enso escaped only because its id is
 * checked before the owner is.
 *
 * The ids below are the live catalog's, not invented ones.
 */
const m = (id: string, owned_by?: string, family?: string) => ({ id, owned_by, family })

describe('the family a model is filed under', () => {
  it('files Zen under Zen, by the owner the gateway actually reports', () => {
    expect(familyOf(m('zen5', 'zenlm'))).toBe('Zen')
    expect(familyOf(m('zen-coder', 'zenlm'))).toBe('Zen')
    // Even an id that says nothing still lands by its owner.
    expect(familyOf(m('rerank-v2', 'zenlm'))).toBe('Zen')
  })

  it('never files a model under Zen just because Hanzo serves it', () => {
    for (const id of ['whisper', 'whisper-small', 'kokoro', 'best']) {
      expect(familyOf(m(id, 'hanzo'))).not.toBe('Zen')
    }
  })

  it('sends the models Hanzo routes home to their real makers', () => {
    expect(familyOf(m('glm-5.2', 'hanzo'))).toBe('GLM')
    expect(familyOf(m('kimi-k2.6', 'hanzo'))).toBe('Kimi')
    expect(familyOf(m('qwen3.5-397b', 'hanzo'))).toBe('Qwen')
    expect(familyOf(m('qwen3.5-397b-a17b', 'hanzo'))).toBe('Qwen')
    expect(familyOf(m('minimax-m2.5', 'hanzo'))).toBe('MiniMax')
  })

  it('keeps Enso Hanzo\'s, which is the half of this that was always right', () => {
    for (const id of ['enso', 'enso-flash', 'enso-ultra']) {
      expect(familyOf(m(id, 'hanzo'))).toBe('Enso')
    }
  })

  it('calls what is left of Hanzo\'s namespace Hanzo', () => {
    expect(familyOf(m('best', 'hanzo'))).toBe('Hanzo')
    expect(familyOf(m('kokoro', 'hanzo'))).toBe('Hanzo')
  })

  it('still honours an explicit family over everything', () => {
    expect(familyOf(m('zen5', 'zenlm', 'Custom'))).toBe('Custom')
  })

  it('leaves the other makers alone', () => {
    expect(familyOf(m('claude-opus-4.8', 'anthropic'))).toBe('Anthropic')
    expect(familyOf(m('gpt-5', 'openai'))).toBe('OpenAI')
    expect(familyOf(m('deepseek-v3', 'deepseek'))).toBe('DeepSeek')
  })
})
