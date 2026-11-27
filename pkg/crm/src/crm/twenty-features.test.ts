import { describe, expect, it, vi } from 'vitest'

import {
  CrmApi,
  attachmentFilter,
  computeAnalytics,
  fallbackAiAssist,
  groupSearchHits,
  slugifyFieldName,
  validateCustomField,
  type SearchHit,
} from '../lib/crm'
import { ApiError, configureCrm, type CrmHost } from '../lib/host'
import type { BaseRecord } from '../lib/base-data/api'
import {
  CRM_DATA_MODEL_OBJECTS,
  CRM_QUICK_ACTIONS,
  attachmentTargetFor,
  buildAgendaGroups,
  buildBulkCsv,
  buildMonthGrid,
  defaultMergePicks,
  extractDateKey,
  filterQuickActions,
  groupRecordsByDate,
  resolveMergedFields,
} from './twenty-logic'
import { OBJECTS, TABS, objectOf } from './objects'
import { shape } from './schema'

describe('expanded CRM objects & data model metadata', () => {
  it('registers Notes as a first-class CRM object and calendar fields on date objects', () => {
    expect(TABS).toContain('notes')
    expect(objectOf('notes')?.collection).toBe('notes')
    expect(OBJECTS.notes.columns).toEqual(['title', 'body', 'people', 'companies', 'opportunities', 'updated'])
    expect(OBJECTS.tasks.calendarField).toBe('due')
    expect(OBJECTS.deals.calendarField).toBe('close_date')
    expect(OBJECTS.fundraising.calendarField).toBe('close_date')
    expect(OBJECTS.candidates.calendarField).toBe('applied')
  })

  it('exposes all 13 CRM objects in Data Model', () => {
    expect(CRM_DATA_MODEL_OBJECTS).toHaveLength(13)
    const names = CRM_DATA_MODEL_OBJECTS.map((o) => o.collection)
    expect(names).toContain('people')
    expect(names).toContain('companies')
    expect(names).toContain('opportunities')
    expect(names).toContain('notes')
    expect(names).toContain('attachments')
  })
})

describe('command menu search grouping & quick actions', () => {
  it('groups cross-object search hits in canonical order and deduplicates by id', () => {
    const hits: SearchHit[] = [
      { id: 'n1', objectId: 'notes', collection: 'notes', title: 'Kickoff note', href: '/crm/notes/n1' },
      { id: 'p1', objectId: 'people', collection: 'people', title: 'Ada Lovelace', subtitle: 'ada@acme.io', href: '/crm/people/p1' },
      { id: 'p1', objectId: 'people', collection: 'people', title: 'Ada Lovelace', href: '/crm/people/p1' },
      { id: 'd1', objectId: 'deals', collection: 'opportunities', title: 'Acme Enterprise', href: '/crm/deals/d1' },
      { id: 'c1', objectId: 'companies', collection: 'companies', title: 'Acme Corp', href: '/crm/companies/c1' },
    ]
    const groups = groupSearchHits(hits)
    expect(groups.map((g) => g.objectId)).toEqual(['people', 'companies', 'deals', 'notes'])
    expect(groups[0].hits).toHaveLength(1)
    expect(groups[0].label).toBe('People')
  })

  it('filters quick actions by label and keyword', () => {
    expect(filterQuickActions(CRM_QUICK_ACTIONS, '')).toHaveLength(CRM_QUICK_ACTIONS.length)
    expect(filterQuickActions(CRM_QUICK_ACTIONS, 'copilot').map((a) => a.id)).toEqual(['ask-copilot'])
    expect(filterQuickActions(CRM_QUICK_ACTIONS, 'schema').map((a) => a.id)).toEqual(['open-model'])
    expect(filterQuickActions(CRM_QUICK_ACTIONS, 'memo').map((a) => a.id)).toEqual(['new-note'])
    expect(filterQuickActions(CRM_QUICK_ACTIONS, 'analytics').map((a) => a.id)).toEqual(['open-dashboard'])
  })
})

describe('calendar view month grid & mobile agenda computation', () => {
  it('extracts YYYY-MM-DD keys from Base timestamps, ISO strings, and Dates', () => {
    expect(extractDateKey('2026-11-15 14:30:00.000Z')).toBe('2026-11-15')
    expect(extractDateKey('2026-11-05T09:00:00Z')).toBe('2026-11-05')
    expect(extractDateKey(new Date('2026-12-01T00:00:00Z'))).toBe('2026-12-01')
    expect(extractDateKey('')).toBe('')
    expect(extractDateKey('not-a-date')).toBe('')
  })

  it('builds a Sunday-first 35- or 42-cell month grid with today highlighted', () => {
    const grid = buildMonthGrid(2026, 10, '2026-11-27') // November 2026 (starts Sunday)
    expect(grid.length === 35 || grid.length === 42).toBe(true)
    expect(grid[0]).toMatchObject({ dateKey: '2026-11-01', day: 1, inMonth: true, isToday: false })
    expect(grid.find((c) => c.dateKey === '2026-11-27')?.isToday).toBe(true)
    expect(grid.filter((c) => c.inMonth)).toHaveLength(30)
  })

  it('groups records by date, isolates unscheduled rows, and builds chronological mobile agenda', () => {
    const records = [
      { id: 't2', title: 'Send deck', due: '2026-11-28 10:00:00.000Z', status: 'todo' },
      { id: 't1', title: 'Call Ada', due: '2026-11-27 09:00:00.000Z', status: 'in_progress' },
      { id: 't3', title: 'Backlog task', due: '', status: 'todo' },
      { id: 't4', title: 'December review', due: '2026-12-02 09:00:00.000Z', status: 'todo' },
    ]
    const { byDate, unscheduled } = groupRecordsByDate(records, 'due', 'title')
    expect(unscheduled.map((r) => r.id)).toEqual(['t3'])
    expect(byDate.get('2026-11-27')?.[0].title).toBe('Call Ada')

    const agenda = buildAgendaGroups(byDate, 2026, 10, '2026-11-27')
    expect(agenda.map((g) => g.dateKey)).toEqual(['2026-11-27', '2026-11-28'])
    expect(agenda[0].isToday).toBe(true)
    expect(agenda[1].isToday).toBe(false)
  })
})

describe('record merge & deduplication field resolution', () => {
  const primary: BaseRecord = {
    id: 'p1',
    name: { firstName: 'Ada', lastName: 'Lovelace' },
    emails: { primaryEmail: 'ada@acme.io', additionalEmails: [] },
    job_title: '',
    type: 'prospect',
    created: '2026-01-01',
  }
  const duplicate: BaseRecord = {
    id: 'p2',
    name: { firstName: 'Ada', lastName: 'Byron' },
    emails: { primaryEmail: 'ada@babbage.io', additionalEmails: [] },
    job_title: 'CTO',
    type: 'customer',
    created: '2026-02-01',
  }

  it('auto-picks non-empty duplicate fields when primary is blank', () => {
    const picks = defaultMergePicks(primary, duplicate, ['name', 'emails', 'job_title', 'type', 'created'])
    expect(picks).toEqual({
      name: 'primary',
      emails: 'primary',
      job_title: 'duplicate',
      type: 'primary',
    })
  })

  it('resolves only changed fields and ignores system fields', () => {
    const patch = resolveMergedFields(
      primary,
      duplicate,
      { name: 'primary', job_title: 'duplicate', type: 'duplicate', created: 'duplicate' },
      ['name', 'job_title', 'type', 'created'],
    )
    expect(patch).toEqual({ job_title: 'CTO', type: 'customer' })
  })
})

describe('analytics funnel & dashboard aggregation', () => {
  it('computes sales & fundraising pipelines, weighted values, outreach funnel, and overdue tasks', () => {
    const now = new Date('2026-11-27T12:00:00Z')
    const result = computeAnalytics({
      now,
      opportunities: [
        { id: 'd1', name: 'Acme', pipeline: 'sales', stage: 'proposal', amount: { amountMicros: 100_000_000_000 } },
        { id: 'd2', name: 'Beta', pipeline: '', stage: 'customer', amount: { amountMicros: 50_000_000_000 } },
        { id: 'd3', name: 'Gamma', pipeline: 'sales', stage: 'lost', amount: { amountMicros: 20_000_000_000 } },
        { id: 'f1', name: 'Seed Fund', pipeline: 'fundraising', stage: 'term_sheet', amount: { amountMicros: 1_000_000_000_000 } },
      ],
      tasks: [
        { id: 't1', title: 'Overdue follow-up', status: 'todo', due: '2026-11-24 12:00:00.000Z', assignee: 'ada@hanzo.ai' },
        { id: 't2', title: 'Completed past task', status: 'done', due: '2026-11-20 12:00:00.000Z' },
        { id: 't3', title: 'Future task', status: 'todo', due: '2026-12-05 12:00:00.000Z' },
      ],
      activities: [
        { id: 'a1', kind: 'email', direction: 'out', subject: 'Intro', person: 'p1', at: '2026-11-26 10:00:00.000Z', data: { status: 'clicked', events: [{ status: 'opened', at: 1 }, { status: 'clicked', at: 2 }] } },
        { id: 'a2', kind: 'email', direction: 'out', subject: 'Ping', person: 'p2', at: '2026-11-25 10:00:00.000Z', data: { status: 'bounced' } },
        { id: 'a3', kind: 'email', direction: 'in', subject: 'Re: Intro', person: 'p1', at: '2026-11-26 15:00:00.000Z', data: { status: 'received' } },
      ],
      people: [
        { id: 'p1', outreach: 'replied' },
      ],
    })

    expect(result.sales.openDeals).toBe(1)
    expect(result.sales.wonDeals).toBe(1)
    expect(result.sales.lostDeals).toBe(1)
    expect(result.sales.totalValue).toBe(100_000)
    expect(result.sales.weightedValue).toBe(70_000) // proposal = 0.7
    expect(result.sales.conversionRate).toBe(0.5)

    expect(result.fundraising.openDeals).toBe(1)
    expect(result.fundraising.totalValue).toBe(1_000_000)
    expect(result.fundraising.weightedValue).toBe(800_000) // term_sheet = 0.8

    expect(result.outreach.sent).toBe(2)
    expect(result.outreach.opened).toBe(1)
    expect(result.outreach.clicked).toBe(1)
    expect(result.outreach.replied).toBe(1)
    expect(result.outreach.bounced).toBe(1)
    expect(result.outreach.replyRate).toBe(0.5)

    expect(result.overdueTasks).toHaveLength(1)
    expect(result.overdueTasks[0]).toMatchObject({ id: 't1', daysOverdue: 3 })
    expect(result.recentActivities[0].href).toBe('/crm/people/p1')
  })
})

describe('custom field validation & slugification', () => {
  it('slugifies human labels into valid Base field names', () => {
    expect(slugifyFieldName('Lead Score %')).toBe('lead_score')
    expect(slugifyFieldName('  2026 ARR Target ')).toBe('f_2026_arr_target')
  })

  it('validates reserved names, duplicates, select options, and relation targets', () => {
    const existing = new Set(['name', 'emails', 'lead_score'])
    expect(validateCustomField({ label: 'Lead Score', type: 'number' }, existing).valid).toBe(false)
    expect(validateCustomField({ label: 'ID', name: 'id', type: 'text' }, existing).valid).toBe(false)
    expect(validateCustomField({ label: 'Tier', type: 'select', options: [] }, existing).valid).toBe(false)
    expect(validateCustomField({ label: 'Partner', type: 'relation' }, existing).valid).toBe(false)

    const ok = validateCustomField({ label: 'Account Tier', type: 'select', options: ['Gold', 'Silver'] }, existing)
    expect(ok).toEqual({ valid: true, slug: 'account_tier', errors: [] })
  })
})

describe('bulk CSV export & attachments helpers', () => {
  it('builds formula-safe CSV from selected records', () => {
    const schema = shape(OBJECTS.people, {
      name: 'people',
      fields: [
        { name: 'name', type: 'fullName', label: 'Name', position: 1 },
        { name: 'emails', type: 'emails', label: 'Emails', position: 2 },
        { name: 'job_title', type: 'text', label: 'Job Title', position: 3 },
      ],
    })
    const csv = buildBulkCsv(schema, [
      { id: 'p1', name: { firstName: 'Ada', lastName: 'Lovelace' }, emails: { primaryEmail: 'ada@acme.io' }, job_title: '=SUM(1,2)' },
    ])
    expect(csv).toContain('ID,Name,Emails,Job Title')
    expect(csv).toContain(`p1,Ada Lovelace,ada@acme.io,"'=SUM(1,2)"`)
  })

  it('builds attachment filters and targets across all linked CRM collections', () => {
    expect(attachmentTargetFor('people', 'p1')).toEqual({ person: 'p1' })
    expect(attachmentTargetFor('opportunities', 'o1')).toEqual({ opportunity: 'o1' })
    expect(attachmentTargetFor('notes', 'n1')).toEqual({ note: 'n1' })
    expect(attachmentTargetFor('tasks', 't1')).toEqual({ task: 't1' })
    expect(attachmentFilter({ opportunity: 'o"1' })).toBe('opportunity = "o1"')
  })
})

describe('AI copilot context & deterministic offline fallback', () => {
  it('produces actionable enrichment, email draft, summary, tasks, and stale deal audits', () => {
    const enrich = fallbackAiAssist({
      action: 'enrich',
      objectId: 'deals',
      collection: 'opportunities',
      title: 'Acme Deal',
      record: { id: 'd1', name: 'Acme Deal', stage: 'proposal', next_step: '' },
    })
    expect(enrich.source).toBe('fallback')
    expect(enrich.suggestedPatch?.next_step).toBeTruthy()

    const draft = fallbackAiAssist({
      action: 'draft_email',
      objectId: 'people',
      collection: 'people',
      title: 'Ada Lovelace',
      record: { id: 'p1', emails: { primaryEmail: 'ada@acme.io' } },
      timeline: [{ kind: 'call', subject: 'Discovery call', body: 'Great chat', at: 1700000000 }],
    })
    expect(draft.emailDraft?.subject).toContain('Ada Lovelace')
    expect(draft.emailDraft?.body).toContain('Discovery call')

    const summary = fallbackAiAssist({
      action: 'summarize',
      title: 'Ada Lovelace',
      timeline: [
        { kind: 'email', subject: 'Intro', body: 'Hello', at: 1700000100 },
        { kind: 'note', subject: 'Notes', body: 'Interested', at: 1700000000 },
      ],
    })
    expect(summary.bullets?.[0]).toContain('2')

    const tasks = fallbackAiAssist({
      action: 'extract_tasks',
      collection: 'opportunities',
      title: 'Acme Deal',
      record: { stage: 'meeting' },
    })
    expect(tasks.suggestedTasks?.length).toBeGreaterThanOrEqual(2)

    const stale = fallbackAiAssist({
      action: 'audit_stale',
      collection: 'opportunities',
      records: [
        { id: 'd1', name: 'Old Deal', stage: 'meeting', updated: '2025-01-01 00:00:00.000Z' },
        { id: 'd2', name: 'Won Deal', stage: 'customer', updated: '2025-01-01 00:00:00.000Z' },
      ],
    })
    expect(stale.summary).toContain('1 record')
    expect(stale.suggestedTasks?.[0].title).toContain('Old Deal')
  })
})

describe('CrmApi automatic Base fallback when /v1/crm/* is unavailable', () => {
  function setupMockHost() {
    const updateRecord = vi.fn(async (_c: string, id: string, body: Record<string, unknown>) => ({ id, ...body }))
    const deleteRecord = vi.fn(async () => {})
    const createRecord = vi.fn(async (_c: string, body: Record<string, unknown>) => ({ id: 'att1', ...body }))
    const listRecords = vi.fn(async (collection: string) => ({
      page: 1,
      perPage: 50,
      totalItems: collection === 'people' ? 1 : 0,
      totalPages: 1,
      items: collection === 'people'
        ? [{ id: 'p1', name: { firstName: 'Ada', lastName: 'Lovelace' }, emails: { primaryEmail: 'ada@acme.io' } }]
        : [],
    }))

    const mockHost: CrmHost = {
      v1Url: (p) => `https://api.test/v1/${p}`,
      get: vi.fn(async () => { throw new ApiError('Not Found', 404) }),
      post: vi.fn(async () => { throw new ApiError('Not Found', 404) }),
      del: vi.fn(async () => { throw new ApiError('Not Found', 404) }),
      base: () => ({
        getCollection: async () => undefined,
        listRecords,
        getRecord: async (_c, id) => ({ id }),
        createRecord,
        updateRecord,
        deleteRecord,
      }),
      org: () => 'hanzo',
      leaveOrg: () => {},
      brand: () => ({ brandName: 'Hanzo', websiteUrl: 'https://hanzo.ai' }),
      gated: false,
      useSession: () => ({ account: { name: 'Admin', superAdmin: true }, signOut: () => {} }),
      useRouter: () => ({ push: () => {}, replace: () => {} }),
      useSearchParams: () => null,
    }
    configureCrm(mockHost)
    return { updateRecord, deleteRecord, createRecord, listRecords }
  }

  it('falls back cleanly for search, merge, moveStage, aiAssist, analytics, and attachments', async () => {
    const { updateRecord, deleteRecord, createRecord } = setupMockHost()

    const searchGroups = await CrmApi.search('Ada')
    expect(searchGroups).toHaveLength(1)
    expect(searchGroups[0].hits[0].title).toBe('Ada Lovelace')

    const merged = await CrmApi.merge('people', 'p1', 'p2', { job_title: 'CTO' })
    expect(merged.source).toBe('base')
    expect(updateRecord).toHaveBeenCalledWith('people', 'p1', { job_title: 'CTO' })
    expect(deleteRecord).toHaveBeenCalledWith('people', 'p2')

    const moved = await CrmApi.moveStage('opportunities', 'd1', 'proposal')
    expect(moved).toEqual({ id: 'd1', stage: 'proposal' })

    const ai = await CrmApi.aiAssist({ action: 'summarize', title: 'Ada', timeline: [] })
    expect(ai.source).toBe('fallback')

    const analytics = await CrmApi.analytics()
    expect(analytics.source).toBe('base')

    const att = await CrmApi.attachments.upload({ person: 'p1' }, { name: 'NDA.pdf', file: 'https://files.test/nda.pdf', category: 'contract' })
    expect(att.id).toBe('att1')
    expect(createRecord).toHaveBeenCalledWith('attachments', expect.objectContaining({ name: 'NDA.pdf', person: 'p1', category: 'contract' }))
  })
})
