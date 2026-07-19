/**
 * @hanzo/ui-shadcn/models — Model catalog data layer
 *
 * Pure, SSR-safe helpers shared by the unified ModelSelector. No React,
 * no browser globals — usable on the server, in edge runtimes, or the client.
 *
 * ModelCatalogEntry is the gateway/OpenAI-shaped record ({ id, owned_by, ... })
 * returned by `${baseUrl}/models`. It is intentionally distinct from the
 * registry-shaped ZenModelLike in ./types (which drives the marketing cards).
 */

export interface ModelCatalogEntry {
  /** Gateway id, e.g. "claude-opus-4.8" */
  id: string
  /** e.g. "anthropic" | "openai" | "hanzo" | "deepseek" */
  owned_by?: string
  /** Optional explicit family label override */
  family?: string
  /** Display label; defaults to id */
  label?: string
  premium?: boolean
  /** "chat" (default) | "embedding" | "image" | ... */
  modality?: string
  context_window?: number
  description?: string
}

/** owned_by → display family. */
const OWNER_FAMILY: Record<string, string> = {
  hanzo: 'Zen',
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  deepseek: 'DeepSeek',
  alibaba: 'Qwen',
  qwen: 'Qwen',
  meta: 'Meta Llama',
  mistralai: 'Mistral',
  mistral: 'Mistral',
  google: 'Google Gemma',
  nvidia: 'NVIDIA',
  moonshot: 'Kimi',
}

/** House then marquee; everything else sorts alphabetically after these. */
const FAMILY_ORDER = ['Enso', 'Zen', 'Anthropic', 'OpenAI']

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
}

/** Infer a family from an id prefix. Returns undefined when nothing matches. */
function familyFromId(id: string): string | undefined {
  if (id.startsWith('enso')) return 'Enso'
  if (id.startsWith('zen')) return 'Zen'
  if (id.startsWith('claude')) return 'Anthropic'
  if (id.startsWith('gpt') || id === 'o1' || id.startsWith('o1-') || id.startsWith('o3')) return 'OpenAI'
  if (id.startsWith('qwen')) return 'Qwen'
  if (id.startsWith('llama')) return 'Meta Llama'
  if (id.startsWith('glm')) return 'GLM'
  if (id.startsWith('kimi')) return 'Kimi'
  if (id.startsWith('deepseek')) return 'DeepSeek'
  if (id.startsWith('mistral')) return 'Mistral'
  if (id.startsWith('gemma')) return 'Google Gemma'
  if (id.startsWith('nemotron')) return 'NVIDIA'
  if (id.startsWith('minimax')) return 'MiniMax'
  if (id.startsWith('mimo')) return 'MiMo'
  return undefined
}

/**
 * Resolve the display family of a model.
 * Precedence: explicit `family` → enso id (house split, beats owned_by) →
 * owned_by map → llama id under any owner → capitalized owned_by → id prefix → "Other".
 */
export function familyOf(m: ModelCatalogEntry): string {
  const explicit = m.family?.trim()
  if (explicit) return explicit

  const id = (m.id ?? '').toLowerCase()
  // Enso ids form their own house family regardless of owned_by.
  if (id.startsWith('enso')) return 'Enso'

  const owned = m.owned_by?.toLowerCase().trim()
  if (owned) {
    const byOwner = OWNER_FAMILY[owned]
    if (byOwner) return byOwner
    // llama* ids resolve to Meta Llama even under a different owner.
    const byId = familyFromId(id)
    if (byId) return byId
    return capitalize(owned)
  }

  return familyFromId(id) ?? 'Other'
}

function orderFamilies(a: string, b: string): number {
  const ia = FAMILY_ORDER.indexOf(a)
  const ib = FAMILY_ORDER.indexOf(b)
  if (ia !== -1 || ib !== -1) {
    if (ia === -1) return 1
    if (ib === -1) return -1
    return ia - ib
  }
  return a.localeCompare(b)
}

/**
 * Group models by family, ordered house-then-marquee-then-alphabetical.
 * Model order within each family is the input order (stable).
 */
export function groupModelsByFamily(
  models: ModelCatalogEntry[],
): { family: string; models: ModelCatalogEntry[] }[] {
  const byFamily = new Map<string, ModelCatalogEntry[]>()
  for (const m of models) {
    const fam = familyOf(m)
    const arr = byFamily.get(fam)
    if (arr) arr.push(m)
    else byFamily.set(fam, [m])
  }
  return Array.from(byFamily.keys())
    .sort(orderFamilies)
    .map((family) => ({ family, models: byFamily.get(family)! }))
}

/** Modality/id keywords that mark a model as NOT chat-capable. */
const NON_CHAT = [
  'embedding',
  'embed',
  'image',
  'video',
  'music',
  'voice',
  'tts',
  'rerank',
  'guard',
  'foley',
  'moderation',
  'router',
]

/**
 * True when a model can be used for chat. Excludes embedding/image/video/
 * music/voice/tts/rerank/guard/foley/moderation/router by explicit modality
 * or by an id-segment heuristic.
 */
export function isChatModel(m: ModelCatalogEntry): boolean {
  const modality = (m.modality ?? '').toLowerCase().trim()
  if (modality && NON_CHAT.some((k) => modality.includes(k))) return false
  const id = (m.id ?? '').toLowerCase()
  if (NON_CHAT.some((k) => id.includes(k))) return false
  return true
}

/** Keep only chat-capable models. */
export function filterChatModels(models: ModelCatalogEntry[]): ModelCatalogEntry[] {
  return models.filter(isChatModel)
}

/**
 * Fetch a model catalog from an OpenAI-shaped `/models` endpoint.
 * SSR-safe: uses global fetch, no browser globals, no caching/state —
 * consumers own caching. Throws on a non-2xx response.
 */
export async function fetchModelCatalog(
  baseUrl?: string,
  token?: string,
): Promise<ModelCatalogEntry[]> {
  const base = (baseUrl ?? 'https://api.hanzo.ai/v1').replace(/\/+$/, '')
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${base}/models`, { headers })
  if (!res.ok) {
    throw new Error(`fetchModelCatalog: ${res.status} ${res.statusText}`)
  }

  const json: unknown = await res.json()
  const rows: any[] = Array.isArray(json)
    ? json
    : Array.isArray((json as { data?: unknown })?.data)
      ? (json as { data: any[] }).data
      : []

  return rows
    .map((d): ModelCatalogEntry => ({
      id: String(d.id),
      owned_by: d.owned_by ?? d.ownedBy ?? undefined,
      family: d.family ?? undefined,
      label: d.label ?? d.name ?? undefined,
      premium: d.premium ?? undefined,
      modality: d.modality ?? undefined,
      context_window: d.context_window ?? d.contextWindow ?? d.context ?? undefined,
      description: d.description ?? undefined,
    }))
    .filter((m) => m.id && m.id !== 'undefined')
}
