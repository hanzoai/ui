/**
 * The CRM's objects: which collection of the org's Base each tab reads, what it
 * shows first, and the views it starts with. Pure data — the components read it.
 *
 * Two tabs read one collection: Pipeline and Fundraising are both `opportunities`,
 * each scoped to its pipeline, and each board's lanes are that pipeline's stages.
 * An opportunity written before pipelines existed has none and is a sale.
 *
 * A starter view is code, the same for every org; a saved view is the org's (Base
 * `views`, by object). A starter view that names a field the org's CRM does not
 * have yet (one installed before that field was added) is not offered.
 */
import type { FilterRule, SortRule, ViewConfig } from '@hanzo/data'

export type ObjectId = 'people' | 'companies' | 'deals' | 'fundraising' | 'tasks' | 'lists' | 'candidates'

export interface StarterView {
  id: string
  name: string
  filters?: FilterRule[]
  match?: 'and' | 'or'
  sorts?: SortRule[]
  kind?: ViewConfig['kind']
  /** A Base filter beyond the view's rules (who has a form, who is in a list). */
  scope?: string
  /** A line above the table, where the view needs one. */
  note?: string
}

/** Until inbound mail is filed, a reply is the team's to mark. */
export const REPLIED_BY_HAND = 'Replies are not read from the inbox yet: when someone answers, open them and press Mark replied.'

/** A customer is a person the team marked one: nothing outside the CRM writes the type. */
export const CUSTOMER_BY_HAND = 'A customer here is a person whose Type is Customer. Store orders and billing plans are not copied into the CRM yet, so set Type on the person, or in an import.'

export interface CrmObject {
  id: ObjectId
  collection: string
  label: string
  plural: string
  /** The field a record is named by. */
  title: string
  /** What every row of this tab must meet, beyond any view. */
  scope?: string
  /** What a new record of this tab starts with. */
  defaults?: Record<string, unknown>
  /** The columns shown first, in order; every other field is one press away. */
  columns: string[]
  /** The fields a new record is asked for. */
  create: string[]
  views: StarterView[]
  /** The field a board groups by, and the lanes it draws, in order. */
  board?: { field: string; lanes?: string[] }
  /** Opens as a board. */
  boardFirst?: boolean
  /** People and companies come in from a file. */
  importable?: boolean
}

/** A sale's stages, and a round's. Both end in lost. */
export const SALES_STAGES = ['new', 'screening', 'meeting', 'proposal', 'customer', 'lost']
export const ROUND_STAGES = ['intro', 'meeting', 'diligence', 'term_sheet', 'closed', 'lost']

const recent: SortRule[] = [{ field: 'created', dir: 'desc' }]

export const OBJECTS: Record<ObjectId, CrmObject> = {
  people: {
    id: 'people',
    collection: 'people',
    label: 'Person',
    plural: 'People',
    title: 'name',
    columns: ['name', 'emails', 'company', 'type', 'job_title', 'outreach', 'contacted', 'lifecycle', 'created'],
    create: ['name', 'emails', 'company', 'type', 'job_title', 'phones'],
    importable: true,
    views: [
      { id: 'all', name: 'All people', sorts: recent },
      { id: 'investors', name: 'Investors', filters: [{ field: 'type', op: 'is', value: 'investor' }], sorts: [{ field: 'contacted', dir: 'asc' }] },
      { id: 'customers', name: 'Customers', filters: [{ field: 'type', op: 'is', value: 'customer' }], sorts: recent, note: CUSTOMER_BY_HAND },
      { id: 'inbound', name: 'Inbound', scope: 'activities_via_person.kind ?= "form"', sorts: recent },
      { id: 'support', name: 'Support & Help Chat', scope: 'activities_via_person.data.program ?= "support"', sorts: recent },
      { id: 'sales_chat', name: 'Sales Chat', scope: 'activities_via_person.data.program ?= "chat"', sorts: recent },
      { id: 'feedback', name: 'Product Feedback', scope: 'activities_via_person.data.program ?= "feedback"', sorts: recent },
      { id: 'replied', name: 'Replied', filters: [{ field: 'outreach', op: 'is', value: 'replied' }], sorts: [{ field: 'contacted', dir: 'desc' }], note: REPLIED_BY_HAND },
      { id: 'unreachable', name: 'Bounced or opted out', filters: [{ field: 'outreach', op: 'isAnyOf', value: ['bounced', 'unsubscribed'] }], sorts: recent },
    ],
  },
  companies: {
    id: 'companies',
    collection: 'companies',
    label: 'Company',
    plural: 'Companies',
    title: 'name',
    columns: ['name', 'domain', 'type', 'employees', 'annual_revenue', 'owner', 'created'],
    create: ['name', 'domain', 'type', 'employees'],
    importable: true,
    views: [
      { id: 'all', name: 'All companies', sorts: recent },
      { id: 'investors', name: 'Investors', filters: [{ field: 'type', op: 'is', value: 'investor' }], sorts: [{ field: 'name', dir: 'asc' }] },
      { id: 'customers', name: 'Customers', filters: [{ field: 'type', op: 'is', value: 'customer' }], sorts: [{ field: 'name', dir: 'asc' }] },
    ],
  },
  deals: {
    id: 'deals',
    collection: 'opportunities',
    label: 'Deal',
    plural: 'Pipeline',
    title: 'name',
    scope: '(pipeline = "sales" || pipeline = "")',
    defaults: { pipeline: 'sales', stage: 'new' },
    columns: ['name', 'company', 'contact', 'stage', 'amount', 'close_date', 'owner', 'next_step', 'contacted'],
    create: ['name', 'company', 'contact', 'stage', 'amount', 'close_date'],
    board: { field: 'stage', lanes: SALES_STAGES },
    boardFirst: true,
    views: [
      { id: 'all', name: 'All deals', sorts: [{ field: 'close_date', dir: 'asc' }] },
      { id: 'open', name: 'Open', filters: [{ field: 'stage', op: 'isAnyOf', value: ['new', 'screening', 'meeting', 'proposal'] }], sorts: [{ field: 'close_date', dir: 'asc' }] },
      { id: 'won', name: 'Won', filters: [{ field: 'stage', op: 'is', value: 'customer' }], sorts: [{ field: 'close_date', dir: 'desc' }] },
    ],
  },
  fundraising: {
    id: 'fundraising',
    collection: 'opportunities',
    label: 'Investor deal',
    plural: 'Fundraising',
    title: 'name',
    scope: 'pipeline = "fundraising"',
    defaults: { pipeline: 'fundraising', stage: 'intro' },
    columns: ['name', 'company', 'contact', 'stage', 'amount', 'next_step', 'contacted', 'close_date', 'owner'],
    create: ['name', 'company', 'contact', 'stage', 'amount', 'next_step'],
    board: { field: 'stage', lanes: ROUND_STAGES },
    boardFirst: true,
    views: [
      { id: 'all', name: 'All investors', sorts: [{ field: 'contacted', dir: 'asc' }] },
      { id: 'active', name: 'In progress', filters: [{ field: 'stage', op: 'isAnyOf', value: ['intro', 'meeting', 'diligence', 'term_sheet'] }], sorts: [{ field: 'contacted', dir: 'asc' }] },
      { id: 'closing', name: 'Term sheet and closed', filters: [{ field: 'stage', op: 'isAnyOf', value: ['term_sheet', 'closed'] }], sorts: [{ field: 'amount', dir: 'desc' }] },
    ],
  },
  tasks: {
    id: 'tasks',
    collection: 'tasks',
    label: 'Task',
    plural: 'Tasks',
    title: 'title',
    defaults: { status: 'todo' },
    columns: ['title', 'status', 'due', 'assignee', 'people', 'companies', 'opportunities'],
    create: ['title', 'due', 'assignee', 'status'],
    board: { field: 'status' },
    views: [
      { id: 'open', name: 'Open', filters: [{ field: 'status', op: 'isAnyOf', value: ['todo', 'in_progress'] }], sorts: [{ field: 'due', dir: 'asc' }] },
      { id: 'all', name: 'All tasks', sorts: recent },
      { id: 'done', name: 'Done', filters: [{ field: 'status', op: 'is', value: 'done' }], sorts: [{ field: 'updated', dir: 'desc' }] },
    ],
  },
  lists: {
    id: 'lists',
    collection: 'lists',
    label: 'List',
    plural: 'Lists',
    title: 'name',
    defaults: { object: 'people' },
    columns: ['name', 'description', 'purpose', 'owner', 'created'],
    create: ['name', 'description', 'purpose'],
    views: [{ id: 'all', name: 'All lists', sorts: recent }],
  },
  candidates: {
    id: 'candidates',
    collection: 'candidates',
    label: 'Candidate',
    plural: 'Candidates',
    title: 'name',
    columns: ['name', 'emails', 'role', 'job', 'stage', 'location', 'applied', 'source'],
    create: ['name', 'emails', 'role', 'job'],
    board: { field: 'stage' },
    views: [
      { id: 'all', name: 'All candidates', sorts: [{ field: 'applied', dir: 'desc' }] },
      { id: 'open', name: 'In process', filters: [{ field: 'stage', op: 'isAnyOf', value: ['new', 'screening', 'interview', 'offer'] }], sorts: [{ field: 'applied', dir: 'desc' }] },
    ],
  },
}

/** The tabs in the order the rail lists them; the first is the CRM's index. */
export const TABS: ObjectId[] = ['people', 'companies', 'deals', 'fundraising', 'tasks', 'lists', 'candidates']

/** A tab by its address segment; the index is People. Old addresses land on what replaced them. */
export function objectOf(tab: string | undefined): CrmObject | null {
  const t = (tab ?? '').toLowerCase()
  if (!t) return OBJECTS.people
  const moved: Record<string, ObjectId> = {
    leads: 'people', contacts: 'people', investors: 'fundraising', funds: 'companies', customers: 'people',
    opportunities: 'deals', outreach: 'lists',
  }
  const id = (t in OBJECTS ? t : moved[t]) as ObjectId | undefined
  return id ? OBJECTS[id] : null
}

/**
 * The view an old address opens on the tab that replaced it: /crm/customers was a
 * table of customers, and is now People's Customers view, not everyone in People.
 */
export function movedView(tab: string | undefined): string | undefined {
  const views: Record<string, string> = { customers: 'customers' }
  return views[(tab ?? '').toLowerCase()]
}

/** The view a table opens on: the one the address names, if the table has it, or its first. */
export function openingView<T extends { config: { id: string } }>(starters: T[], named: string | null | undefined): T | undefined {
  return (named && starters.find((s) => s.config.id === `starter:${named}`)) || starters[0]
}

/** Whether a starter view can run on the fields this org's CRM has. */
export function viewFits(view: StarterView, fields: ReadonlySet<string>): boolean {
  return [...(view.filters ?? []), ...(view.sorts ?? [])].every((r) => fields.has(r.field))
}

/** A starter view as the table holds it. */
export function starter(obj: CrmObject, v: StarterView): ViewConfig {
  return {
    id: `starter:${v.id}`,
    name: v.name,
    kind: v.kind ?? (obj.boardFirst ? 'board' : 'table'),
    filters: v.filters ?? [],
    match: v.match,
    sorts: v.sorts ?? [],
    groupField: obj.board?.field,
    pageSize: 50,
  }
}
