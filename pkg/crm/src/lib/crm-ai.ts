/**
 * AI Copilot types and deterministic offline fallback for Hanzo CRM.
 * Used by `CrmApi.aiAssist` whenever `POST /v1/crm/ai/assist` is not yet reachable.
 */
import type { BaseRecord } from './base-data/api'
import type { ObjectId } from '../crm/objects'

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

const stageLabel = (s: string): string => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
const daysFromNow = (days: number): string => new Date(Date.now() + days * 86400 * 1000).toISOString().slice(0, 10)

function recordName(collection: string, r: BaseRecord): string {
  if (collection === 'people' || collection === 'candidates') {
    const n = asRec(r.name)
    const full = [str(n.firstName), str(n.lastName)].filter(Boolean).join(' ')
    if (full) return full
    const email = str(asRec(r.emails).primaryEmail)
    return email || str(r.id)
  }
  return str(r.name || r.title || r.id)
}

export type AiAssistAction = 'enrich' | 'draft_email' | 'summarize' | 'extract_tasks' | 'audit_stale' | 'custom'

export interface AiAssistContext {
  action: AiAssistAction
  prompt?: string
  objectId?: ObjectId
  collection?: string
  recordId?: string
  title?: string
  record?: BaseRecord
  timeline?: { kind: string; subject: string; body: string; at: number; status?: string }[]
  records?: BaseRecord[]
}

export interface AiSuggestedTask {
  title: string
  due: string
  body?: string
}

export interface AiAssistResponse {
  summary: string
  bullets?: string[]
  suggestedPatch?: Record<string, unknown>
  emailDraft?: { subject: string; body: string }
  suggestedTasks?: AiSuggestedTask[]
  source: 'api' | 'fallback'
}

/** Deterministic offline/unconfigured AI Copilot fallback so every action stays useful. */
export function fallbackAiAssist(ctx: AiAssistContext): AiAssistResponse {
  const rec = ctx.record ?? {}
  const name = ctx.title || recordName(ctx.collection || 'people', rec) || 'this record'
  const email = str(asRec(rec.emails).primaryEmail)
  const domain = email.includes('@') ? email.split('@')[1] : str(rec.domain)
  const stage = str(rec.stage || rec.status)
  const timeline = ctx.timeline ?? []

  if (ctx.action === 'enrich') {
    const patch: Record<string, unknown> = {}
    const bullets: string[] = []
    if (domain && !str(rec.domain) && ctx.collection === 'companies') {
      patch.domain = domain
      bullets.push(`Inferred company domain: ${domain}`)
    }
    if (domain && !['gmail.com', 'yahoo.com', 'icloud.com', 'hotmail.com', 'outlook.com'].includes(domain) && ctx.collection === 'people') {
      bullets.push(`Work domain detected: ${domain}`)
      if (!str(rec.type)) {
        patch.type = 'prospect'
        bullets.push('Suggested person type: prospect')
      }
    }
    if (ctx.collection === 'opportunities' && !str(rec.next_step)) {
      patch.next_step = stage === 'proposal' ? 'Review proposal and confirm close timeline' : 'Schedule discovery call and confirm stakeholders'
      bullets.push(`Suggested next step: ${str(patch.next_step)}`)
    }
    if (!bullets.length) {
      bullets.push(`Reviewed ${name}: core profile fields are populated.`)
      bullets.push('Connect `/v1/crm/ai/assist` for live web & firmographic enrichment.')
    }
    return {
      summary: `Enrichment analysis for ${name}${domain ? ` (${domain})` : ''}.`,
      bullets,
      suggestedPatch: Object.keys(patch).length > 0 ? patch : undefined,
      source: 'fallback',
    }
  }

  if (ctx.action === 'draft_email') {
    const first = name.split(/\s+/)[0] || 'there'
    const lastTouch = timeline[0]
    const subject = stage ? `Next steps on ${name} (${stageLabel(stage)})` : `Quick follow-up — ${name}`
    const contextLine = lastTouch
      ? `Following up on our recent ${lastTouch.kind} ("${lastTouch.subject || 'conversation'}").`
      : 'Wanted to follow up and see how things are progressing on your side.'
    const body = `Hi ${first},\n\n${contextLine}\n\nWould love to align on next steps and answer any open questions this week. Do you have 15 minutes on Thursday or Friday?\n\nBest,`
    return { summary: `Drafted a concise follow-up email for ${name}.`, emailDraft: { subject, body }, source: 'fallback' }
  }

  if (ctx.action === 'summarize') {
    const counts: Record<string, number> = {}
    for (const e of timeline) counts[e.kind] = (counts[e.kind] ?? 0) + 1
    const breakdown = Object.entries(counts).map(([k, n]) => `${n} ${k}${n === 1 ? '' : 's'}`).join(', ')
    const latest = timeline[0]
    return {
      summary: `Timeline summary for ${name}:`,
      bullets: [
        `Total recorded interactions: ${timeline.length}${breakdown ? ` (${breakdown})` : ''}.`,
        latest
          ? `Most recent activity: ${latest.kind} — ${latest.subject || latest.body.slice(0, 70) || 'logged entry'}.`
          : 'No timeline entries logged yet — consider logging an intro note or outreach.',
        stage ? `Current status/stage: ${stageLabel(stage)}.` : 'No stage assigned yet.',
      ],
      source: 'fallback',
    }
  }

  if (ctx.action === 'extract_tasks') {
    const tasks: AiSuggestedTask[] = [
      {
        title: `Follow up with ${name}`,
        due: daysFromNow(2),
        body: stage ? `Advance from ${stageLabel(stage)} and confirm next milestone.` : 'Confirm interest and document next steps.',
      },
    ]
    if (ctx.collection === 'opportunities') {
      tasks.push({
        title: `Update close plan for ${name}`,
        due: daysFromNow(5),
        body: 'Verify budget, decision maker, and target close date.',
      })
    }
    return {
      summary: `Extracted ${tasks.length} actionable next task${tasks.length === 1 ? '' : 's'} for ${name}.`,
      bullets: tasks.map((t) => `${t.title} (due ${t.due})`),
      suggestedTasks: tasks,
      source: 'fallback',
    }
  }

  if (ctx.action === 'audit_stale') {
    const cutoff = Math.floor(Date.now() / 1000) - 14 * 86400
    const pool = ctx.records && ctx.records.length > 0 ? ctx.records : ctx.record ? [ctx.record] : []
    const stale = pool.filter((r) => {
      const st = str(r.stage || r.status).toLowerCase()
      if (st === 'customer' || st === 'closed' || st === 'lost' || st === 'done') return false
      const last = parseTime(r.contacted || r.updated || r.created)
      return !last || last < cutoff
    })
    return {
      summary: stale.length
        ? `Found ${stale.length} record${stale.length === 1 ? '' : 's'} untouched for 14+ days.`
        : `All ${pool.length} reviewed record${pool.length === 1 ? '' : 's'} show recent activity.`,
      bullets: stale.slice(0, 6).map((r) => `${recordName(ctx.collection || 'opportunities', r)} — ${str(r.stage || r.status || 'active')}`),
      suggestedTasks: stale.slice(0, 3).map((r) => ({
        title: `Re-engage ${recordName(ctx.collection || 'opportunities', r)}`,
        due: daysFromNow(2),
        body: 'No recorded touch in 14+ days.',
      })),
      source: 'fallback',
    }
  }

  return {
    summary: `Context note for ${name}${ctx.prompt ? ` — "${ctx.prompt}"` : ''}.`,
    bullets: [
      `Object: ${ctx.objectId ?? 'crm'} · Timeline items: ${timeline.length}`,
      'Live LLM responses activate automatically once POST /v1/crm/ai/assist is reachable.',
    ],
    source: 'fallback',
  }
}
