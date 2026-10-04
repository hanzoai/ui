import { describe, expect, it } from 'vitest'

import {
  capabilitiesOf,
  formatContext,
  formatPrice,
  groupModels,
  isPaused,
  makerName,
  makerOf,
  matchesModel,
  matchesPaused,
  parseModels,
  sortModels,
  withResearch,
  type ModelCatalogEntry,
} from './catalog'

/** Rows as api.hanzo.ai answers them (trimmed to the fields that matter). */
const WIRE = {
  object: 'list',
  data: [
    { id: 'enso-auto', owned_by: 'hanzo', family: 'enso', class: 'ours', context_window: 1_000_000, pricing: { input_per_million: 0, output_per_million: 0 } },
    { id: 'zen5', owned_by: 'zenlm', family: 'zen', class: 'ours', context_window: 1_000_000 },
    { id: 'zen-embedding', owned_by: 'zenlm', family: 'zen', class: 'ours', outputs: ['embeddings'] },
    { id: 'kai', owned_by: 'hanzo', family: 'kai', class: 'ours', outputs: ['decision'] },
    { id: 'typesafe/jev-router', owned_by: 'typesafe', family: 'jev', class: 'premium' },
    {
      id: 'anthropic/claude-sonnet-4.5',
      owned_by: 'anthropic',
      class: 'premium',
      name: 'Claude Sonnet 4.5',
      inputs: ['text', 'image'],
      outputs: ['text'],
      supports_tools: true,
      supports_reasoning: true,
      created: 1759161676,
      pricing: { prompt: '0.000003', input_per_million: 3, output_per_million: 15 },
    },
    { id: '~anthropic/claude-sonnet-latest', owned_by: '~anthropic', class: 'premium' },
    { id: 'google/gemini-3-pro-image', owned_by: 'google', class: 'premium', outputs: ['image', 'text'] },
    { id: 'zen-voice-mini', owned_by: 'hanzo', family: 'zen', outputs: ['audio'] },
    { id: 'meta-llama/llama-3.3-70b-instruct:free', owned_by: 'meta-llama', class: 'free', created: 1, pricing: { input_per_million: 0, output_per_million: 0 } },
    { id: 'openrouter/auto', owned_by: 'openrouter', class: 'premium' },
    { owned_by: 'nobody' },
    { id: 'zen5', owned_by: 'zenlm' },
  ],
}

const models = parseModels(WIRE)
const byId = (id: string) => models.find((m) => m.id === id)!

describe('reading /v1/models', () => {
  it('keeps every row with an id, once', () => {
    expect(models).toHaveLength(11)
    expect(models.filter((m) => m.id === 'zen5')).toHaveLength(1)
  })

  it('reads the fields the gateway publishes, checked', () => {
    const c = byId('anthropic/claude-sonnet-4.5')
    expect(c).toMatchObject({
      class: 'premium',
      name: 'Claude Sonnet 4.5',
      inputs: ['text', 'image'],
      supports_tools: true,
      supports_reasoning: true,
      pricing: { input_per_million: 3, output_per_million: 15 },
    })
    expect(byId('enso-auto').family).toBe('enso')
  })

  it('leaves a price the gateway does not list absent, never zero', () => {
    expect(byId('zen5').pricing).toBeUndefined()
    expect(formatPrice(byId('zen5').pricing?.input_per_million)).toBe('')
    expect(formatPrice(byId('enso-auto').pricing?.input_per_million)).toBe('Free')
    expect(formatPrice(3)).toBe('$3.00')
  })

  it('drops a class or family it does not know rather than guessing one', () => {
    const [m] = parseModels([{ id: 'x', class: 'gold', family: 'acme' }])
    expect(m!.class).toBeUndefined()
    expect(m!.family).toBeUndefined()
  })
})

describe('groups', () => {
  it("leads with Hanzo's families in order, then makers by name", () => {
    const labels = groupModels(sortModels(models)).map((g) => g.label)
    expect(labels.slice(0, 4)).toEqual(['Enso', 'Zen', 'Kai', 'Jev'])
    expect(labels.slice(4)).toEqual(['Anthropic', 'Google', 'Meta Llama', 'OpenRouter'])
  })

  it("files OpenRouter's ~ aliases with their maker", () => {
    expect(makerOf(byId('~anthropic/claude-sonnet-latest'))).toBe('anthropic')
    expect(makerName('z-ai')).toBe('Z.ai')
    expect(makerName('some-new-lab')).toBe('Some New Lab')
  })
})

describe('what a model can do', () => {
  it('reads it from outputs, inputs and supports_*', () => {
    expect(capabilitiesOf(byId('anthropic/claude-sonnet-4.5'))).toEqual(['chat', 'vision', 'tools', 'reasoning'])
    expect(capabilitiesOf(byId('zen5'))).toEqual(['chat'])
    expect(capabilitiesOf(byId('zen-embedding'))).toEqual(['embeddings'])
    expect(capabilitiesOf(byId('kai'))).toEqual(['decision'])
    expect(capabilitiesOf(byId('google/gemini-3-pro-image'))).toEqual(['chat', 'image'])
    expect(capabilitiesOf(byId('zen-voice-mini'))).toEqual(['audio'])
  })
})

describe('paused', () => {
  it('is a limited class or a model a paused entry names, glob included', () => {
    const limits = {
      classes: { premium: { state: 'limited' }, ours: { state: 'near' } },
      paused: [{ model: 'zen5', fallback: 'enso-auto', resets_at: null }],
    }
    expect(isPaused(byId('anthropic/claude-sonnet-4.5'), limits)).toBe(true)
    expect(isPaused(byId('zen5'), limits)).toBe(true)
    expect(isPaused(byId('enso-auto'), limits)).toBe(false)
    expect(isPaused(byId('zen-voice-mini'), limits)).toBe(false)
    expect(isPaused(byId('anthropic/claude-sonnet-4.5'), null)).toBe(false)
    const glob = { classes: {}, paused: [{ model: 'anthropic/claude-*' }] }
    expect(isPaused(byId('anthropic/claude-sonnet-4.5'), glob)).toBe(true)
    expect(isPaused(byId('~anthropic/claude-sonnet-latest'), glob)).toBe(false)
  })

  it('reads a glob the way a shell does', () => {
    expect(matchesPaused('anthropic/claude-opus-4.8', 'anthropic/claude-opus*')).toBe(true)
    expect(matchesPaused('anthropic/claude-sonnet-4.5', 'anthropic/claude-opus*')).toBe(false)
    expect(matchesPaused('openai/gpt-5-mini', '*-mini')).toBe(true)
    expect(matchesPaused('openai/gpt-5-mini', 'openai/*5*')).toBe(true)
    expect(matchesPaused('abab', 'ab*ab')).toBe(true)
    expect(matchesPaused('ab', 'ab*ab')).toBe(false)
    expect(matchesPaused('zen5', 'zen5')).toBe(true)
    expect(matchesPaused('zen5-pro', 'zen5')).toBe(false)
  })
})

describe('search and sort', () => {
  it('matches every word against id, name, maker and group', () => {
    expect(matchesModel(byId('anthropic/claude-sonnet-4.5'), 'claude sonnet')).toBe(true)
    expect(matchesModel(byId('anthropic/claude-sonnet-4.5'), 'anthropic 4.5')).toBe(true)
    expect(matchesModel(byId('zen5'), 'zen')).toBe(true)
    expect(matchesModel(byId('zen5'), 'claude')).toBe(false)
  })

  it('puts a model without the figure last', () => {
    const ctx = sortModels(models, 'context').map((m) => m.id)
    expect(ctx.slice(0, 2)).toEqual(['enso-auto', 'zen5'])
    expect(ctx.at(-1)).toBe('zen-voice-mini')
    const price = sortModels(models, 'price').map((m) => m.id)
    expect(price.indexOf('anthropic/claude-sonnet-4.5')).toBeGreaterThan(price.indexOf('enso-auto'))
    expect(price.indexOf('zen5')).toBeGreaterThan(price.indexOf('anthropic/claude-sonnet-4.5'))
    expect(sortModels(models, 'newest')[0]!.id).toBe('anthropic/claude-sonnet-4.5')
  })
})

describe('the research preview', () => {
  it('is appended once, under Zen', () => {
    const all = withResearch(models)
    expect(all.filter((m) => m.access === 'research').map((m) => m.id)).toEqual(['zen7'])
    expect(withResearch(all)).toHaveLength(all.length)
    const zen = groupModels(all).find((g) => g.family === 'zen')!
    expect(zen.models.some((m: ModelCatalogEntry) => m.id === 'zen7')).toBe(true)
  })
})

describe('figures', () => {
  it('reads a window compactly, and nothing when there is none', () => {
    expect(formatContext(1_000_000)).toBe('1M')
    expect(formatContext(1_048_576)).toBe('1M')
    expect(formatContext(131_072)).toBe('131K')
    expect(formatContext(undefined)).toBe('')
  })
})
