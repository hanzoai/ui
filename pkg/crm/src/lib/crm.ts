/**
 * CRM API — the org's records, the mail the cloud files on them, and the drip.
 *
 * The CRM is not its own service. Its records are collections of the org's Base
 * (hanzoai/base module `crm`, installed when the org is given the beta), served by
 * Base's own record routes under /v1/base, which authorise every read and write by
 * the caller's IAM role in the org, and which search, filter, sort and page on the
 * server:
 *
 *   GET          /v1/base/collections/:name              a collection's fields, labels and options
 *   GET          /v1/base/collections/:name/records      one page, by Base filter and sort
 *   GET, POST, PATCH, DELETE  …/records[/:id]           one record
 *   POST         /v1/base/modules/crm                    grow the org's CRM to the module this cloud ships
 *
 * Mail and outreach are the cloud's: every message the org sends (POST /v1/email,
 * POST /v1/marketing/mail, a sequence's step) is filed on the recipient's record as
 * an `email` activity (cloud apps/crm FileMail) and refused for an address on the
 * org's suppression list. Sequences are cloud apps/marketing's drip: a sequence's
 * steps, made active, and the addresses enrolled in it.
 *
 * Whether the org has the CRM at all is its `crm` enablement, the beta (`beta`);
 * an org without the module answers 404 for every collection here.
 */
import type { BaseClient, BaseListResult, BaseRecord, ListRecordsParams } from './base-data/api'
import type { BaseCollection } from './base-data/fields'
import { paragraphs, plain } from './base-data/html'
import { ApiError, currentOrg, host, restDelete, restGet, restPost, v1Url } from './host'

const enc = encodeURIComponent

/** The org's Base, as the host reaches it: at the API's own address, like every CRM call. */
const base = (): BaseClient => host().base()

// ── Coercion helpers ────────────────────────────────────────────────────────
const str = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : String(v))
const num = (v: unknown): number => {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v)
  return 0
}
const asRecord = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}

/**
 * A time as epoch seconds. Base writes a date as "2026-10-18 21:30:00.000Z" (UTC), and
 * a calendar string without a zone is read as UTC too, never in the browser's zone.
 */
export const time = (v: unknown): number => {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  const s = str(v).trim()
  if (!s) return 0
  const iso = /^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d(\.\d+)?Z?$/.test(s) ? `${s.replace(' ', 'T').replace(/Z?$/, 'Z')}` : s
  const t = Date.parse(iso)
  return Number.isFinite(t) ? Math.floor(t / 1000) : 0
}

/** A time as Base stores a date: "2026-10-30 14:05:00.000Z". */
export const stamp = (d: Date = new Date()): string => d.toISOString().replace('T', ' ')

// An editor field's HTML and its text live with the rest of Base's field shapes.
export { paragraphs, plain }

// ── Mail ────────────────────────────────────────────────────────────────────

/** A filed mail's state, as the cloud writes it in `data.status`. */
export type MailStatus = 'sent' | 'suppressed' | 'failed' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained'
const MAIL_STATUSES: readonly MailStatus[] = ['sent', 'suppressed', 'failed', 'delivered', 'opened', 'clicked', 'bounced', 'complained']
/** A status the cloud names, or `sent` for a mail with none. */
const mailStatus = (v: unknown): MailStatus => MAIL_STATUSES.find((m) => m === v) ?? 'sent'
/** Whether a status means the mail reached the inbox. */
export const reached = (s: MailStatus): boolean => s === 'delivered' || s === 'opened' || s === 'clicked'

export type EmailMessageRecord = {
  id: string
  org?: string
  status: 'queued' | 'sent' | 'delivered' | 'failed'
  from?: string
  to: string[]
  subject?: string
  text?: string
  html?: string
  provider?: string
  created_at: string
  error?: string
  /** The rail's own id for the message (SES MessageId, SendGrid X-Message-Id). */
  provider_id?: string
}

/** One recipient POST /v1/email would not send to, and why (suppressed, invalid…). */
export type EmailRefusal = { address: string; status: number; reason: string }

/** POST /v1/email's answer: one message per recipient it sent to, and each it refused. */
export type EmailSend = { messages: EmailMessageRecord[]; refused: EmailRefusal[] }

/** The refusals as the route answers them; anything malformed is dropped. */
export function refusalsOf(raw: unknown): EmailRefusal[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((x) => {
    const r = asRecord(x)
    const address = str(r.address)
    return address ? [{ address, status: num(r.status) || 422, reason: str(r.reason) }] : []
  })
}

export type SendEmailInput = {
  from?: string
  to: string[]
  subject: string
  text?: string
  html?: string
  provider?: string
  headers?: Record<string, string>
}

/**
 * An address as POST /v1/email/verify judged it. `unverified` is the verifier not
 * answering (signed out, limited, unreachable): it is never read as a pass.
 */
export type Verification = {
  email: string
  status: 'verified' | 'invalid' | 'disposable' | 'unverified'
  /** Every check asked for passed. */
  valid: boolean
  reachable: 'yes' | 'no' | 'unknown'
  /** The first check that did not pass, or why nothing was checked. */
  reason: string
  domain?: string
  hasMx: boolean
  disposable: boolean
  role: boolean
  free: boolean
  suggestion?: string
}

/** POST /v1/email/verify's answer (cloud apps/email types.go). */
type CheckWire = { status: 'pass' | 'fail' | 'unknown' | 'skipped'; reason?: string }
export type VerifyWire = {
  email: string
  checks?: {
    syntax?: CheckWire & { username?: string; domain?: string }
    domain?: CheckWire
    mx?: CheckWire & { records?: string[] }
    classification?: CheckWire & { disposable?: boolean; free?: boolean; role?: boolean }
    smtp?: CheckWire & { deliverable?: boolean; catch_all?: boolean }
  }
  suggestions?: { email: string; reason: string }[]
}

/** Why the verifier gave no answer, in the reason a caller shows. */
const unanswered = (e: unknown): string =>
  e instanceof ApiError && e.status === 401 ? 'sign_in_required' : e instanceof ApiError && e.status === 429 ? 'rate_limited' : 'verifier_unreachable'

/** The answer read: the first failing check decides; a check that could not run leaves the address unverified. */
export function judge(email: string, w: VerifyWire): Verification {
  const c = w.checks ?? {}
  const asked = [c.syntax, c.domain, c.mx, c.smtp].filter(Boolean) as CheckWire[]
  const failed = asked.find((x) => x.status === 'fail')
  const disposable = Boolean(c.classification?.disposable)
  const open = asked.some((x) => x.status === 'unknown')
  const status: Verification['status'] = failed ? 'invalid' : disposable ? 'disposable' : open || asked.length === 0 ? 'unverified' : 'verified'
  return {
    email,
    status,
    valid: status === 'verified',
    reachable: status === 'verified' ? 'yes' : status === 'unverified' ? 'unknown' : 'no',
    reason: failed?.reason || (disposable ? 'disposable_domain' : open ? 'check_inconclusive' : status === 'verified' ? 'ok' : 'nothing_checked'),
    domain: c.syntax?.domain,
    hasMx: c.mx?.status === 'pass',
    disposable,
    role: Boolean(c.classification?.role),
    free: Boolean(c.classification?.free),
    suggestion: w.suggestions?.[0]?.email,
  }
}

// ── The timeline ────────────────────────────────────────────────────────────

/** Whose timeline: a record by the relation an activity names it by, or a person not yet a record by their address. */
export type Whose = { person?: string; company?: string; opportunity?: string; candidate?: string; email?: string }

/**
 * The activities filter for a timeline. A candidate's is read by its own relation:
 * asked by none of these, it read the mail filed to an empty address, which is
 * nothing, so a logged call or meeting, and the application itself, never showed
 * (hanzo-inc/cloud#478).
 */
export function timelineFilter(who: Whose): string {
  const q = (v: string) => v.replace(/["\\]/g, '')
  if (who.person) return `person = "${q(who.person)}"`
  if (who.company) return `company = "${q(who.company)}"`
  if (who.opportunity) return `opportunity = "${q(who.opportunity)}"`
  if (who.candidate) return `candidate = "${q(who.candidate)}"`
  return `data.to = "${q((who.email || '').trim().toLowerCase())}"`
}

/** One entry of a record's timeline: an activity the cloud or the team filed, newest first. */
export type TimelineEvent = {
  id: string
  /** email, form, note, call, meeting… */
  kind: string
  /** out for a mail the org sent, in for one it received. */
  direction: string
  subject: string
  snippet: string
  /** The activity's own text, as plain text. */
  body: string
  /** Unix seconds. */
  at: number
  to: string
  by: string
  /** sent until a report arrives; suppressed or failed when it never left. */
  status: MailStatus
  /** The rail it left by (ses, sendgrid, mail…). */
  rail: string
  /** Why it was suppressed, failed or bounced. */
  reason: string
  /** Every report in order: delivered, opened, clicked, bounced… */
  events: { status: MailStatus; at: number }[]
  /** A form's answers as filed, question by question. */
  answers: { question: string; answer: string }[]
}

/** What a form filed beside its answers, worth showing: the fields a person typed. */
const FORM_FIELDS = [
  'company', 'role', 'size', 'need', 'message', 'transcript', 'plan', 'seats',
  'rating', 'comment', 'surface', 'article', 'priority', 'program', 'source',
  'public_id', 'website', 'country', 'amount',
]

export function normalizeTimelineEvent(raw: unknown): TimelineEvent {
  const r = asRecord(raw)
  const d = asRecord(r.data)
  const answers = Array.isArray(d.answers)
    ? d.answers.map((a) => asRecord(a)).map((a) => ({ question: str(a.question).trim(), answer: str(a.answer).trim() })).filter((a) => a.question && a.answer)
    : []
  const filed = str(r.kind) === 'form' ? FORM_FIELDS.filter((k) => str(d[k]).trim()).map((k) => ({ question: k[0].toUpperCase() + k.slice(1), answer: str(d[k]).trim() })) : []
  return {
    id: str(r.id),
    kind: str(r.kind),
    direction: str(r.direction),
    subject: str(r.subject),
    snippet: str(r.snippet),
    body: plain(str(r.body)),
    at: time(r.at) || time(r.created) || time(r.createdAt),
    to: str(d.to),
    by: str(d.by) || str(asRecord(r.created_by).name),
    status: mailStatus(d.status),
    rail: str(d.rail),
    reason: str(d.reason),
    events: Array.isArray(d.events)
      ? d.events.map((x) => asRecord(x)).map((x) => ({ status: mailStatus(x.status), at: time(x.at) })).filter((x) => x.at > 0)
      : [],
    answers: [...filed, ...answers],
  }
}

// ── Sequences and the send gate (cloud apps/marketing) ─────────────────────

/**
 * A drip sequence as cloud apps/marketing keeps it. An audience send is a one-step
 * sequence the audience is enrolled into — the drip engine, the suppression gate and
 * the signed unsubscribe footer are the delivery; there is no separate blast.
 */
export type Sequence = { id: string; name: string; status: 'draft' | 'active' | 'archived'; createdAt: number; updatedAt: number }

/** One message of a sequence: `delaySeconds` after the previous step (after enrollment for the first). */
export type SequenceStep = { id: string; sequenceId: string; idx: number; delaySeconds: number; subject: string; body: string; createdAt: number }

/** One person walking a sequence: `active` until its last step is due and taken, then `completed`; or `canceled`. */
export type Enrollment = {
  id: string
  sequenceId: string
  address: string
  channel: string
  currentStep: number
  status: 'active' | 'completed' | 'canceled'
  /** Unix seconds the current step comes due; 0 once the walk is done. */
  nextRunAt: number
  enrolledAt: number
  updatedAt: number
}

/** A saved cohort: no `event` is every mailable customer in the org. */
export type Audience = { id: string; name: string; event: string; windowDays: number; createdAt: number; updatedAt: number }

/** An enroll's fan-out: how many the request named, started now, and had already taken. */
export type EnrollResult = { resolved: number; enrolled: number; alreadyEnrolled: number; enrollmentId?: string }

/** The cloud's `{data}` page, or nothing. */
const dataOf = <T>(r: unknown): T[] => {
  const d = asRecord(r).data
  return Array.isArray(d) ? (d as T[]) : []
}

/** One opt-out as the cloud keeps it (apps/marketing suppress.go): (channel, address) is the key, per org. */
export type MarketingSuppression = {
  channel: string
  address: string
  /** Free text; the one-click footer link records "one-click unsubscribe". */
  reason: string
  /** Unix seconds. */
  createdAt: number
}

/**
 * Whether the org's send gate refuses one address
 * (GET /v1/marketing/suppressions/check?address=). `scope` says which list refused
 * it: the address itself, its company domain, or the platform's blocklist. A cloud
 * without the check answers 404, and that is `unknown` — never "not suppressed".
 */
export type SuppressionCheck =
  | { state: 'suppressed'; reason?: string; scope?: 'address' | 'domain' | 'platform' }
  | { state: 'clear' }
  | { state: 'unknown'; why: string }

const SUPPRESSION_SCOPES = ['address', 'domain', 'platform'] as const

// ── The API ─────────────────────────────────────────────────────────────────

/** A collection's schema, read once per page load: fields do not change under a person working. */
const schemas = new Map<string, Promise<BaseCollection>>()

export const CrmApi = {
  /** Whether a resume is a file uploaded to the org's storage (`/v1/s3/buckets/…`). */
  isUpload: (u: string): boolean => u.startsWith(`${v1Url('s3/buckets/')}`),
  /** The signed download of an uploaded file: the org's own, for a member alone. */
  download: (u: string): Promise<string> => restGet<{ url?: string }>(u).then((r) => str(r?.url)),

  /**
   * Whether `org` has the CRM: its `crm` enablement, the beta. Any member reads its
   * own org's.
   */
  beta: (org: string): Promise<boolean> =>
    restGet<{ enabled?: unknown }>(v1Url(`entitlement/orgs/${enc(org)}`)).then(
      (r) => Array.isArray(r?.enabled) && r.enabled.includes('crm'),
    ),

  /**
   * A collection's fields, labels and options. Held for the page, and kept in the
   * browser between visits so a table's first page is asked for at once: the kept
   * schema answers now and the server's replaces it for the next read. `fresh` asks
   * the server and waits.
   */
  schema: (collection: string, fresh = false): Promise<BaseCollection> => {
    const held = schemas.get(collection)
    if (held && !fresh) return held
    const key = `hanzo.crm.schema.${currentOrg()}.${collection}`
    const read = base()
      .getCollection(collection)
      .then((c) => {
        if (!c) throw new ApiError(`The CRM has no ${collection}.`, 404)
        try {
          localStorage.setItem(key, JSON.stringify(c))
        } catch {
          /* storage full or off: the next visit asks again */
        }
        return c
      })
    let kept: BaseCollection | null = null
    if (!fresh) {
      try {
        const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null
        kept = raw ? (JSON.parse(raw) as BaseCollection) : null
      } catch {
        kept = null
      }
    }
    const p = kept ? Promise.resolve(kept) : read
    read.then((c) => schemas.set(collection, Promise.resolve(c))).catch(() => schemas.delete(collection))
    schemas.set(collection, p)
    return p
  },

  /**
   * Grow the org's CRM to the module this cloud ships (POST /v1/base/modules/crm):
   * what is missing is added, and nothing the org has is changed. Org admins only;
   * the schemas read before it are read again after.
   */
  grow: async (): Promise<{ grew: boolean }> => {
    const g = asRecord(await restPost(v1Url('base/modules/crm'), {}))
    schemas.clear()
    const grown = asRecord(g.grown)
    const created = Array.isArray(g.created) ? g.created : []
    return { grew: created.length > 0 || Object.values(grown).some((v) => Array.isArray(v) && v.length > 0) }
  },

  /** One page of records, searched, filtered and sorted by Base. */
  list: (collection: string, q: ListRecordsParams): Promise<BaseListResult<BaseRecord>> => base().listRecords(collection, q),

  /** Every record a query admits, page by page, up to `max`, for an export or a bulk action. */
  each: async (collection: string, q: Omit<ListRecordsParams, 'page' | 'perPage'>, max: number, onPage?: (done: number, total: number) => void): Promise<BaseRecord[]> => {
    const out: BaseRecord[] = []
    for (let page = 1; out.length < max; page++) {
      const r = await base().listRecords(collection, { ...q, page, perPage: 500 })
      out.push(...r.items)
      onPage?.(out.length, Math.min(max, r.totalItems))
      if (page >= r.totalPages || r.items.length < 500) break
    }
    return out.slice(0, max)
  },

  get: (collection: string, id: string, expand?: string): Promise<BaseRecord> =>
    expand ? base().listRecords(collection, { filter: `id = "${id.replace(/"/g, '')}"`, perPage: 1, expand, skipTotal: true }).then((r) => {
      if (!r.items[0]) throw new ApiError('That record is not here.', 404)
      return r.items[0]
    }) : base().getRecord(collection, id),
  create: (collection: string, body: Record<string, unknown>): Promise<BaseRecord> => base().createRecord(collection, body),
  update: (collection: string, id: string, body: Record<string, unknown>): Promise<BaseRecord> => base().updateRecord(collection, id, body),
  remove: (collection: string, id: string): Promise<void> => base().deleteRecord(collection, id),

  /**
   * A record's timeline: every activity filed on it, newest first. A person with no
   * record yet is read by the mail filed to their address.
   */
  timeline: (who: Whose): Promise<TimelineEvent[]> => {
    return base()
      .listRecords('activities', { filter: timelineFilter(who), sort: '-at', perPage: 200, skipTotal: true })
      .then((r) => r.items.map(normalizeTimelineEvent).filter((e) => e.id))
  },

  email: {
    /** One address through POST /v1/email/verify, signed in. `smtp` also asks the mail host. */
    verify: async (email: string, opts?: { smtp?: boolean }): Promise<Verification> => {
      const clean = email.trim().toLowerCase()
      const checks = ['syntax', 'domain', 'mx', 'classification', ...(opts?.smtp ? ['smtp'] : [])]
      try {
        return judge(clean, await restPost<VerifyWire>(v1Url('email/verify'), { email: clean, checks, suggestions: true }))
      } catch (e) {
        return { email: clean, status: 'unverified', valid: false, reachable: 'unknown', reason: unanswered(e), hasMx: false, disposable: false, role: false, free: false }
      }
    },

    /**
     * An address's domain and whether it is free mail, by the verifier's own list
     * (POST /v1/email/verify, syntax + classification: no DNS, no mailbox probe).
     * Null when it cannot say.
     */
    classify: async (email: string): Promise<{ domain: string; free: boolean } | null> => {
      try {
        const w = await restPost<VerifyWire>(v1Url('email/verify'), { email: email.trim().toLowerCase(), checks: ['syntax', 'classification'] })
        const domain = w.checks?.syntax?.status === 'pass' ? str(w.checks.syntax.domain) : ''
        const c = w.checks?.classification
        return domain && c?.status === 'pass' ? { domain, free: Boolean(c.free) } : null
      } catch {
        return null
      }
    },

    /**
     * One message through POST /v1/email. The cloud files it on the recipient's CRM
     * record and refuses a suppressed address or company; a refusal or a failure is
     * thrown, never recorded here as sent.
     */
    sendMessage: async (input: SendEmailInput): Promise<EmailSend> => {
      try {
        const r = asRecord(await restPost<unknown>(v1Url('email'), input))
        return { messages: Array.isArray(r.messages) ? (r.messages as EmailMessageRecord[]) : [], refused: refusalsOf(r.refused) }
      } catch (e) {
        // Every recipient refused is a 422 carrying the same answer: said per address, not thrown.
        const refused = e instanceof ApiError && e.status === 422 ? refusalsOf(asRecord(e.body).refused) : []
        if (refused.length) return { messages: [], refused }
        throw e
      }
    },

    /**
     * One email to one person from their record (POST /v1/marketing/mail): the org's
     * own mailbox when it has one, else notify, never to an address that opted out,
     * filed on the person's timeline. Org admins and SuperAdmins send.
     */
    sendCrmMail: async (input: { to: string; subject: string; body: string; person?: string }): Promise<{ sent: boolean; at: string }> => {
      const res = await restPost<{ sent: boolean; at?: string }>(v1Url('marketing/mail'), input)
      return { sent: Boolean(res?.sent), at: res?.at || new Date().toISOString() }
    },
  },

  marketing: {
    /** The org's sequences, most recently updated first. */
    listSequences: async (): Promise<Sequence[]> => dataOf<Sequence>(await restGet(v1Url('marketing/sequences?limit=200'))),

    /** One sequence and its steps in send order. */
    getSequence: async (id: string): Promise<{ sequence: Sequence; steps: SequenceStep[] }> => {
      const r = asRecord(await restGet(v1Url(`marketing/sequences/${enc(id)}`)))
      return { sequence: r.sequence as Sequence, steps: Array.isArray(r.steps) ? (r.steps as SequenceStep[]) : [] }
    },

    /** A new sequence, as a draft: nothing sends until it is made active and someone is enrolled. */
    createSequence: (name: string): Promise<Sequence> => restPost<Sequence>(v1Url('marketing/sequences'), { name, status: 'draft' }),

    /** Append a message: `delaySeconds` after the previous step, or after enrollment for the first. */
    addStep: (id: string, step: { delaySeconds: number; subject: string; body: string }): Promise<SequenceStep> =>
      restPost<SequenceStep>(v1Url(`marketing/sequences/${enc(id)}/steps`), step),

    /** draft, active or archived; only an active sequence takes enrollments. */
    setSequenceStatus: (id: string, status: Sequence['status']): Promise<{ id: string; status: string }> =>
      restPost(v1Url(`marketing/sequences/${enc(id)}/status`), { status }),

    /** Enroll one address or a saved audience; the sequence must be active. */
    enroll: (id: string, who: { address: string } | { audienceId: string }): Promise<EnrollResult> =>
      restPost<EnrollResult>(v1Url(`marketing/sequences/${enc(id)}/enroll`), { ...who, channel: 'email' }),

    /** Everyone walking a sequence, in any state, most recently enrolled first. */
    listEnrollments: async (id: string): Promise<Enrollment[]> =>
      dataOf<Enrollment>(await restGet(v1Url(`marketing/sequences/${enc(id)}/enrollments?limit=1000`))),

    /** Stop one person's walk; a completed or canceled one reads as not found. */
    cancelEnrollment: (id: string, eid: string): Promise<unknown> =>
      restPost(v1Url(`marketing/sequences/${enc(id)}/enrollments/${enc(eid)}/cancel`), {}),

    /** The org's saved audiences. */
    listAudiences: async (): Promise<Audience[]> => dataOf<Audience>(await restGet(v1Url('marketing/audiences?limit=200'))),

    /** Every address the org's send gate refuses, newest first (GET /v1/marketing/suppressions). */
    listSuppressions: async (): Promise<MarketingSuppression[]> => {
      const res = await restGet<{ data?: MarketingSuppression[] }>(v1Url('marketing/suppressions?limit=500'))
      return res?.data ?? []
    },

    /** Opt one address out of email for the org. The cloud refuses a member who is not an org admin; that is thrown. */
    addSuppression: (address: string, reason: string): Promise<MarketingSuppression> =>
      restPost<MarketingSuppression>(v1Url('marketing/suppressions'), { channel: 'email', address: address.trim().toLowerCase(), reason }),

    /** One address against the send gate; any failure to answer is `unknown`, with why. */
    checkSuppression: async (address: string): Promise<SuppressionCheck> => {
      let r: { suppressed?: unknown; reason?: unknown; scope?: unknown }
      try {
        r = await restGet(v1Url(`marketing/suppressions/check?address=${enc(address.trim().toLowerCase())}`))
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) return { state: 'unknown', why: 'The suppression check is not available yet.' }
        return { state: 'unknown', why: e instanceof Error ? e.message : 'The suppression check failed.' }
      }
      if (typeof r?.suppressed !== 'boolean') return { state: 'unknown', why: 'The suppression check gave no answer.' }
      if (!r.suppressed) return { state: 'clear' }
      const scope = SUPPRESSION_SCOPES.find((x) => x === r.scope)
      return { state: 'suppressed', reason: typeof r.reason === 'string' && r.reason ? r.reason : undefined, scope }
    },

    /**
     * Re-subscribe one entry on email: an address, or a company as "@example.com"
     * (DELETE /v1/marketing/suppressions?address=&channel=, 204; 404 when it was not
     * on the list). Org admin or SuperAdmin; the cloud refuses anyone else.
     */
    removeSuppression: (entry: string): Promise<void> =>
      restDelete<void>(v1Url(`marketing/suppressions?address=${enc(entry.trim().toLowerCase())}&channel=email`)),

    /** Opt a whole company out of email: the "@domain" entry every address at it answers to. */
    suppressCompany: (domain: string, reason: string): Promise<MarketingSuppression> =>
      CrmApi.marketing.addSuppression(`@${domain.trim().toLowerCase().replace(/^@/, '')}`, reason),
  },
}
