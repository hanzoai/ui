/**
 * Pure CRM domain computation & fallback helpers:
 *   - Cross-object search hit normalization & canonical grouping
 *   - Analytics dashboard funnel & overdue-task aggregation
 *   - Custom field slugification & validation
 *   - Attachment filter construction
 *   - Deterministic offline AI Copilot assist fallback
 */
import type { BaseRecord } from './base-data/api'
import { plain } from './base-data/html'
import { OBJECTS, ROUND_STAGES, SALES_STAGES, type ObjectId } from '../crm/objects'

const str = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : String(v))
const asRec = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}

const parseTime = (v: unknown): number => {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  const s = str(v).trim()
  if (!s) return 0
  const iso = /^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d(\.\d+)?Z?$/.test(s) ? `${s.replace(' ', 'T').replace(/Z?$/, 'Z')}` : s
  const ms = Date.parse(iso)
  return Number.isFinite(ms) ? Math.floor(ms / 1000) : 0
}

/** Extract USD-like major unit amount from a Base currency field or number. */
export function currencyAmount(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  const o = asRec(v)
  if (o.amountMicros != null && o.amountMicros !== '') {
    const n = Number(o.amountMicros)
    return Number.isFinite(n) ? n / 1_000_000 : 0
  }
  if (o.amount != null && o.amount !== '') {
    const n = Number(o.amount)
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

// ── Cross-object Search ─────────────────────────────────────────────────────

export interface SearchHit {
  id: string
  objectId: ObjectId
  collection: string
  title: string
  subtitle?: string
  badge?: string
  href: string
}

export interface SearchResultGroup {
  objectId: ObjectId
  label: string
  hits: SearchHit[]
}

export const SEARCH_ORDER: ObjectId[] = ['people', 'companies', 'deals', 'fundraising', 'tasks', 'notes', 'candidates']

/** Group flat cross-object search hits in canonical CRM object order. */
export function groupSearchHits(hits: readonly SearchHit[]): SearchResultGroup[] {
  const buckets = new Map<ObjectId, SearchHit[]>()
  for (const h of hits) {
    const list = buckets.get(h.objectId) ?? []
    if (!list.some((x) => x.id === h.id)) list.push(h)
    buckets.set(h.objectId, list)
  }
  return SEARCH_ORDER
    .map((objectId) => ({
      objectId,
      label: OBJECTS[objectId].plural,
      hits: buckets.get(objectId) ?? [],
    }))
    .filter((g) => g.hits.length > 0)
}

export function recordTitle(collection: string, r: BaseRecord): string {
  if (collection === 'people' || collection === 'candidates') {
    const n = asRec(r.name)
    const full = [str(n.firstName), str(n.lastName)].filter(Boolean).join(' ')
    if (full) return full
    const email = str(asRec(r.emails).primaryEmail)
    return email || str(r.id)
  }
  return str(r.name || r.title || r.id)
}

function recordSubtitle(collection: string, r: BaseRecord): string {
  if (collection === 'people' || collection === 'candidates') {
    return [str(asRec(r.emails).primaryEmail), str(r.job_title || r.role)].filter(Boolean).join(' · ')
  }
  if (collection === 'companies') return str(r.domain || r.type)
  if (collection === 'opportunities') {
    const amt = currencyAmount(r.amount)
    return [str(r.stage), amt > 0 ? `$${amt.toLocaleString()}` : ''].filter(Boolean).join(' · ')
  }
  if (collection === 'tasks') return [str(r.status), r.due ? `due ${str(r.due).slice(0, 10)}` : ''].filter(Boolean).join(' · ')
  if (collection === 'notes') return plain(str(r.body)).slice(0, 80)
  return ''
}

export function toSearchHit(objectId: ObjectId, r: BaseRecord): SearchHit {
  const obj = OBJECTS[objectId]
  const id = str(r.id)
  return {
    id,
    objectId,
    collection: obj.collection,
    title: recordTitle(obj.collection, r),
    subtitle: recordSubtitle(obj.collection, r) || undefined,
    badge: str(r.stage || r.status || r.type) || undefined,
    href: `/crm/${objectId}/${id}`,
  }
}

// ── Analytics Dashboard ─────────────────────────────────────────────────────

export interface PipelineStageMetric {
  stage: string
  label: string
  count: number
  value: number
  weightedValue: number
  weight: number
}

export interface PipelineSummary {
  stages: PipelineStageMetric[]
  totalDeals: number
  openDeals: number
  wonDeals: number
  lostDeals: number
  totalValue: number
  weightedValue: number
  conversionRate: number
}

export interface OutreachFunnel {
  sent: number
  opened: number
  clicked: number
  replied: number
  bounced: number
  openRate: number
  clickRate: number
  replyRate: number
  bounceRate: number
}

export interface OverdueTaskSummary {
  id: string
  title: string
  due: string
  assignee: string
  status: string
  daysOverdue: number
}

export interface ActivityFeedItem {
  id: string
  kind: string
  subject: string
  detail: string
  at: number
  href?: string
}

export interface CrmAnalytics {
  sales: PipelineSummary
  fundraising: PipelineSummary
  outreach: OutreachFunnel
  overdueTasks: OverdueTaskSummary[]
  recentActivities: ActivityFeedItem[]
  source: 'api' | 'base'
}

const SALES_WEIGHTS: Record<string, number> = {
  new: 0.1,
  screening: 0.25,
  meeting: 0.45,
  proposal: 0.7,
  customer: 1.0,
  lost: 0,
}

const ROUND_WEIGHTS: Record<string, number> = {
  intro: 0.1,
  meeting: 0.25,
  diligence: 0.5,
  term_sheet: 0.8,
  closed: 1.0,
  lost: 0,
}

const stageLabel = (s: string): string =>
  s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

function summarizePipeline(
  records: readonly BaseRecord[],
  stages: readonly string[],
  weights: Record<string, number>,
  wonStage: string,
): PipelineSummary {
  const byStage = new Map<string, { count: number; value: number; weightedValue: number }>()
  for (const s of stages) byStage.set(s, { count: 0, value: 0, weightedValue: 0 })

  let totalDeals = 0
  let wonDeals = 0
  let lostDeals = 0
  let openDeals = 0
  let totalValue = 0
  let weightedValue = 0

  for (const r of records) {
    const stage = str(r.stage || stages[0]).toLowerCase()
    const amount = currencyAmount(r.amount)
    const w = weights[stage] ?? 0.2
    const entry = byStage.get(stage) ?? { count: 0, value: 0, weightedValue: 0 }
    entry.count += 1
    entry.value += amount
    entry.weightedValue += amount * w
    byStage.set(stage, entry)

    totalDeals += 1
    if (stage === wonStage) wonDeals += 1
    else if (stage === 'lost') lostDeals += 1
    else {
      openDeals += 1
      totalValue += amount
      weightedValue += amount * w
    }
  }

  const closed = wonDeals + lostDeals
  const conversionRate = closed > 0 ? wonDeals / closed : totalDeals > 0 ? wonDeals / totalDeals : 0

  return {
    stages: stages.map((stage) => {
      const m = byStage.get(stage) ?? { count: 0, value: 0, weightedValue: 0 }
      return {
        stage,
        label: stageLabel(stage),
        count: m.count,
        value: Math.round(m.value),
        weightedValue: Math.round(m.weightedValue),
        weight: weights[stage] ?? 0,
      }
    }),
    totalDeals,
    openDeals,
    wonDeals,
    lostDeals,
    totalValue: Math.round(totalValue),
    weightedValue: Math.round(weightedValue),
    conversionRate,
  }
}

/** Compute full CRM analytics deterministically from raw Base records. */
export function computeAnalytics(input: {
  opportunities: readonly BaseRecord[]
  tasks: readonly BaseRecord[]
  activities: readonly BaseRecord[]
  people: readonly BaseRecord[]
  now?: Date
}): CrmAnalytics {
  const now = input.now ?? new Date()
  const nowSec = Math.floor(now.getTime() / 1000)

  const salesRecs = input.opportunities.filter((o) => {
    const p = str(o.pipeline).toLowerCase()
    return !p || p === 'sales'
  })
  const fundRecs = input.opportunities.filter((o) => str(o.pipeline).toLowerCase() === 'fundraising')

  const sales = summarizePipeline(salesRecs, SALES_STAGES, SALES_WEIGHTS, 'customer')
  const fundraising = summarizePipeline(fundRecs, ROUND_STAGES, ROUND_WEIGHTS, 'closed')

  let sent = 0
  let opened = 0
  let clicked = 0
  let bounced = 0
  let repliedEvents = 0

  for (const a of input.activities) {
    if (str(a.kind) !== 'email') continue
    const d = asRec(a.data)
    const status = str(d.status).toLowerCase()
    const direction = str(a.direction).toLowerCase()
    if (direction === 'in' || status === 'received') {
      repliedEvents += 1
      continue
    }
    sent += 1
    const trail = Array.isArray(d.events) ? d.events.map((e) => str(asRec(e).status).toLowerCase()) : []
    const seen = new Set([status, ...trail])
    if (seen.has('opened') || seen.has('clicked')) opened += 1
    if (seen.has('clicked')) clicked += 1
    if (seen.has('bounced') || seen.has('complained') || seen.has('failed')) bounced += 1
  }

  const repliedPeople = input.people.filter((p) => str(p.outreach).toLowerCase() === 'replied').length
  const replied = Math.max(repliedEvents, repliedPeople)

  const rate = (n: number, denom: number) => (denom > 0 ? n / denom : 0)
  const outreach: OutreachFunnel = {
    sent,
    opened,
    clicked,
    replied,
    bounced,
    openRate: rate(opened, sent),
    clickRate: rate(clicked, sent),
    replyRate: rate(replied, sent),
    bounceRate: rate(bounced, sent),
  }

  const overdueTasks: OverdueTaskSummary[] = input.tasks
    .filter((t) => {
      const st = str(t.status).toLowerCase()
      if (st === 'done' || st === 'completed' || st === 'canceled') return false
      const dueSec = parseTime(t.due)
      return dueSec > 0 && dueSec < nowSec
    })
    .map((t) => {
      const dueSec = parseTime(t.due)
      return {
        id: str(t.id),
        title: str(t.title || 'Untitled task'),
        due: str(t.due).slice(0, 10),
        assignee: str(t.assignee),
        status: str(t.status || 'todo'),
        daysOverdue: Math.max(1, Math.floor((nowSec - dueSec) / 86400)),
      }
    })
    .sort((a, b) => b.daysOverdue - a.daysOverdue)
    .slice(0, 20)

  const recentActivities: ActivityFeedItem[] = [...input.activities]
    .sort((a, b) => (parseTime(b.at || b.created) - parseTime(a.at || a.created)))
    .slice(0, 12)
    .map((a) => {
      const d = asRec(a.data)
      const href = a.person
        ? `/crm/people/${str(a.person)}`
        : a.company
          ? `/crm/companies/${str(a.company)}`
          : a.opportunity
            ? `/crm/deals/${str(a.opportunity)}`
            : a.candidate
              ? `/crm/candidates/${str(a.candidate)}`
              : undefined
      return {
        id: str(a.id),
        kind: str(a.kind || 'activity'),
        subject: str(a.subject || a.kind || 'Activity'),
        detail: [str(d.to ? `to ${str(d.to)}` : ''), str(d.status), plain(str(a.body)).slice(0, 80)].filter(Boolean).join(' · '),
        at: parseTime(a.at || a.created || a.createdAt),
        href,
      }
    })

  return { sales, fundraising, outreach, overdueTasks, recentActivities, source: 'base' }
}

// ── Custom Field Schema Validation ──────────────────────────────────────────

export type CustomFieldType = 'text' | 'number' | 'bool' | 'date' | 'email' | 'url' | 'select' | 'currency' | 'editor' | 'relation'

export interface CustomFieldInput {
  name?: string
  label: string
  type: CustomFieldType
  required?: boolean
  options?: string[]
  targetCollection?: string
}

export interface CustomFieldValidation {
  valid: boolean
  slug: string
  errors: string[]
}

const RESERVED_FIELDS = new Set(['id', 'created', 'updated', 'createdAt', 'updatedAt', 'collectionId', 'collectionName', 'expand'])

/** Convert a human label like "Lead Score %" into a valid snake_case Base field slug. */
export function slugifyFieldName(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/^[0-9]+/, (m) => (m ? `f_${m}` : ''))
    .slice(0, 48)
}

/** Validate a new custom field definition before sending to the API. */
export function validateCustomField(
  input: CustomFieldInput,
  existingNames?: ReadonlySet<string>,
): CustomFieldValidation {
  const errors: string[] = []
  const label = input.label.trim()
  const slug = input.name?.trim() ? slugifyFieldName(input.name) : slugifyFieldName(label)

  if (!label) errors.push('Field label is required.')
  if (!slug || !/^[a-z][a-z0-9_]{1,47}$/.test(slug)) {
    errors.push('Field name must start with a letter and contain 2–48 lowercase letters, digits, or underscores.')
  }
  if (RESERVED_FIELDS.has(slug)) {
    errors.push(`"${slug}" is a reserved system field name.`)
  }
  if (existingNames?.has(slug)) {
    errors.push(`Field "${slug}" already exists on this object.`)
  }
  if (input.type === 'select') {
    const clean = (input.options ?? []).map((o) => o.trim()).filter(Boolean)
    if (clean.length === 0) errors.push('Select fields require at least one option.')
  }
  if (input.type === 'relation' && !input.targetCollection?.trim()) {
    errors.push('Relation fields require a target object.')
  }

  return { valid: errors.length === 0, slug, errors }
}

// ── Attachments ─────────────────────────────────────────────────────────────

export type AttachmentCategory = 'document' | 'contract' | 'deck' | 'invoice' | 'image' | 'other'

export interface AttachmentTarget {
  person?: string
  company?: string
  opportunity?: string
  candidate?: string
  note?: string
  task?: string
}

export interface AttachmentRecord {
  id: string
  name: string
  file: string
  category: AttachmentCategory
  size?: number
  mimeType?: string
  created: string
}

export function attachmentFilter(target: AttachmentTarget): string {
  const q = (v: string) => v.replace(/["\\]/g, '')
  if (target.person) return `person = "${q(target.person)}"`
  if (target.company) return `company = "${q(target.company)}"`
  if (target.opportunity) return `opportunity = "${q(target.opportunity)}"`
  if (target.candidate) return `candidate = "${q(target.candidate)}"`
  if (target.note) return `note = "${q(target.note)}"`
  if (target.task) return `task = "${q(target.task)}"`
  return ''
}

export { fallbackAiAssist } from './crm-ai'
export type { AiAssistAction, AiAssistContext, AiAssistResponse, AiSuggestedTask } from './crm-ai'
