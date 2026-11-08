import { describe, expect, it } from 'vitest'

import { defaultModel, ENSO, parseModels, type ModelCatalogEntry } from './catalog'
import { modelCount, NOT_FOR_AGENTS, pickerRows, restable, revealTop, standing, visibleRange, type PickerRow } from './picker.logic'

const models = parseModels([
  { id: 'enso', owned_by: 'hanzo', family: 'enso', class: 'ours' },
  { id: ENSO, owned_by: 'hanzo', family: 'enso', class: 'ours' },
  { id: 'zen5', owned_by: 'zenlm', family: 'zen', class: 'ours' },
  { id: 'zen-vl', owned_by: 'zenlm', family: 'zen', class: 'ours', supports_vision: true },
  { id: 'zen-embedding', owned_by: 'zenlm', family: 'zen', class: 'ours', outputs: ['embeddings'] },
  { id: 'kai', owned_by: 'hanzo', family: 'kai', class: 'ours', outputs: ['decision'] },
  { id: 'anthropic/claude-sonnet-4.5', owned_by: 'anthropic', class: 'premium', inputs: ['text', 'image'] },
  { id: 'openai/text-embedding-3-large', owned_by: 'openai', class: 'premium', outputs: ['embeddings'] },
  { id: 'openai/gpt-5-image', owned_by: 'openai', class: 'premium', outputs: ['image', 'text'] },
])

describe('the rows a picker draws', () => {
  it('lists every model under a heading, families first, plus the research preview', () => {
    const rows = pickerRows(models, '')
    expect(modelCount(rows)).toBe(models.length + 1)
    expect(rows[0]).toMatchObject({ kind: 'group', label: 'Enso', count: 2 })
    // The house router leads its family, ahead of the name order.
    expect(rows[1]).toMatchObject({ kind: 'model', model: { id: ENSO } })
    const heads = rows.filter((r) => r.kind === 'group').map((r) => (r.kind === 'group' ? r.label : ''))
    expect(heads).toEqual(['Enso', 'Zen', 'Kai', 'Anthropic', 'OpenAI'])
  })

  it('narrows to a scope and a search', () => {
    expect(modelCount(pickerRows(models, '', 'embeddings'))).toBe(2)
    // enso, enso-auto, zen5, zen-vl, claude, gpt-5-image and the zen7 preview
    expect(modelCount(pickerRows(models, '', 'chat'))).toBe(7)
    expect(modelCount(pickerRows(models, 'zen', 'chat'))).toBe(3)
    expect(pickerRows(models, 'nothing like this')).toEqual([])
  })

  it('never rests the cursor on a heading or a research preview', () => {
    const rows = pickerRows(models, 'zen')
    const restIds = rows.flatMap((r, i) => (restable(rows, i) && r.kind === 'model' ? [r.model.id] : []))
    expect(restIds).not.toContain('zen7')
    expect(rows.filter((r, i) => r.kind === 'group' && restable(rows, i))).toEqual([])
  })
})

describe('the slice a viewport draws', () => {
  it('is the rows in view and a margin, clamped', () => {
    expect(visibleRange(0, 320, 32, 500, 8)).toEqual({ start: 0, end: 18 })
    expect(visibleRange(3200, 320, 32, 500, 8)).toEqual({ start: 92, end: 118 })
    expect(visibleRange(32 * 495, 320, 32, 500, 8)).toEqual({ start: 487, end: 500 })
    expect(visibleRange(0, 320, 32, 0)).toEqual({ start: 0, end: 0 })
  })

  it('scrolls the least distance to bring a row into view', () => {
    expect(revealTop(5, 0, 320, 32)).toBeNull()
    expect(revealTop(12, 0, 320, 32)).toBe(12 * 32 + 32 - 320)
    expect(revealTop(2, 320, 320, 32)).toBe(64)
  })
})

describe('the model a new conversation starts on', () => {
  it('is Enso for a conversation', () => {
    expect(defaultModel(models)).toBe(ENSO)
  })

  it("is Hanzo's own model for another modality, and never premium", () => {
    expect(defaultModel(models, 'embeddings')).toBe('zen-embedding')
    expect(defaultModel(models, 'vision')).toBe('zen-vl')
    expect(defaultModel(models, 'decision')).toBe('kai')
    // Only premium models make images here: nothing is chosen for the person.
    expect(defaultModel(models, 'image')).toBe('')
  })

  it('falls back to a free model when no Hanzo model does the job', () => {
    const free: ModelCatalogEntry[] = parseModels([
      { id: 'meta-llama/llama-3.3-70b-instruct:free', owned_by: 'meta-llama', class: 'free' },
      { id: 'anthropic/claude-sonnet-4.5', owned_by: 'anthropic', class: 'premium' },
    ])
    expect(defaultModel(free)).toBe('meta-llama/llama-3.3-70b-instruct:free')
  })
})

/** The ids of the models a set of rows draws. */
const ids = (rows: readonly PickerRow[]) => rows.flatMap((r) => (r.kind === 'model' ? [r.model.id] : []))

const MIXED = parseModels([
  { id: 'enso', owned_by: 'hanzo', family: 'enso', class: 'ours', outputs: ['text'] },
  { id: 'zen5', owned_by: 'zenlm', family: 'zen', class: 'ours', outputs: ['text'] },
  { id: 'kai', owned_by: 'hanzo', family: 'kai', class: 'ours', outputs: ['decision'] },
  { id: 'openai/gpt-6-sol', owned_by: 'openai', class: 'premium', outputs: ['text'], supports_tools: true, supports_reasoning: true },
  { id: 'anthropic/claude-x', owned_by: 'anthropic', class: 'premium', outputs: ['text'], supports_tools: true, supports_reasoning: true },
  { id: 'typesafe/jev-1.13', owned_by: 'typesafe', class: 'premium', outputs: ['decision'] },
  { id: 'typesafe/jev-router', owned_by: 'typesafe', class: 'premium', outputs: ['text'], supports_tools: true, supports_reasoning: true },
  { id: '~typesafe/jev-latest', owned_by: 'typesafe', class: 'premium', outputs: ['decision'] },
  { id: 'google/gemini-image', owned_by: 'google', class: 'premium', outputs: ['image'] },
  { id: 'elevenlabs/voice', owned_by: 'elevenlabs', class: 'premium', outputs: ['speech'] },
  { id: 'acme/no-tools', owned_by: 'acme', class: 'premium', outputs: ['text'], supports_tools: false },
])
const JEV = ['typesafe/jev-1.13', 'typesafe/jev-router', '~typesafe/jev-latest']

describe('the comparison models', () => {
  it('are in no list, whatever the scope or the search', () => {
    for (const scope of [undefined, 'chat', 'agent', 'decision', 'tools', 'reasoning'] as const) {
      for (const q of ['', 'jev', 'typesafe']) {
        const listed = ids(pickerRows(MIXED, q, scope, true))
        for (const id of JEV) expect(listed, `${scope} ${q}`).not.toContain(id)
      }
    }
  })

  it('stay in the catalogue a saving is read against', () => {
    expect(MIXED.filter((m) => JEV.includes(m.id))).toHaveLength(3)
  })

  it('are no chat model, and a decision model is not offered to chat', () => {
    expect(ids(pickerRows(MIXED, '', 'chat'))).toEqual(['enso', 'zen7', 'zen5', 'acme/no-tools', 'anthropic/claude-x', 'openai/gpt-6-sol'])
  })
})

describe('an agent’s list', () => {
  it('offers Hanzo’s first, then every maker that can run an agent, and ends in a shut group of what cannot', () => {
    const rows = pickerRows(MIXED, '', 'agent')
    // zen7 is the research preview: listed, and never picked.
    expect(ids(rows)).toEqual(['enso', 'zen7', 'zen5', 'anthropic/claude-x', 'openai/gpt-6-sol'])
    const heads = rows.filter((r) => r.kind === 'group').map((r) => (r.kind === 'group' ? r.label || r.key : ''))
    expect(heads).toEqual(['Enso', 'Zen', 'Anthropic', 'OpenAI', NOT_FOR_AGENTS])
    expect(rows.at(-1)).toMatchObject({ kind: 'group', key: NOT_FOR_AGENTS, count: 3, fold: 'shut' })
  })

  it('opens the group to show each with its few words of why, none of them restable', () => {
    const rows = pickerRows(MIXED, '', 'agent', true)
    expect(rows.at(-4)).toMatchObject({ kind: 'group', fold: 'open', count: 3 })
    const gaps = rows.flatMap((r) => (r.kind === 'model' && r.gap ? [[r.model.id, r.gap]] : []))
    expect(gaps).toEqual([
      ['acme/no-tools', 'tools'],
      ['elevenlabs/voice', 'voice'],
      ['google/gemini-image', 'image'],
    ])
    const at = rows.findIndex((r) => r.kind === 'model' && r.gap)
    expect(restable(rows, at)).toBe(false)
    // The heading that opens the group is a place the cursor rests.
    expect(restable(rows, rows.length - 4)).toBe(true)
  })

  it('lists no decision model and no comparison model, even among what cannot', () => {
    const rows = pickerRows(MIXED, '', 'agent', true)
    expect(ids(rows)).not.toContain('kai')
    for (const id of JEV) expect(ids(rows)).not.toContain(id)
  })
})

describe('what choosing a model does for the payer', () => {
  const sol = MIXED.find((m) => m.id === 'openai/gpt-6-sol')!
  const zen = MIXED.find((m) => m.id === 'zen5')!
  const free = (id: string) => id === 'enso'

  it('lets another maker’s model be paid for from the balance on any plan', () => {
    expect(standing(sol, free, () => true)).toBe('pick')
  })

  it('sends a balance that cannot pay to the top-up, never to an upgrade', () => {
    expect(standing(sol, free, () => false)).toBe('top-up')
  })

  it('leaves Hanzo’s own models to the plan', () => {
    expect(standing(zen, free, () => true)).toBe('upgrade')
    expect(standing(zen, () => true, () => false)).toBe('pick')
  })

  it('follows the plan for a host that has no balance to offer', () => {
    expect(standing(sol, free)).toBe('upgrade')
    expect(standing(sol)).toBe('pick')
  })
})
