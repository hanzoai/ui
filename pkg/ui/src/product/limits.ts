// Plan usage limits — `GET /v1/ai/limits`, the served-call headers and the
// billing refusals, read into one shape. Shares only: a percent per class and
// when it resets, never an amount or a count.
//
// Classes: `premium` is third-party frontier models, `ours` is Hanzo models
// (zen, enso, kai, jev), `free` is the free lane. State is `ok` below 80 %,
// `near` from 80 to 99 %, and `limited` when the class is used up and nothing
// else pays.
//
// No React, no gui: this loads in Node and in a server component.

export type LimitState = 'ok' | 'near' | 'limited'
export type LimitClass = 'premium' | 'ours' | 'free'
export type LimitPayer = 'plan' | 'prepaid' | 'credits' | 'none'
export type PaidBy = 'plan' | 'prepaid' | 'credits' | 'free'
export type LimitReason = 'plan_allowance_used' | 'paid_plan_required' | 'free_plan_cap' | 'insufficient_balance'

/** A share of one window: percent used, its state, and when it starts over. */
export interface LimitWindow {
  percent: number
  state: LimitState
  resets_at: string | null
}

/** One class over the billing period, who pays for it now, and its short window if any. */
export interface ClassLimit extends LimitWindow {
  paying: LimitPayer
  window?: LimitWindow
}

export interface LimitAction {
  kind: 'upgrade' | 'topup'
  label: string
  plan?: string
  url: string
}

export interface Limited {
  reason: string
  classes: LimitClass[]
  message: string
}

export interface Limits {
  /** The plan slug, or "" for a caller with no plan. */
  plan: string
  period_start?: string
  period_end?: string
  state: LimitState
  classes: Partial<Record<LimitClass, ClassLimit>>
  limited?: Limited
  actions: LimitAction[]
  upgrade?: string
}

/** What a served call's headers say. */
export interface Served {
  state: LimitState
  class: LimitClass | null
  paidBy: PaidBy | null
  /** The free model that answered in place of the one asked for. */
  fallback: string | null
  reason: string | null
}

/** A billing refusal: `{"error":{"type":"billing_error",…}}` on a 402 or 429. */
export interface Refusal {
  status: number
  code: string
  message: string
  class: LimitClass | null
  resets_at: string | null
  actions: LimitAction[]
  /** Seconds, from Retry-After on a 429. */
  retry: number | null
}

/** What the reader is told when a class is paused or refused. */
export interface LimitNotice {
  reason: string
  classes: LimitClass[]
  message: string
  actions: LimitAction[]
  resets_at: string | null
  fallback: string | null
  /** A billing refusal is part of it: the reader has been turned away, not only read as limited. */
  refused: boolean
}

export const CLASSES: readonly LimitClass[] = ['premium', 'ours', 'free']

export const CLASS_LABEL: Record<LimitClass, string> = {
  premium: 'Premium models',
  ours: 'Hanzo models',
  free: 'Free models',
}

const STATES: readonly LimitState[] = ['ok', 'near', 'limited']
const PAYERS: readonly LimitPayer[] = ['plan', 'prepaid', 'credits', 'none']
const PAID: readonly PaidBy[] = ['plan', 'prepaid', 'credits', 'free']
const RANK: Record<LimitState, number> = { ok: 0, near: 1, limited: 2 }

const text = (v: unknown): string | null => (typeof v === 'string' ? v : null)
const one = <T extends string>(set: readonly T[], v: unknown): T | null =>
  typeof v === 'string' && (set as readonly string[]).includes(v) ? (v as T) : null
const record = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null

/** The worse of two states. */
export const worst = (a: LimitState, b: LimitState): LimitState => (RANK[b] > RANK[a] ? b : a)

/** A percent as the bar draws it: a whole number from 0 to 100. */
const share = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(100, Math.max(0, Math.round(v))) : null

function windowOf(v: unknown): LimitWindow | null {
  const o = record(v)
  const percent = share(o?.percent)
  if (percent === null) return null
  return {
    percent,
    state: one(STATES, o?.state) ?? (percent >= 80 ? 'near' : 'ok'),
    resets_at: text(o?.resets_at),
  }
}

function classOfBody(v: unknown): ClassLimit | null {
  const w = windowOf(v)
  if (!w) return null
  const o = record(v)
  const short = windowOf(o?.window)
  return { ...w, paying: one(PAYERS, o?.paying) ?? 'plan', ...(short ? { window: short } : {}) }
}

export function actionsOf(v: unknown): LimitAction[] {
  if (!Array.isArray(v)) return []
  return v.flatMap((a): LimitAction[] => {
    const o = record(a)
    const kind = one(['upgrade', 'topup'] as const, o?.kind)
    const url = text(o?.url)
    if (!kind || !url) return []
    const plan = text(o?.plan)
    return [{ kind, label: text(o?.label) || (kind === 'upgrade' ? 'Upgrade' : 'Add prepaid credit'), url, ...(plan ? { plan } : {}) }]
  })
}

const classList = (v: unknown): LimitClass[] =>
  Array.isArray(v) ? v.flatMap((c) => (one(CLASSES, c) ? [c as LimitClass] : [])) : []

/**
 * `GET /v1/ai/limits`, checked field by field. A body without a string `plan`
 * is not an answer; a class without a numeric percent is left out rather than
 * drawn full or empty.
 */
export function limitsOf(body: unknown): Limits | null {
  const o = record(body)
  const plan = text(o?.plan)
  if (plan === null) return null
  const classes: Partial<Record<LimitClass, ClassLimit>> = {}
  const raw = record(o?.classes)
  for (const c of CLASSES) {
    const got = classOfBody(raw?.[c])
    if (got) classes[c] = got
  }
  const lim = record(o?.limited)
  const limited: Limited | undefined = lim
    ? { reason: text(lim.reason) ?? '', classes: classList(lim.classes), message: text(lim.message) ?? '' }
    : undefined
  const state =
    one(STATES, o?.state) ??
    Object.values(classes).reduce<LimitState>((s, c) => worst(s, c ? worst(c.state, c.window?.state ?? 'ok') : 'ok'), 'ok')
  return {
    plan,
    period_start: text(o?.period_start) ?? undefined,
    period_end: text(o?.period_end) ?? undefined,
    state,
    classes,
    ...(limited ? { limited } : {}),
    actions: actionsOf(o?.actions),
    upgrade: text(o?.upgrade) ?? undefined,
  }
}

/** The usage headers on a served call, or null when it carries none. */
export function servedOf(headers: { get(name: string): string | null }): Served | null {
  const usage = one(STATES, headers.get('x-hanzo-usage'))
  const fallback = headers.get('x-hanzo-fallback') || null
  if (!usage && !fallback) return null
  return {
    state: usage ?? 'limited',
    class: one(CLASSES, headers.get('x-hanzo-usage-class')),
    paidBy: one(PAID, headers.get('x-hanzo-paid-by')),
    fallback,
    reason: headers.get('x-hanzo-usage-reason') || null,
  }
}

/** A billing refusal's envelope, or null for any other error. */
export function refusalOf(body: unknown, status: number, retryAfter?: string | null): Refusal | null {
  const e = record(record(body)?.error)
  if (!e || e.type !== 'billing_error') return null
  const retry = retryAfter ? Number(retryAfter) : NaN
  return {
    status,
    code: text(e.code) ?? '',
    message: text(e.message) ?? '',
    class: one(CLASSES, e.class),
    resets_at: text(e.resets_at),
    actions: actionsOf(e.actions),
    retry: Number.isFinite(retry) ? retry : null,
  }
}

/**
 * Which class a model id bills to. Hanzo's own families are `ours`, anything
 * naming the free lane is `free`, and every other model is `premium`.
 */
export function classOf(id: string): LimitClass {
  const bare = id.toLowerCase().replace(/^hanzo\//, '')
  if (bare === 'free' || /(^|[-/:])free($|[-/:])/.test(bare)) return 'free'
  if (/^(zen|enso|kai|jev)([-.:/0-9]|$)/.test(bare)) return 'ours'
  return 'premium'
}

/** The headers and refusal heard since the limits were last read. */
export interface Heard {
  served: Served | null
  refusal: Refusal | null
}

/** The limits with what served calls said since they were read laid over them. */
export function overlay(limits: Limits | null, heard: Heard): Limits | null {
  if (!limits) return null
  const classes = { ...limits.classes }
  const { served, refusal } = heard
  if (served?.class && classes[served.class]) {
    const c = classes[served.class]!
    classes[served.class] = { ...c, state: served.state }
  }
  if (refusal?.class && classes[refusal.class]) {
    const c = classes[refusal.class]!
    classes[refusal.class] = { ...c, state: 'limited', paying: 'none', resets_at: refusal.resets_at ?? c.resets_at }
  }
  const state = Object.values(classes).reduce<LimitState>(
    (s, c) => worst(s, c ? worst(c.state, c.window?.state ?? 'ok') : 'ok'),
    heard.served || heard.refusal ? 'ok' : limits.state,
  )
  return { ...limits, classes, state: worst(state, refusal ? 'limited' : 'ok') }
}

/** The binding reset of a class: its short window's when that is the one used up. */
const resetOf = (c: ClassLimit | undefined): string | null =>
  !c ? null : c.window && RANK[c.window.state] > RANK[c.state] ? c.window.resets_at : c.resets_at

const earliest = (all: (string | null)[]): string | null =>
  all.reduce<string | null>((a, b) => (!b ? a : !a || Date.parse(b) < Date.parse(a) ? b : a), null)

/** "Premium models", "Premium and Hanzo models". */
export function classesLabel(classes: LimitClass[]): string {
  const names = CLASSES.filter((c) => classes.includes(c)).map((c) => CLASS_LABEL[c].replace(/ models$/, ''))
  if (!names.length) return 'Models'
  const last = names.pop()!
  return `${names.length ? `${names.join(', ')} and ${last}` : last} models`
}

/**
 * When a reset lands, as a sentence says it: a time for one within a day
 * ("5:00 PM"), else a date ("Oct 30"), periods being UTC days. "" for none.
 */
export function when(iso: string | null | undefined, now: number = Date.now()): string {
  const t = iso ? Date.parse(iso) : NaN
  if (Number.isNaN(t)) return ''
  const d = new Date(t)
  return t - now < 86_400_000
    ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : d.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' })
}

const PLAIN: Record<string, string> = {
  paid_plan_required: 'Premium models need a paid plan.',
  free_plan_cap: "You've used the free plan's usage for now.",
  insufficient_balance: 'Your prepaid credit has run out.',
}

/**
 * What to tell a reader whose usage is paused or refused, or null when nothing
 * is. A plan's included usage being used up reads as a pause until the reset;
 * any other reason is the server's own message. A fallback reply adds the free
 * model it was answered on, named by `name`.
 */
export function noticeOf(
  limits: Limits | null,
  heard: Heard,
  name: (id: string) => string = (id) => id,
  now: number = Date.now(),
): LimitNotice | null {
  const { served, refusal } = heard
  const fallback = served?.fallback ?? null
  const classes = new Set<LimitClass>(limits?.limited?.classes ?? [])
  for (const c of CLASSES) if (c !== 'free' && limits?.classes[c]?.state === 'limited') classes.add(c)
  if (refusal?.class) classes.add(refusal.class)
  if (fallback && served?.class && served.class !== 'free') classes.add(served.class)
  if (!refusal && !fallback && !limits?.limited && limits?.state !== 'limited') return null

  const list = CLASSES.filter((c) => classes.has(c))
  const reason = refusal?.code || limits?.limited?.reason || served?.reason || ''
  const resets = earliest([...list.map((c) => resetOf(limits?.classes[c])), refusal?.resets_at ?? null])
  const paused = reason === 'plan_allowance_used' || (!reason && list.length > 0)
  const until = when(resets, now)
  const said = paused
    ? `${classesLabel(list)} are paused${until ? ` until ${until}` : ''}.`
    : refusal?.message || limits?.limited?.message || PLAIN[reason] || 'Usage is paused for now.'
  return {
    reason,
    classes: list,
    message: fallback ? `${said} You're chatting on ${name(fallback)}.` : said,
    actions: limits?.actions.length ? limits.actions : (refusal?.actions ?? []),
    resets_at: resets,
    fallback,
    refused: refusal !== null,
  }
}

/** The one-line note for a class close to its included usage, or null. */
export function nearOf(limits: Limits | null, now: number = Date.now()): string | null {
  if (!limits || limits.state === 'limited') return null
  const near = CLASSES.filter((c) => {
    const k = limits.classes[c]
    return c !== 'free' && k && (k.state === 'near' || k.window?.state === 'near')
  })
  if (!near.length) return null
  const until = when(earliest(near.map((c) => resetOf(limits.classes[c]))), now)
  const what = classesLabel(near).replace(/ models$/, '').replace('Premium', 'premium')
  return `You're close to your plan's included ${what} model usage.${until ? ` Resets ${until}.` : ''}`
}
