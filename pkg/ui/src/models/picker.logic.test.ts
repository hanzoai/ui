import { describe, expect, it } from 'vitest'

import { defaultModel, ENSO, parseModels, type ModelCatalogEntry } from './catalog'
import { modelCount, pickerRows, restable, revealTop, visibleRange } from './picker.logic'

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
