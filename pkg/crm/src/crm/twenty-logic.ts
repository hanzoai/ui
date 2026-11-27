/**
 * Pure domain logic for Twenty-style CRM features (zero React / GUI runtime imports,
 * trivially unit-testable in plain Node):
 *   - Command Menu quick-action definitions & filtering
 *   - Calendar month grid, date key extraction, grouping, and mobile agenda builder
 *   - Record merge default picks & diff resolution
 *   - Bulk CSV export builder
 *   - Attachment target mapping
 *   - Data Model 13-object catalog
 */
import type { BaseRecord } from '../lib/base-data/api'
import type { AttachmentTarget } from '../lib/crm'
import { cellText, toCsv } from './csv'
import type { ObjectId } from './objects'
import { rowOf, type Schema } from './schema'

// ── Command Menu Quick Actions ──────────────────────────────────────────────

export interface QuickAction {
  id: string
  label: string
  keywords: string[]
  kind: 'create' | 'navigate' | 'copilot'
  objectId?: ObjectId
  href?: string
  shortcut?: string
}

export const CRM_QUICK_ACTIONS: readonly QuickAction[] = [
  { id: 'new-person', label: 'New Person', keywords: ['create', 'add', 'contact', 'lead', 'person'], kind: 'create', objectId: 'people' },
  { id: 'new-company', label: 'New Company', keywords: ['create', 'add', 'organization', 'account', 'firm'], kind: 'create', objectId: 'companies' },
  { id: 'new-deal', label: 'New Deal', keywords: ['create', 'add', 'opportunity', 'pipeline', 'sales'], kind: 'create', objectId: 'deals' },
  { id: 'new-task', label: 'New Task', keywords: ['create', 'add', 'todo', 'reminder', 'task'], kind: 'create', objectId: 'tasks' },
  { id: 'new-note', label: 'New Note', keywords: ['create', 'add', 'memo', 'note'], kind: 'create', objectId: 'notes' },
  { id: 'ask-copilot', label: 'Ask AI Copilot', keywords: ['ai', 'assistant', 'copilot', 'draft', 'enrich', 'summarize'], kind: 'copilot' },
  { id: 'open-dashboard', label: 'Open Dashboard', keywords: ['analytics', 'funnel', 'metrics', 'pipeline', 'dashboard'], kind: 'navigate', href: '/crm/dashboard' },
  { id: 'open-model', label: 'Open Data Model', keywords: ['schema', 'custom', 'fields', 'settings', 'objects', 'model'], kind: 'navigate', href: '/crm/model' },
]

/** Filter quick actions by free-text query across label & keywords. */
export function filterQuickActions(actions: readonly QuickAction[], query: string): QuickAction[] {
  const q = query.trim().toLowerCase()
  if (!q) return [...actions]
  return actions.filter(
    (a) => a.label.toLowerCase().includes(q) || a.keywords.some((k) => k.includes(q)),
  )
}

// ── Calendar Computation ────────────────────────────────────────────────────

export interface CalendarCell {
  dateKey: string
  day: number
  inMonth: boolean
  isToday: boolean
}

export interface CalendarItem {
  id: string
  title: string
  dateKey: string
  badge?: string
  subtitle?: string
  raw: Record<string, unknown>
}

export interface AgendaGroup {
  dateKey: string
  label: string
  isToday: boolean
  items: CalendarItem[]
}

export const CALENDAR_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
export const CALENDAR_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const

const pad2 = (n: number): string => String(n).padStart(2, '0')

export function formatDateKey(year: number, monthIndex: number, day: number): string {
  return `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`
}

/** Extract YYYY-MM-DD date key from a Base date string or Date object, or '' if absent. */
export function extractDateKey(value: unknown): string {
  if (!value) return ''
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '' : value.toISOString().slice(0, 10)
  }
  const s = String(value).trim()
  const match = s.match(/^(\d{4}-\d{2}-\d{2})/)
  if (match) return match[1]
  const parsed = new Date(s)
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10)
}

/** Build a 35- or 42-cell Sunday-first calendar grid for (year, monthIndex 0-11). */
export function buildMonthGrid(year: number, monthIndex: number, todayKey?: string): CalendarCell[] {
  const today = todayKey ?? new Date().toISOString().slice(0, 10)
  const firstOfMonth = new Date(Date.UTC(year, monthIndex, 1))
  const startDow = firstOfMonth.getUTCDay()
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
  const totalCells = startDow + daysInMonth > 35 ? 42 : 35

  const cells: CalendarCell[] = []
  for (let i = 0; i < totalCells; i++) {
    const d = new Date(Date.UTC(year, monthIndex, 1 - startDow + i))
    const y = d.getUTCFullYear()
    const m = d.getUTCMonth()
    const day = d.getUTCDate()
    const dateKey = formatDateKey(y, m, day)
    cells.push({
      dateKey,
      day,
      inMonth: m === monthIndex,
      isToday: dateKey === today,
    })
  }
  return cells
}

export function calendarTitleText(record: Record<string, unknown>, titleField: string): string {
  const v = record[titleField]
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>
    const full = [o.firstName ?? o.first, o.lastName ?? o.last].filter(Boolean).join(' ')
    if (full) return full
    if (o.name) return String(o.name)
  }
  return String(v || record.name || record.title || record.id || 'Untitled')
}

/** Group records by YYYY-MM-DD key for a date field, returning scheduled map and unscheduled list. */
export function groupRecordsByDate(
  records: readonly Record<string, unknown>[],
  dateField: string,
  titleField: string,
): { byDate: Map<string, CalendarItem[]>; unscheduled: Record<string, unknown>[] } {
  const byDate = new Map<string, CalendarItem[]>()
  const unscheduled: Record<string, unknown>[] = []
  for (const r of records) {
    const key = extractDateKey(r[dateField])
    if (!key) {
      unscheduled.push(r)
      continue
    }
    const item: CalendarItem = {
      id: String(r.id ?? ''),
      title: calendarTitleText(r, titleField),
      dateKey: key,
      badge: r.stage ? String(r.stage) : r.status ? String(r.status) : undefined,
      subtitle: r.assignee ? String(r.assignee) : r.role ? String(r.role) : undefined,
      raw: r,
    }
    const bucket = byDate.get(key) ?? []
    bucket.push(item)
    byDate.set(key, bucket)
  }
  return { byDate, unscheduled }
}

/** Build chronological agenda groups for a given month (used on mobile 390px viewports). */
export function buildAgendaGroups(
  byDate: ReadonlyMap<string, CalendarItem[]>,
  year: number,
  monthIndex: number,
  todayKey?: string,
): AgendaGroup[] {
  const prefix = `${year}-${pad2(monthIndex + 1)}-`
  const today = todayKey ?? new Date().toISOString().slice(0, 10)
  return [...byDate.entries()]
    .filter(([k]) => k.startsWith(prefix))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, items]) => {
      const d = new Date(`${dateKey}T12:00:00Z`)
      const weekday = CALENDAR_WEEKDAYS[d.getUTCDay()]
      const month = CALENDAR_MONTHS[d.getUTCMonth()].slice(0, 3)
      const day = d.getUTCDate()
      return {
        dateKey,
        label: `${weekday}, ${month} ${day}`,
        isToday: dateKey === today,
        items,
      }
    })
}

// ── Merge Field Resolution ──────────────────────────────────────────────────

export type MergePick = 'primary' | 'duplicate'

export const SKIP_MERGE_FIELDS = new Set(['id', 'created', 'updated', 'createdAt', 'updatedAt'])

const isEmptyVal = (v: unknown): boolean => {
  if (v == null || v === '') return true
  if (Array.isArray(v)) return v.length === 0
  if (typeof v === 'object') {
    return Object.values(v as Record<string, unknown>).every(
      (x) => x == null || x === '' || (Array.isArray(x) && x.length === 0),
    )
  }
  return false
}

/** Auto-pick primary when populated, else fall back to duplicate if duplicate has a value. */
export function defaultMergePicks(
  primary: BaseRecord,
  duplicate: BaseRecord,
  fieldNames: readonly string[],
): Record<string, MergePick> {
  const picks: Record<string, MergePick> = {}
  for (const name of fieldNames) {
    if (SKIP_MERGE_FIELDS.has(name)) continue
    picks[name] = isEmptyVal(primary[name]) && !isEmptyVal(duplicate[name]) ? 'duplicate' : 'primary'
  }
  return picks
}

/** Resolve final Base field patch from per-field picks (only fields that change primary). */
export function resolveMergedFields(
  primary: BaseRecord,
  duplicate: BaseRecord,
  picks: Readonly<Record<string, MergePick>>,
  fieldNames: readonly string[],
): Record<string, unknown> {
  const patch: Record<string, unknown> = {}
  for (const name of fieldNames) {
    if (SKIP_MERGE_FIELDS.has(name)) continue
    const pick = picks[name] ?? 'primary'
    const chosen = pick === 'duplicate' ? duplicate[name] : primary[name]
    if (JSON.stringify(chosen) !== JSON.stringify(primary[name])) {
      patch[name] = chosen
    }
  }
  return patch
}

// ── Bulk CSV Export ─────────────────────────────────────────────────────────

/** Build formula-safe CSV text from selected Base records and their schema. */
export function buildBulkCsv(schema: Schema, records: readonly BaseRecord[]): string {
  const header = ['ID', ...schema.fields.map((f) => f.label)]
  const rows = records.map((r) => {
    const row = rowOf(schema, r)
    return [String(r.id ?? ''), ...schema.fields.map((f) => cellText(f, row[f.name]))]
  })
  return toCsv(header, rows)
}

// ── Attachments Target Mapping ──────────────────────────────────────────────

export function attachmentTargetFor(collection: string, id: string): AttachmentTarget | null {
  switch (collection) {
    case 'people': return { person: id }
    case 'companies': return { company: id }
    case 'opportunities': return { opportunity: id }
    case 'candidates': return { candidate: id }
    case 'notes': return { note: id }
    case 'tasks': return { task: id }
    default: return null
  }
}

// ── Data Model 13-Object Catalog ────────────────────────────────────────────

export interface DataModelObjectDef {
  collection: string
  label: string
  description: string
}

/** The 13 standard Hanzo CRM Base objects. */
export const CRM_DATA_MODEL_OBJECTS: readonly DataModelObjectDef[] = [
  { collection: 'people', label: 'People', description: 'Contacts, leads, customers, and investors' },
  { collection: 'companies', label: 'Companies', description: 'Organizations, accounts, and funds' },
  { collection: 'opportunities', label: 'Opportunities', description: 'Sales deals and fundraising rounds' },
  { collection: 'tasks', label: 'Tasks', description: 'Follow-ups, to-dos, and reminders' },
  { collection: 'notes', label: 'Notes', description: 'Rich notes linked to records' },
  { collection: 'lists', label: 'Lists', description: 'Manual and segmented outreach lists' },
  { collection: 'list_members', label: 'List Members', description: 'People enrolled in lists' },
  { collection: 'candidates', label: 'Candidates', description: 'Recruiting applicants and stages' },
  { collection: 'activities', label: 'Activities', description: 'Emails, calls, meetings, and forms' },
  { collection: 'attachments', label: 'Attachments', description: 'Files, contracts, and decks' },
  { collection: 'views', label: 'Saved Views', description: 'Org-saved filters, sorts, and boards' },
  { collection: 'segments', label: 'Segments', description: 'Dynamic audience definitions' },
  { collection: 'jobs', label: 'Jobs', description: 'Open roles linked to candidates' },
]
