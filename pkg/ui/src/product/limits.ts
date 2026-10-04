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
/** Who pays for a class now: the plan, the org's credits (once it opted in), the free lane, or nobody. */
export type LimitPayer = 'plan' | 'credits' | 'free' | 'none'
export type PaidBy = LimitPayer
export type LimitReason = 'plan_allowance_used' | 'paid_plan_required' | 'free_plan_cap' | 'insufficient_balance' | 'model_cap'
export type LimitActionKind = 'upgrade' | 'topup' | 'credits' | 'switch'

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

/**
 * A way past a limit, in the order the server sends them. `upgrade` and
 * `topup` are pages (`url`); `credits` is the org's opt-in to keep paying from
 * credits (`url` is the write, `PUT /v1/ai/limits`); `switch` names a model to
 * move the picker to.
 */
export interface LimitAction {
  kind: LimitActionKind
  label: string
  plan?: string
  url?: string
  model?: string
}

/** The actions that are pages a browser can simply open. */
export const navigable = (a: LimitAction): boolean => (a.kind === 'upgrade' || a.kind === 'topup') && Boolean(a.url)

export interface Limited {
  reason: string
  classes: LimitClass[]
  message: string
}

/** One model paused inside a class that is not: an exact id or a `*` glob (`anthropic/claude-opus*`). */
export interface PausedModel {
  model: string
  /** The model that answers in its place. */
  fallback?: string
  resets_at?: string | null
}

export interface Limits {
  /** The plan slug, or "" for a caller with no plan. */
  plan: string
  period_start?: string
  period_end?: string
  state: LimitState
  classes: Partial<Record<LimitClass, ClassLimit>>
  limited?: Limited
  /** Models paused one by one, by exact id or glob. */
  paused?: PausedModel[]
  actions: LimitAction[]
  upgrade?: string
  /** The org keeps paying from credits once included usage runs out; absent when the server does not say. */
  creditsAfterAllowance?: boolean
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
const PAYERS: readonly LimitPayer[] = ['plan', 'credits', 'free', 'none']
const KINDS: readonly LimitActionKind[] = ['upgrade', 'topup', 'credits', 'switch']
const LABEL: Record<LimitActionKind, string> = {
  upgrade: 'Upgrade',
  topup: 'Add prepaid credit',
  credits: 'Continue with credits',
  switch: 'Switch model',
}
const RANK: Record<LimitState, number> = { ok: 0, near: 1, limited: 2 }

const text = (v: unknown): string | null => (typeof v === 'string' ? v : null)
const one = <T extends string>(set: readonly T[], v: unknown): T | null =>
  typeof v === 'string' && (set as readonly string[]).includes(v) ? (v as T) : null
const record = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null

/** Whether the limits name a paid plan: the free plan answers `"free"`, a caller with none `""`. */
export const paidPlan = (l: Pick<Limits, 'plan'> | null | undefined): boolean => Boolean(l?.plan) && l?.plan !== 'free'

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
    const kind = one(KINDS, o?.kind)
    if (!kind) return []
    const url = text(o?.url) ?? undefined
    const model = text(o?.model) ?? undefined
    const plan = text(o?.plan) ?? undefined
    // A page with no address, or a switch to no model, is not an action.
    if ((kind === 'upgrade' || kind === 'topup') && !url) return []
    if (kind === 'switch' && !model) return []
    return [{ kind, label: text(o?.label) || LABEL[kind], ...(url ? { url } : {}), ...(model ? { model } : {}), ...(plan ? { plan } : {}) }]
  })
}

const classList = (v: unknown): LimitClass[] =>
  Array.isArray(v) ? v.flatMap((c) => (one(CLASSES, c) ? [c as LimitClass] : [])) : []

/**
 * `GET /v1/ai/limits`, checked field by field. A body without a string `plan`
 * is not an answer; a class without a numeric percent is left out rather than
 * drawn full or empty.
 */
function pausedOf(v: unknown): PausedModel[] {
  if (!Array.isArray(v)) return []
  return v.flatMap((p): PausedModel[] => {
    const o = record(p)
    const model = text(o?.model)
    if (!model) return []
    const fallback = text(o?.fallback)
    return [{ model, ...(fallback ? { fallback } : {}), resets_at: text(o?.resets_at) }]
  })
}

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
  const paused = pausedOf(o?.paused)
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
    ...(paused.length ? { paused } : {}),
    actions: actionsOf(o?.actions),
    upgrade: text(o?.upgrade) ?? undefined,
    ...(typeof o?.credits_after_allowance === 'boolean' ? { creditsAfterAllowance: o.credits_after_allowance } : {}),
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
    paidBy: one(PAYERS, headers.get('x-hanzo-paid-by')),
    fallback,
    reason: headers.get('x-hanzo-usage-reason') || null,
  }
}

/**
 * The two limit codes the gateway sends as a 429 `rate_limit_error` rather than a
 * `billing_error` (ai `routers/filter_balance.go` `limitReached`): they lift by
 * themselves at a reset, so the wire calls them rate limits. They are still the
 * plan speaking, and the reader is owed the same notice.
 */
const CAPS: readonly string[] = ['free_plan_cap', 'usage_cap_exceeded']

/** A billing refusal's envelope, or null for any other error. */
export function refusalOf(body: unknown, status: number, retryAfter?: string | null): Refusal | null {
  const e = record(record(body)?.error)
  if (!e) return null
  if (e.type !== 'billing_error' && !(e.type === 'rate_limit_error' && CAPS.includes(text(e.code) ?? ''))) return null
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
  insufficient_balance: 'Your credits have run out.',
}

/** A paused model as a sentence names it: a glob reads as its family ("claude-opus models"). */
const modelWords = (model: string, name: (id: string) => string): string =>
  model.endsWith('*') ? `${model.slice(0, -1).split('/').pop()?.replace(/[-.]$/, '')} models` : name(model)

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

  const reason = refusal?.code || limits?.limited?.reason || served?.reason || ''
  // One model capped inside a class that is not: the class stays open, so it is not listed.
  const capped =
    reason === 'model_cap'
      ? (limits?.paused?.find((p) => fallback !== null && p.fallback === fallback) ?? limits?.paused?.[0] ?? null)
      : null
  if (capped && served?.class) classes.delete(served.class)
  const list = CLASSES.filter((c) => classes.has(c))
  const resets = capped
    ? (capped.resets_at ?? refusal?.resets_at ?? null)
    : earliest([...list.map((c) => resetOf(limits?.classes[c])), refusal?.resets_at ?? null])
  const paused = reason === 'plan_allowance_used' || (!reason && list.length > 0)
  const until = when(resets, now)
  const said = capped
    ? `${modelWords(capped.model, name)} ${capped.model.endsWith('*') ? 'are' : 'is'} paused${until ? ` until ${until}` : ''}.`
    : paused
      ? `${classesLabel(list)} are paused${until ? ` until ${until}` : ''}.`
      : refusal?.message || limits?.limited?.message || PLAIN[reason] || 'Usage is paused for now.'
  return {
    reason,
    classes: list,
    message: fallback ? `${said} You're chatting on ${name(fallback)}.` : said,
    // A refusal names what is possible for the call it refused; the limits name the general case.
    actions: refusal?.actions.length ? refusal.actions : (limits?.actions ?? []),
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
