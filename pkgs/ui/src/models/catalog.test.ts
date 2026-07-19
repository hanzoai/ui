/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  familyOf,
  groupModelsByFamily,
  isChatModel,
  filterChatModels,
  fetchModelCatalog,
  type ModelCatalogEntry,
} from './catalog'

const m = (e: Partial<ModelCatalogEntry> & { id: string }): ModelCatalogEntry => e

describe('familyOf', () => {
  it('honors an explicit family override', () => {
    expect(familyOf(m({ id: 'gpt-4o', owned_by: 'openai', family: 'Custom' }))).toBe('Custom')
  })

  it('splits enso ids into their own house family regardless of owned_by', () => {
    expect(familyOf(m({ id: 'enso-1', owned_by: 'hanzo' }))).toBe('Enso')
    expect(familyOf(m({ id: 'zen5', owned_by: 'hanzo' }))).toBe('Zen')
  })

  it('maps owned_by to display families', () => {
    expect(familyOf(m({ id: 'claude-opus-4.8', owned_by: 'anthropic' }))).toBe('Anthropic')
    expect(familyOf(m({ id: 'x', owned_by: 'openai' }))).toBe('OpenAI')
    expect(familyOf(m({ id: 'x', owned_by: 'deepseek' }))).toBe('DeepSeek')
    expect(familyOf(m({ id: 'x', owned_by: 'alibaba' }))).toBe('Qwen')
    expect(familyOf(m({ id: 'x', owned_by: 'meta' }))).toBe('Meta Llama')
    expect(familyOf(m({ id: 'x', owned_by: 'mistralai' }))).toBe('Mistral')
    expect(familyOf(m({ id: 'x', owned_by: 'google' }))).toBe('Google Gemma')
    expect(familyOf(m({ id: 'x', owned_by: 'nvidia' }))).toBe('NVIDIA')
    expect(familyOf(m({ id: 'x', owned_by: 'moonshot' }))).toBe('Kimi')
  })

  it('resolves llama ids under any owner and capitalizes unknown owners', () => {
    expect(familyOf(m({ id: 'llama-3.1-70b', owned_by: 'together' }))).toBe('Meta Llama')
    expect(familyOf(m({ id: 'command-r', owned_by: 'cohere' }))).toBe('Cohere')
  })

  it('infers a family from the id prefix when owned_by is absent', () => {
    expect(familyOf(m({ id: 'claude-3.5' }))).toBe('Anthropic')
    expect(familyOf(m({ id: 'gpt-4o' }))).toBe('OpenAI')
    expect(familyOf(m({ id: 'o3-mini' }))).toBe('OpenAI')
    expect(familyOf(m({ id: 'qwen3-max' }))).toBe('Qwen')
    expect(familyOf(m({ id: 'glm-4.6' }))).toBe('GLM')
    expect(familyOf(m({ id: 'kimi-k2' }))).toBe('Kimi')
    expect(familyOf(m({ id: 'gemma-2-9b' }))).toBe('Google Gemma')
    expect(familyOf(m({ id: 'nemotron-4' }))).toBe('NVIDIA')
    expect(familyOf(m({ id: 'minimax-01' }))).toBe('MiniMax')
    expect(familyOf(m({ id: 'mimo-7b' }))).toBe('MiMo')
    expect(familyOf(m({ id: 'something-weird' }))).toBe('Other')
  })
})

describe('groupModelsByFamily', () => {
  it('orders house then marquee then alphabetical, stable within a family', () => {
    const groups = groupModelsByFamily([
      m({ id: 'gpt-4o' }), // OpenAI
      m({ id: 'command-r', owned_by: 'cohere' }), // Cohere
      m({ id: 'zen5' }), // Zen
      m({ id: 'claude-opus-4.8' }), // Anthropic
      m({ id: 'enso-1', owned_by: 'hanzo' }), // Enso
      m({ id: 'gpt-4o-mini' }), // OpenAI
      m({ id: 'qwen3-max' }), // Qwen
    ])
    expect(groups.map((g) => g.family)).toEqual([
      'Enso',
      'Zen',
      'Anthropic',
      'OpenAI',
      'Cohere',
      'Qwen',
    ])
    // OpenAI models keep input order.
    expect(groups.find((g) => g.family === 'OpenAI')!.models.map((x) => x.id)).toEqual([
      'gpt-4o',
      'gpt-4o-mini',
    ])
  })
})

describe('isChatModel / filterChatModels', () => {
  it('excludes non-chat modalities and id segments', () => {
    expect(isChatModel(m({ id: 'text-embedding-3-large' }))).toBe(false)
    expect(isChatModel(m({ id: 'gpt-4o', modality: 'embedding' }))).toBe(false)
    expect(isChatModel(m({ id: 'dall-e-3', modality: 'image' }))).toBe(false)
    expect(isChatModel(m({ id: 'gpt-4o-mini-tts' }))).toBe(false)
    expect(isChatModel(m({ id: 'llama-guard-3' }))).toBe(false)
    expect(isChatModel(m({ id: 'omni-moderation' }))).toBe(false)
    expect(isChatModel(m({ id: 'bge-reranker' }))).toBe(false)
    expect(isChatModel(m({ id: 'claude-opus-4.8' }))).toBe(true)
    expect(isChatModel(m({ id: 'zen5', modality: 'chat' }))).toBe(true)
  })

  it('filterChatModels keeps only chat-capable models', () => {
    const kept = filterChatModels([
      m({ id: 'claude-opus-4.8' }),
      m({ id: 'text-embedding-3-large' }),
      m({ id: 'gpt-4o' }),
    ])
    expect(kept.map((x) => x.id)).toEqual(['claude-opus-4.8', 'gpt-4o'])
  })
})

describe('fetchModelCatalog', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('maps an OpenAI-shaped data[] payload and passes a bearer token', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          { id: 'claude-opus-4.8', owned_by: 'anthropic', context_window: 1_000_000 },
          { id: 'no-context', owned_by: 'openai' },
        ],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const out = await fetchModelCatalog('https://api.hanzo.ai/v1/', 'tok')

    expect(fetchMock).toHaveBeenCalledWith('https://api.hanzo.ai/v1/models', {
      headers: { Accept: 'application/json', Authorization: 'Bearer tok' },
    })
    expect(out).toEqual([
      { id: 'claude-opus-4.8', owned_by: 'anthropic', family: undefined, label: undefined, premium: undefined, modality: undefined, context_window: 1_000_000, description: undefined },
      { id: 'no-context', owned_by: 'openai', family: undefined, label: undefined, premium: undefined, modality: undefined, context_window: undefined, description: undefined },
    ])
  })

  it('throws on a non-2xx response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401, statusText: 'Unauthorized' }))
    await expect(fetchModelCatalog()).rejects.toThrow('fetchModelCatalog: 401 Unauthorized')
  })
})
