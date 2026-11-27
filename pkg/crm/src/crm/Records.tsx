'use client'

/**
 * One CRM object as a table or a board, every page of it read from the server.
 *
 * The view (search, filter rules by every or any, sort, columns) is the query:
 * `baseQuery` writes it in Base's language and the org's Base answers one page of
 * it with the total, so a table of a hundred thousand people opens as fast as a
 * table of ten and a filter reaches every row, not the rows that happened to load.
 * The board reads the first 200 of its pipeline the same way.
 *
 * Views are the object's starter views (objects.ts) and the org's saved ones (Base
 * `views`, by object): choosing one sets the view, and saving writes it back. A
 * cell edits in place (one PATCH, the row read back), a board card moves its stage,
 * and the selection bar acts on the rows chosen, or on every row the view admits.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Spinner, Text, XStack, YStack } from '@hanzo/gui'
import { RecordsView, type FieldDefinition, type SelectOption, type ViewConfig } from '@hanzo/data'
import { BackendStateCard, classifyBackend } from '@hanzo/ui/product'
import { CrmApi } from '../lib/crm'
import type { BaseRecord } from '../lib/base-data/api'
import { toBase, type BaseField } from '../lib/base-data/fields'
import { baseQuery } from '../lib/base-data/query'
import { useRouter } from '../lib/host'
import { useChanges } from '../lib/live'
import { openingView, starter, viewFits, type CrmObject } from './objects'
import { expandOf, forgetOptions, rowOf, useAdmin, useRelationOptions, useSchema, words, type Schema } from './schema'
import { Bulk, Everyone, Grow } from './Actions'
import { BulkBar } from './BulkBar'
import { CalendarView } from './CalendarView'
import { CreateRecord } from './Create'
import { useCrmShell, type CrmViewMode } from './CrmContext'
import { MobileCards } from './MobileCards'
import { useViewport } from './responsive'

/** A view the picker lists: a starter's or a saved one, and the scope a starter carries. */
interface Listed {
  config: ViewConfig
  scope?: string
  /** A starter's line above the table. */
  note?: string
  /** The Base `views` record a saved view is, absent for a starter. */
  record?: string
}

/** A saved view (Base `views`) as the table holds it. */
function fromSaved(r: BaseRecord, groupField?: string): Listed {
  const where = (r.where && typeof r.where === 'object' ? r.where : {}) as { filters?: ViewConfig['filters']; match?: ViewConfig['match']; scope?: string }
  const fields = (r.fields && typeof r.fields === 'object' ? r.fields : {}) as { order?: string[]; hidden?: string[]; pageSize?: number }
  return {
    record: String(r.id),
    scope: typeof where.scope === 'string' ? where.scope : undefined,
    config: {
      id: String(r.id),
      name: String(r.name || 'View'),
      kind: r.type === 'kanban' ? 'board' : 'table',
      filters: Array.isArray(where.filters) ? where.filters : [],
      match: where.match === 'or' ? 'or' : 'and',
      sorts: Array.isArray(r.sorts) ? (r.sorts as ViewConfig['sorts']) : [],
      search: typeof r.search === 'string' ? r.search : '',
      groupField: typeof r.group_by === 'string' && r.group_by ? r.group_by : groupField,
      columnOrder: fields.order,
      hiddenFields: fields.hidden,
      pageSize: fields.pageSize ?? 50,
    },
  }
}

/** A view as a Base `views` record of this object. */
const toSaved = (object: string, v: ViewConfig, scope?: string): Record<string, unknown> => ({
  name: v.name,
  object,
  type: v.kind === 'board' ? 'kanban' : 'table',
  where: { filters: v.filters, match: v.match ?? 'and', ...(scope ? { scope } : {}) },
  sorts: v.sorts,
  search: v.search ?? '',
  group_by: v.groupField ?? '',
  fields: { order: v.columnOrder, hidden: v.hiddenFields, pageSize: v.pageSize },
  visibility: 'org',
})

/** The columns a view shows first: the object's, in its order, every other field hidden until asked for. */
function withColumns(obj: CrmObject, schema: Schema, v: ViewConfig): ViewConfig {
  if (v.columnOrder || v.hiddenFields) return v
  const shown = obj.columns.filter((c) => schema.names.has(c))
  return { ...v, columnOrder: shown, hiddenFields: schema.fields.map((f) => f.name).filter((n) => !shown.includes(n)) }
}

/** A key that changes when the query does; the search in it is the settled one, so a burst of typing is one read. */
const queryKey = (v: ViewConfig | null, search: string) => (v ? JSON.stringify([v.filters, v.match, v.sorts, search, v.kind]) : '')

function useSettled<T>(value: T, ms: number): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

export interface RecordsProps {
  obj: CrmObject
  /** A Base filter every row must also meet: a list's members, a company's people. */
  scope?: string
  /** Inside a record page: no title, no saved views, a short page. */
  embedded?: boolean
  /** What a new record of this table starts with (a company's person names the company). */
  defaults?: Record<string, unknown>
  /** More actions on the selected rows. */
  bulkExtra?: (ids: string[], done: () => void) => ReactNode
  /** The starter view to open on (`customers`), when the address names one. */
  view?: string | null
}

type Data = { rows: Record<string, unknown>[]; total: number; ms: number } | null

export function Records({ obj, scope, embedded, defaults, bulkExtra, view: opening }: RecordsProps) {
  const router = useRouter()
  const admin = useAdmin()
  const { mobile } = useViewport()
  const {
    viewMode,
    setViewMode,
    setAvailableViews,
    setActiveList,
    quickCreateObject,
    setQuickCreateObject,
  } = useCrmShell()
  const [round, setRound] = useState(0)
  const [mobileSelected, setMobileSelected] = useState<string[]>([])
  const load = useSchema(obj, round)
  const schema = load.state === 'ready' ? load.value : null
  const options = useRelationOptions(schema)

  // A CRM installed before pipelines has every deal in sales: Pipeline is all of them,
  // and only Fundraising needs the field.
  const pipelined = !obj.scope || obj.id === 'deals' || schema?.names.has('pipeline')
  const tabScope = obj.scope && schema?.names.has('pipeline') ? obj.scope : undefined

  // ── views ──
  const starters = useMemo<Listed[]>(
    () => (schema ? obj.views.filter((v) => viewFits(v, schema.names)).map((v) => ({ config: withColumns(obj, schema, starter(obj, v)), scope: v.scope, note: v.note })) : []),
    [obj, schema],
  )
  const [saved, setSaved] = useState<Listed[]>([])
  const readSaved = useCallback(() => {
    if (embedded) return
    CrmApi.list('views', { filter: `object = "${obj.id}"`, sort: 'position,created', perPage: 100, skipTotal: true })
      .then((r) => setSaved(r.items.map((x) => fromSaved(x, obj.board?.field))))
      .catch(() => setSaved([]))
  }, [obj, embedded])
  useEffect(readSaved, [readSaved])
  const listed = useMemo(() => [...starters, ...saved], [starters, saved])

  const [activeId, setActiveId] = useState<string | undefined>()
  const [view, setView] = useState<ViewConfig | null>(null)
  const [page, setPage] = useState(1)
  useEffect(() => {
    setActiveId(undefined)
    setView(null)
    setPage(1)
    setMobileSelected([])
  }, [obj, scope])
  useEffect(() => {
    const first = view ? undefined : openingView(starters, opening)
    if (!first) return
    setActiveId(first.config.id)
    const initial = embedded ? { ...first.config, kind: 'table' as const, pageSize: 10 } : first.config
    setView(initial)
    if (!embedded) {
      setViewMode(initial.kind === 'board' ? 'board' : 'table')
    }
  }, [starters, view, embedded, opening, setViewMode])
  const hasCalendar = Boolean(!embedded && obj.calendarField && schema?.names.has(obj.calendarField))
  useEffect(() => {
    if (embedded) return
    const modes: CrmViewMode[] = ['table', ...(obj.board ? (['board'] as const) : []), ...(hasCalendar ? (['calendar'] as const) : [])]
    setAvailableViews(modes)
    return () => setAvailableViews(['table'])
  }, [embedded, obj.board, hasCalendar, setAvailableViews])
  useEffect(() => {
    if (embedded || !view) return
    if (viewMode === 'board' && obj.board && view.kind !== 'board') {
      setView({ ...view, kind: 'board' })
    } else if (viewMode === 'table' && view.kind !== 'table') {
      setView({ ...view, kind: 'table' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, embedded, obj.board])
  const active = listed.find((l) => l.config.id === activeId)
  const viewScope = active?.scope

  // ── the query ──
  const search = useSettled(view?.search ?? '', 250)
  const key = queryKey(view, search)
  const [data, setData] = useState<Data>(null)
  const [reading, setReading] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [tick, setTick] = useState(0)
  const seq = useRef(0)
  const raw = useRef(new Map<string, BaseRecord>())
  const expand = useMemo(() => (schema ? expandOf(schema) : ''), [schema])
  const where = [tabScope, viewScope, scope].filter(Boolean).join(' && ')

  const row = useCallback((r: BaseRecord): Record<string, unknown> => (schema ? rowOf(schema, r) : r), [schema])

  const isCalendar = !embedded && viewMode === 'calendar' && hasCalendar

  useEffect(() => {
    if (!schema || !view || !pipelined) return
    const id = ++seq.current
    const boardOrCal = view.kind === 'board' || isCalendar
    const q = baseQuery(schema.base, { ...view, search }, where)
    const t0 = performance.now()
    setReading(true)
    CrmApi.list(obj.collection, {
      page: boardOrCal ? 1 : page,
      perPage: boardOrCal ? 200 : (view.pageSize ?? 50),
      filter: q.filter || undefined,
      sort: q.sort || undefined,
      expand: expand || undefined,
    })
      .then((r) => {
        if (id !== seq.current) return
        raw.current = new Map(r.items.map((x) => [String(x.id), x]))
        setData({ rows: r.items.map(row), total: r.totalItems, ms: Math.round(performance.now() - t0) })
        if (!embedded) {
          setActiveList({ objectId: obj.id, collection: obj.collection, total: r.totalItems, records: r.items })
        }
        setError(null)
      })
      .catch((e) => id === seq.current && setError(e))
      .finally(() => id === seq.current && setReading(false))
    // `view` is read through `key`, whose search is the settled one: typing is one read, not one per key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema, key, page, where, expand, tick, obj, pipelined, isCalendar])

  useEffect(() => {
    if (embedded) return
    return () => setActiveList(null)
  }, [embedded, setActiveList])

  const refresh = useCallback(() => setTick((t) => t + 1), [])
  useChanges([obj.collection], refresh)

  // ── edits ──
  const baseByName = useMemo(() => new Map((schema?.base ?? []).map((f) => [f.name, f])), [schema])
  const write = useCallback(
    async (record: Record<string, unknown>, patch: Record<string, unknown>) => {
      const id = String(record.id)
      const prior = raw.current.get(id) ?? {}
      const body: Record<string, unknown> = {}
      for (const [name, value] of Object.entries(patch)) {
        const f = baseByName.get(name)
        if (f) body[name] = toBase(f.type, value, prior[name])
      }
      await CrmApi.update(obj.collection, id, body)
      // Read the row back with its relations, so a cell shows what the server holds.
      const fresh = await CrmApi.get(obj.collection, id, expand || undefined)
      raw.current.set(id, fresh)
      setData((d) => (d ? { ...d, rows: d.rows.map((x) => (String(x.id) === id ? row(fresh) : x)) } : d))
    },
    [baseByName, obj, expand, row],
  )

  const fieldOptions = useCallback((f: FieldDefinition): SelectOption[] | undefined => options.get(f.name), [options])
  // A board card is the record's first few columns after its name, never every field.
  const cards = useMemo(
    () =>
      obj.columns
        .filter((c) => c !== obj.title && c !== obj.board?.field)
        .map((c) => schema?.fields.find((f) => f.name === c))
        .filter((f): f is FieldDefinition => Boolean(f))
        .slice(0, 4),
    [obj, schema],
  )
  const fields = useMemo(
    () => (schema?.fields ?? []).map((f) => (f.type === 'relation' && (baseByName.get(f.name)?.maxSelect ?? 1) > 1 ? { ...f, readOnly: true } : f)),
    [schema, baseByName],
  )

  // ── views kept ──
  const onSaveView = async (v: ViewConfig) => {
    const existing = saved.find((s) => s.config.id === v.id)
    try {
      if (existing?.record) {
        await CrmApi.update('views', existing.record, toSaved(obj.id, v, existing.scope))
        setActiveId(v.id)
      } else {
        const name = typeof window !== 'undefined' ? window.prompt('Name this view', v.id.startsWith('starter:') ? `${v.name} (mine)` : v.name) : v.name
        if (!name) return
        const r = await CrmApi.create('views', toSaved(obj.id, { ...v, name }, viewScope))
        setActiveId(String(r.id))
        setView({ ...v, id: String(r.id), name })
      }
      readSaved()
    } catch (e) {
      window.alert(words(e, 'The view was not saved.'))
    }
  }
  const onDeleteView = async (id: string) => {
    const s = saved.find((x) => x.config.id === id)
    if (!s?.record || !window.confirm(`Delete the view "${s.config.name}" for everyone in the org?`)) return
    await CrmApi.remove('views', s.record).catch((e) => window.alert(words(e, 'The view was not deleted.')))
    if (activeId === id) setView(null)
    readSaved()
  }

  // `/` finds: the table's search takes the key, as in every list a person types into.
  const box = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (embedded) return
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey || (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)))) return
      const input = box.current?.querySelector<HTMLInputElement>('input[placeholder^="Search"]')
      if (!input) return
      e.preventDefault()
      input.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [embedded])

  const [creating, setCreating] = useState(false)
  useEffect(() => {
    if (!embedded && quickCreateObject === obj.id) {
      setCreating(true)
      setQuickCreateObject(null)
    }
  }, [embedded, quickCreateObject, obj.id, setQuickCreateObject])

  if (load.state === 'error') {
    return <BackendStateCard state={classifyBackend(load.error)} onRetry={() => setRound((r) => r + 1)} hint={`endpoint · GET /v1/base/collections/${obj.collection}`} />
  }
  if (!schema || !view) {
    return (
      <YStack minH={embedded ? 80 : 240} items="center" justify="center">
        <Spinner size="large" color="$color11" />
      </YStack>
    )
  }
  if (!pipelined) {
    return <Grow admin={admin} what={`${obj.plural} needs the pipelines this CRM was installed without.`} onGrown={() => setRound((r) => r + 1)} />
  }

  const query = () => baseQuery(schema.base, view, where)
  const records = data?.rows ?? []

  return (
    <YStack gap="$3" ref={box as never} data-slot="crm-records" data-object={obj.id}>
      {embedded ? null : (
        <XStack items="baseline" justify="space-between" gap="$3" flexWrap="wrap">
          <XStack items="baseline" gap="$2">
            <Text fontSize="$7" fontWeight="700" color="$color12">
              {obj.plural}
            </Text>
            <Text fontSize="$3" color="$color10" data-slot="crm-total">
              {data ? data.total.toLocaleString() : '…'}
            </Text>
            {reading ? <Spinner size="small" color="$color10" /> : null}
          </XStack>
          {data ? (
            <Text fontSize="$1" color="$color9" data-slot="crm-timing">
              {`read in ${data.ms} ms`}
            </Text>
          ) : null}
        </XStack>
      )}
      {schema.names.has('type') || obj.collection !== 'people' || embedded ? null : (
        <Grow admin={admin} quiet what="Types, outreach and last contact arrive with the CRM's next update." onGrown={() => setRound((r) => r + 1)} />
      )}
      {active?.note && !embedded ? (
        <Text fontSize="$2" color="$color10" data-slot="crm-view-note">
          {active.note}
        </Text>
      ) : null}
      {error ? (
        <BackendStateCard state={classifyBackend(error)} onRetry={refresh} hint={`endpoint · GET /v1/base/collections/${obj.collection}/records`} />
      ) : null}
      {isCalendar && obj.calendarField ? (
        <CalendarView
          records={records}
          dateField={obj.calendarField}
          dateLabel={schema.fields.find((f) => f.name === obj.calendarField)?.label}
          titleField={obj.title}
          onOpen={(r) => router.push(`/crm/${obj.id}/${String(r.id)}`)}
          onCreate={() => setCreating(true)}
          createLabel={`New ${obj.label.toLowerCase()}`}
        />
      ) : mobile && view.kind === 'table' ? (
        <>
          <MobileCards
            fields={fields}
            titleField={obj.title}
            records={records}
            loading={!data}
            empty={view.filters.length || view.search ? 'Nothing matches this view.' : `No ${obj.plural.toLowerCase()} yet.`}
            search={view.search ?? ''}
            onSearchChange={(s) => {
              setView({ ...view, search: s })
              setPage(1)
            }}
            selectedIds={mobileSelected}
            onToggleSelect={(id) =>
              setMobileSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
            }
            onOpen={(r) => router.push(`/crm/${obj.id}/${String(r.id)}`)}
            onCreate={() => setCreating(true)}
            createLabel={`New ${obj.label.toLowerCase()}`}
            page={page}
            total={data?.total ?? 0}
            pageSize={view.pageSize ?? 50}
            onPage={setPage}
          />
          <BulkBar
            obj={obj}
            schema={schema}
            ids={mobileSelected}
            raw={raw.current}
            extra={bulkExtra?.(mobileSelected, refresh)}
            onClear={() => setMobileSelected([])}
            onDone={refresh}
          />
        </>
      ) : (
        <RecordsView
          fields={fields}
          records={records}
          loading={!data}
          empty={view.filters.length || view.search ? 'Nothing matches this view.' : `No ${obj.plural.toLowerCase()} yet.`}
          view={view}
          onViewChange={(v) => {
            setView(v)
            if (!embedded && (v.kind === 'board' || v.kind === 'table')) setViewMode(v.kind)
            setPage(1)
          }}
          remote={{ page, total: data?.total ?? 0, onPage: setPage }}
          savedViews={
            embedded
              ? undefined
              : {
                  views: listed.map((l) => l.config),
                  activeId,
                  onSelect: (id) => {
                    const l = listed.find((x) => x.config.id === id)
                    if (!l) return
                    setActiveId(id)
                    setView(l.config)
                    setViewMode(l.config.kind === 'board' ? 'board' : 'table')
                    setPage(1)
                  },
                  onSave: onSaveView,
                  onDelete: (id) => void onDeleteView(id),
                  // A starter view is the CRM's, the same for every org: only a saved one goes.
                  deletable: (id) => !id.startsWith('starter:'),
                }
          }
          onOpen={(r) => router.push(`/crm/${obj.id}/${String(r.id)}`)}
          onCreate={() => setCreating(true)}
          createLabel={`New ${obj.label.toLowerCase()}`}
          onEditCommit={(r, f, v) => write(r, { [f.name]: v })}
          onRecordChange={(r, patch) => write(r, patch)}
          fieldOptions={fieldOptions}
          boardDisabled={!obj.board || embedded}
          titleField={obj.title}
          cardFields={cards}
          bulkActions={(ids) => (
            <XStack gap="$2" flexWrap="wrap" shrink={1} minW={0}>
              {bulkExtra?.(ids, refresh)}
              <Bulk obj={obj} schema={schema} ids={ids} raw={raw.current} onDone={refresh} />
              {embedded ? null : <BulkBar obj={obj} schema={schema} ids={ids} raw={raw.current} extra={bulkExtra?.(ids, refresh)} onDone={refresh} />}
            </XStack>
          )}
          toolbarExtra={
            embedded ? null : (
              <XStack gap="$2" flexWrap="wrap" shrink={1} minW={0}>
                <Everyone obj={obj} schema={schema} query={query} total={data?.total ?? 0} onDone={refresh} />
              </XStack>
            )
          }
        />
      )}
      {creating ? (
        <CreateRecord
          obj={obj}
          schema={schema}
          fieldOptions={fieldOptions}
          defaults={{ ...(tabScope ? obj.defaults : obj.defaults && Object.fromEntries(Object.entries(obj.defaults).filter(([k]) => k !== 'pipeline'))), ...defaults }}
          onClose={() => setCreating(false)}
          onCreated={(id) => {
            setCreating(false)
            forgetOptions(obj.collection)
            if (embedded) refresh()
            else router.push(`/crm/${obj.id}/${id}`)
          }}
        />
      ) : null}
    </YStack>
  )
}

export type { BaseField }
