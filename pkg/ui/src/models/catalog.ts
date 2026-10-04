/**
 * @hanzo/ui/models — the model catalog, as `GET /v1/models` answers it.
 *
 * Pure and SSR-safe: no React, no browser globals. The picker and every host's
 * explorer read the same rows through the same helpers, so a model is in the
 * same group, with the same label and the same price, on every surface.
 *
 * Every fact here is a field the gateway publishes — `class`, `family`,
 * `inputs`, `outputs`, `supports_*`, `pricing`. Nothing is read from an id's
 * spelling. A field the gateway leaves out is absent here too: a model with no
 * price has no price, never a price of zero.
 */
import type { PausedModel } from '../product/limits'

/** The class a model is sold in, as the usage policy reads it. */
export type ModelClass = 'premium' | 'ours' | 'free'

/** Hanzo's own families. Every other model is grouped by who made it. */
export type ModelFamily = 'enso' | 'zen' | 'kai' | 'jev' | 'zoo'

/** What a model can be asked to do, from the modalities and capabilities it publishes. */
export type Capability =
  | 'chat'
  | 'vision'
  | 'embeddings'
  | 'rerank'
  | 'image'
  | 'video'
  | 'audio'
  | 'transcription'
  | 'decision'
  | 'tools'
  | 'reasoning'

/** List price, USD per 1M tokens, each side absent when the gateway lists none. */
export interface ModelPricing {
  input_per_million?: number
  output_per_million?: number
}

/** One row of `GET /v1/models`. */
export interface ModelCatalogEntry {
  id: string
  /** Who made it: "anthropic", "openai", "zenlm", "hanzo", … */
  owned_by?: string
  name?: string
  description?: string
  class?: ModelClass
  family?: ModelFamily
  premium?: boolean
  /** Release time, Unix seconds. */
  created?: number
  context_window?: number
  max_output_tokens?: number
  /** Input modalities: "text", "image", "audio", "file", "video". */
  inputs?: string[]
  /** What it answers with: "text", "image", "audio", "transcript", "embeddings", "rerank", "decision". */
  outputs?: string[]
  supports_vision?: boolean
  supports_tools?: boolean
  supports_reasoning?: boolean
  pricing?: ModelPricing
  /** Absent, anyone may call it. `research`: it exists and nobody can call it yet. */
  access?: 'research'
  /** Where a person asks for access to a model they cannot call. */
  request?: string
}

/**
 * The models that exist and cannot be called, said once for every list of
 * models: a picker draws each one disabled, a catalogue page draws it muted.
 * `/v1/models` never answers for one, so nothing can route to it.
 */
export const RESEARCH: ModelCatalogEntry[] = [
  {
    id: 'zen7',
    owned_by: 'zenlm',
    family: 'zen',
    name: 'Zen 7',
    access: 'research',
    request: 'https://hanzo.ai/research-access',
    description: 'The next open-weight generation after Zen 6, in research preview.',
  },
]

/** The catalog with the research models it does not already list, appended. */
export function withResearch(models: readonly ModelCatalogEntry[]): ModelCatalogEntry[] {
  const ids = new Set(models.map((m) => m.id))
  return [...models, ...RESEARCH.filter((m) => !ids.has(m.id))]
}

// ── reading the wire ─────────────────────────────────────────────────────────

const CLASSES: readonly ModelClass[] = ['premium', 'ours', 'free']
const FAMILY_IDS: readonly ModelFamily[] = ['enso', 'zen', 'kai', 'jev', 'zoo']

const str = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v : undefined)
const num = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined)
const pos = (v: unknown): number | undefined => {
  const n = num(v)
  return n !== undefined && n > 0 ? n : undefined
}
const yes = (v: unknown): true | undefined => (v === true ? true : undefined)
const strs = (v: unknown): string[] | undefined => {
  if (!Array.isArray(v)) return undefined
  const out = v.filter((x): x is string => typeof x === 'string' && x.trim() !== '').map((x) => x.toLowerCase())
  return out.length ? out : undefined
}
const oneOf = <T extends string>(set: readonly T[], v: unknown): T | undefined =>
  typeof v === 'string' && (set as readonly string[]).includes(v) ? (v as T) : undefined

function pricingOf(v: unknown): ModelPricing | undefined {
  if (!v || typeof v !== 'object') return undefined
  const p = v as Record<string, unknown>
  const input = num(p.input_per_million)
  const output = num(p.output_per_million)
  if (input === undefined && output === undefined) return undefined
  return {
    ...(input !== undefined && input >= 0 ? { input_per_million: input } : {}),
    ...(output !== undefined && output >= 0 ? { output_per_million: output } : {}),
  }
}

/** One row, checked field by field: it is a network response. Null without an id. */
export function modelOf(v: unknown): ModelCatalogEntry | null {
  if (!v || typeof v !== 'object') return null
  const r = v as Record<string, unknown>
  const id = str(r.id)
  if (!id) return null
  const m: ModelCatalogEntry = { id }
  const set = <K extends keyof ModelCatalogEntry>(k: K, val: ModelCatalogEntry[K] | undefined) => {
    if (val !== undefined) m[k] = val
  }
  set('owned_by', str(r.owned_by))
  set('name', str(r.name))
  set('description', str(r.description))
  set('class', oneOf(CLASSES, r.class))
  set('family', oneOf(FAMILY_IDS, r.family))
  set('premium', typeof r.premium === 'boolean' ? r.premium : undefined)
  set('created', pos(r.created))
  set('context_window', pos(r.context_window))
  set('max_output_tokens', pos(r.max_output_tokens))
  set('inputs', strs(r.inputs))
  set('outputs', strs(r.outputs))
  set('supports_vision', yes(r.supports_vision))
  set('supports_tools', yes(r.supports_tools))
  set('supports_reasoning', yes(r.supports_reasoning))
  set('pricing', pricingOf(r.pricing))
  return m
}

/**
 * The catalog from a `/v1/models` body (`{data: [...]}`) or its `data` array.
 * Rows without an id are dropped; a repeated id keeps its first row.
 */
export function parseModels(body: unknown): ModelCatalogEntry[] {
  const rows = Array.isArray(body)
    ? body
    : body && typeof body === 'object' && Array.isArray((body as { data?: unknown }).data)
      ? ((body as { data: unknown[] }).data)
      : []
  const seen = new Set<string>()
  const out: ModelCatalogEntry[] = []
  for (const row of rows) {
    const m = modelOf(row)
    if (!m || seen.has(m.id)) continue
    seen.add(m.id)
    out.push(m)
  }
  return out
}

/**
 * Fetch the catalog from an OpenAI-shaped `/models` endpoint. No caching, no
 * state: the host owns both. Throws on a non-2xx answer.
 */
export async function fetchModelCatalog(baseUrl?: string, token?: string): Promise<ModelCatalogEntry[]> {
  const base = (baseUrl ?? 'https://api.hanzo.ai/v1').replace(/\/+$/, '')
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${base}/models`, { headers })
  if (!res.ok) throw new Error(`fetchModelCatalog: ${res.status} ${res.statusText}`)
  return parseModels(await res.json())
}

// ── what a model is ──────────────────────────────────────────────────────────

/** The families, in the order every surface leads with them. */
export const FAMILIES: readonly { id: ModelFamily; label: string }[] = [
  { id: 'enso', label: 'Enso' },
  { id: 'zen', label: 'Zen' },
  { id: 'kai', label: 'Kai' },
  { id: 'jev', label: 'Jev' },
  { id: 'zoo', label: 'Zoo' },
]

export const CLASS_NAMES: Record<ModelClass, string> = {
  premium: 'Premium',
  ours: 'Hanzo',
  free: 'Free',
}

/** The makers whose name is not their id capitalized. */
const MAKERS: Record<string, string> = {
  'aion-labs': 'Aion Labs',
  'arcee-ai': 'Arcee AI',
  'bytedance-seed': 'ByteDance Seed',
  'dots-studio': 'dots.studio',
  'ibm-granite': 'IBM Granite',
  'inference-net': 'Inference.net',
  'meta-llama': 'Meta Llama',
  'nex-agi': 'Nex AGI',
  'prism-ml': 'Prism ML',
  'x-ai': 'xAI',
  'z-ai': 'Z.ai',
  ai21: 'AI21',
  anthropic: 'Anthropic',
  bytedance: 'ByteDance',
  cognitivecomputations: 'Cognitive Computations',
  deepseek: 'DeepSeek',
  inclusionai: 'inclusionAI',
  minimax: 'MiniMax',
  mistralai: 'Mistral AI',
  moonshotai: 'Moonshot AI',
  nousresearch: 'Nous Research',
  nvidia: 'NVIDIA',
  openai: 'OpenAI',
  openrouter: 'OpenRouter',
  rekaai: 'Reka AI',
  thedrummer: 'TheDrummer',
  thinkingmachines: 'Thinking Machines',
  typesafe: 'TypeSafe',
  zenlm: 'Zen LM',
}

/** Who made a model, as the catalog keys it: `owned_by`, lowercased, without OpenRouter's `~` alias mark. */
export function makerOf(m: Pick<ModelCatalogEntry, 'owned_by'>): string {
  return (m.owned_by ?? '').trim().replace(/^~/, '').toLowerCase() || 'other'
}

/** A maker's display name. */
export function makerName(maker: string): string {
  return (
    MAKERS[maker] ??
    maker
      .split(/[-_]/)
      .filter(Boolean)
      .map((w) => w[0]!.toUpperCase() + w.slice(1))
      .join(' ')
  )
}

/** The name a model is shown by: the catalog's name, else its id. */
export function modelName(m: Pick<ModelCatalogEntry, 'id' | 'name'>): string {
  return m.name ?? m.id
}

/** The group a model is listed in: its Hanzo family, else its maker. */
export interface ModelGroup {
  /** `family:zen`, `maker:anthropic`. */
  key: string
  label: string
  family?: ModelFamily
  models: ModelCatalogEntry[]
}

export function groupKey(m: ModelCatalogEntry): string {
  return m.family ? `family:${m.family}` : `maker:${makerOf(m)}`
}

export function groupLabel(m: ModelCatalogEntry): string {
  const f = m.family && FAMILIES.find((x) => x.id === m.family)
  return f ? f.label : makerName(makerOf(m))
}

/**
 * Models in groups: Hanzo's families first, in FAMILIES order, then every maker
 * by name. Models keep the order they came in, so the caller sorts first.
 */
export function groupModels(models: readonly ModelCatalogEntry[]): ModelGroup[] {
  const groups = new Map<string, ModelGroup>()
  for (const m of models) {
    const key = groupKey(m)
    let g = groups.get(key)
    if (!g) {
      g = { key, label: groupLabel(m), ...(m.family ? { family: m.family } : {}), models: [] }
      groups.set(key, g)
    }
    g.models.push(m)
  }
  const rank = (g: ModelGroup) => (g.family ? FAMILIES.findIndex((f) => f.id === g.family) : FAMILIES.length)
  return [...groups.values()].sort((a, b) => rank(a) - rank(b) || a.label.localeCompare(b.label))
}

const has = (list: string[] | undefined, ...want: string[]) => !!list && want.some((w) => list.includes(w))

/**
 * What a model can do, read from what it publishes. A model that names no
 * outputs is read as a text model, the way the gateway serves it.
 */
export function capabilitiesOf(m: ModelCatalogEntry): Capability[] {
  const out: Capability[] = []
  const embeddings = has(m.outputs, 'embeddings', 'embedding')
  const rerank = has(m.outputs, 'rerank')
  const decision = has(m.outputs, 'decision')
  const text = !m.outputs || has(m.outputs, 'text')
  if (text && !embeddings && !rerank && !decision) out.push('chat')
  if (m.supports_vision || has(m.inputs, 'image')) out.push('vision')
  if (embeddings) out.push('embeddings')
  if (rerank) out.push('rerank')
  if (has(m.outputs, 'image')) out.push('image')
  if (has(m.outputs, 'video')) out.push('video')
  if (has(m.outputs, 'audio')) out.push('audio')
  if (has(m.outputs, 'transcript')) out.push('transcription')
  if (decision) out.push('decision')
  if (m.supports_tools) out.push('tools')
  if (m.supports_reasoning) out.push('reasoning')
  return out
}

export function can(m: ModelCatalogEntry, c: Capability): boolean {
  return capabilitiesOf(m).includes(c)
}

export const CAPABILITY_NAMES: Record<Capability, string> = {
  chat: 'Chat',
  vision: 'Vision',
  embeddings: 'Embeddings',
  rerank: 'Rerank',
  image: 'Image',
  video: 'Video',
  audio: 'Speech',
  transcription: 'Transcription',
  decision: 'Decision',
  tools: 'Tools',
  reasoning: 'Reasoning',
}

/** What `isPaused` reads of the payer's plan usage (`Limits` from `@hanzo/ui/product/limits`). */
export interface PauseSource {
  classes: Partial<Record<ModelClass, { state: string }>>
  paused?: readonly Pick<PausedModel, 'model'>[]
}

/** Whether `id` matches a paused entry: the same id, or a glob whose `*` stands for any run of characters. */
export function matchesPaused(id: string, pattern: string): boolean {
  if (!pattern.includes('*')) return id === pattern
  const parts = pattern.split('*')
  if (!id.startsWith(parts[0]!) || !id.endsWith(parts.at(-1)!)) return false
  let at = parts[0]!.length
  const end = id.length - parts.at(-1)!.length
  for (const part of parts.slice(1, -1)) {
    const i = id.indexOf(part, at)
    if (i < 0 || i + part.length > end) return false
    at = i + part.length
  }
  return at <= end
}

/**
 * Whether the payer's plan has paused this model: its whole class is limited,
 * or an entry in `paused` names it. It is still listed and still picked; the
 * gateway refuses it or answers from Enso.
 */
export function isPaused(m: Pick<ModelCatalogEntry, 'id' | 'class'>, limits: PauseSource | null | undefined): boolean {
  if (!limits) return false
  if (m.class && limits.classes[m.class]?.state === 'limited') return true
  return !!limits.paused?.some((p) => matchesPaused(m.id, p.model))
}

/** Case-insensitive search: every word of the query appears in the model's id, name, maker, group or description. */
export function matchesModel(m: ModelCatalogEntry, query: string): boolean {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (!words.length) return true
  const hay = [m.id, m.name, makerOf(m), makerName(makerOf(m)), groupLabel(m), m.description]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return words.every((w) => hay.includes(w))
}

export type ModelSort = 'name' | 'newest' | 'context' | 'price'

/** A sorted copy. Context and price put models without the figure last. */
export function sortModels(models: readonly ModelCatalogEntry[], by: ModelSort = 'name'): ModelCatalogEntry[] {
  const name = (a: ModelCatalogEntry, b: ModelCatalogEntry) => modelName(a).localeCompare(modelName(b))
  const last = (v: number | undefined, dir: 1 | -1) => (v === undefined ? Infinity : dir * v)
  return [...models].sort((a, b) => {
    switch (by) {
      case 'newest':
        return (b.created ?? 0) - (a.created ?? 0) || name(a, b)
      case 'context':
        return last(a.context_window, -1) - last(b.context_window, -1) || name(a, b)
      case 'price':
        return last(a.pricing?.input_per_million, 1) - last(b.pricing?.input_per_million, 1) || name(a, b)
      default:
        return name(a, b)
    }
  })
}

// ── where a conversation starts ──────────────────────────────────────────────

/** The house router: what a conversation is answered by until a model is picked. */
export const ENSO = 'enso-auto'

/**
 * The model a new conversation, run or playground tab starts on: Enso for a
 * conversation, else the first of Hanzo's own models that does what the scope
 * asks, else the first free or Hanzo model that does. Never a premium model,
 * and never a research preview: a person picks those. '' when nothing qualifies.
 */
export function defaultModel(models: readonly ModelCatalogEntry[], scope: Capability = 'chat'): string {
  const offered = models.filter((m) => m.access !== 'research' && m.class !== 'premium' && can(m, scope))
  if (scope === 'chat' && offered.some((m) => m.id === ENSO)) return ENSO
  for (const f of FAMILIES) {
    const ours = sortModels(offered.filter((m) => m.family === f.id))
    if (ours.length) return ours[0]!.id
  }
  return sortModels(offered)[0]?.id ?? ''
}

// ── how a figure reads ───────────────────────────────────────────────────────

/** "200K", "1M", "1.5M"; "" when the catalog states no window. */
export function formatContext(n: number | undefined): string {
  if (!n) return ''
  if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000) return `${Math.round(n / 1000)}K`
  return String(n)
}

/** "$3.00" per 1M tokens, "Free" at zero, "" when the catalog lists no price. */
export function formatPrice(n: number | undefined): string {
  if (n === undefined) return ''
  if (n === 0) return 'Free'
  return n < 0.01 ? `$${+n.toPrecision(2)}` : `$${n.toFixed(2)}`
}
