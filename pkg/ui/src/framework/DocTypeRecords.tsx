'use client'

/**
 * DocTypeRecords — the documents surface for ONE framework DocType, driven
 * ENTIRELY by DocType metadata. It loads the schema (→ @hanzo/data
 * `FieldDefinition[]` via `docTypeToFields`), the documents, and each relation's
 * candidate records, then renders them in the shape the CONTAINER can actually
 * hold. Every field type shows the right Display/Input with ZERO per-doctype code,
 * so a CMS Page, an ERP Invoice, or a Helpdesk Ticket all render here.
 *
 * MOBILE FIRST — the layout is a decision, not a media query afterthought:
 *   · phone   → `RecordCards`, a stacked card per record. A table of 12 columns on
 *               a 390px screen is a sideways drag; a card is a read.
 *   · desktop → @hanzo/data's `RecordsView` (table ⇆ board, filter/sort/group,
 *               inline cell editing).
 * The first paint is ALWAYS the card list (see `responsive.ts`), and the table is
 * the enhancement applied once the box measures wide enough.
 *
 * The table also finally honors the DocType's OWN column projection
 * (`listHiddenFields` → `inListView`): a Sales Order that declares 4 list columns
 * out of 12 fields now renders 4. That projection was implemented and tested but
 * never passed to a view — which is exactly why the grid was unusable narrow.
 *
 * Persistence is REAL: an inline cell edit sends the FULL record (the engine
 * validates the whole document on update) via `savePayload`, and reflects the
 * server's row. States are honest — loading / empty / backend-error, never a
 * fabricated row.
 */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Button, YStack } from '@hanzo/gui'
import { RefreshCw } from '@hanzogui/lucide-icons-2'
import { RecordsView, type FieldDefinition, type SelectOption, type ViewConfig } from '@hanzo/data'

import { BackendStateCard, classifyBackend, type BackendState } from '../product/BackendState'
import type { FrameworkClient } from './client'
import type { DocType, FrameworkDoc } from './types'
import {
  cardFields as pickCardFields,
  docTypeToFields,
  enrichLinks,
  hasProjectField,
  isMediaDoctype,
  listHiddenFields,
  PROJECT_FIELD,
  savePayload,
  toRecord,
} from './fields'
import { loadLinkOptions, makeFieldOptions } from './data'
import { MediaGrid } from './MediaGrid'
import { RecordCards } from './RecordCards'
import { Action, ErrorBar } from './parts'
import { useContainerLayout, TAP } from './responsive'
import type { MediaUploader } from './media'

type LoadState =
  | { phase: 'loading' }
  | { phase: 'error'; error: BackendState }
  | {
      phase: 'ready'
      dt: DocType
      fields: FieldDefinition[]
      docs: FrameworkDoc[]
      records: Record<string, unknown>[]
      linkOptions: Record<string, SelectOption[]>
    }

export interface DocTypeRecordsProps {
  client: FrameworkClient
  /** DocType name to render. */
  doctype: string
  /** Open a document's detail (by document name). */
  onOpen: (name: string) => void
  /** Start creating a document. */
  onCreate: () => void
  /** Active project scope — filters the list when the collection has a `project` field. */
  project?: string
  title?: ReactNode
  /**
   * Object storage for a media/asset collection. Without it a media DocType still
   * renders as records (honest) — the DAM gallery needs a real place to put bytes,
   * and this layer refuses to invent one.
   */
  media?: MediaUploader
  /**
   * A host that would rather draw the asset gallery itself supplies this; it wins
   * over the built-in `MediaGrid`. Both paths need somewhere real to put bytes, so
   * a host with neither gets the honest generic table — nothing is faked.
   */
  renderMedia?: (p: {
    dt: DocType
    docs: FrameworkDoc[]
    onOpen: (name: string) => void
    onChanged: () => void
    toolbarExtra: ReactNode
  }) => ReactNode
  /** How many documents to fetch (the engine caps its own page). */
  limit?: number
}

export function DocTypeRecords({
  client,
  doctype,
  onOpen,
  onCreate,
  project,
  title,
  media,
  renderMedia,
  limit = 200,
}: DocTypeRecordsProps) {
  const [state, setState] = useState<LoadState>({ phase: 'loading' })
  const [mutationError, setMutationError] = useState<string | null>(null)
  const { phone, onLayout } = useContainerLayout()

  const load = useCallback(
    async (signal: { cancelled: boolean }) => {
      setState({ phase: 'loading' })
      try {
        const dt = await client.doctypes.get(doctype)
        const linkOptions = await loadLinkOptions(client, dt)
        // Scope the list to the selected project ONLY when the collection declares
        // a `project` field (the engine 400s a filter on an unknown field). No
        // project selected, or a collection without the field → org-level list.
        const filters = project && hasProjectField(dt) ? { [PROJECT_FIELD]: project } : undefined
        const docs = await client.records.list(doctype, { limit, ...(filters ? { filters } : {}) })
        if (signal.cancelled) return
        const records = docs.map((d) => enrichLinks(toRecord(d, dt), dt, linkOptions))
        setState({ phase: 'ready', dt, fields: docTypeToFields(dt), docs, records, linkOptions })
      } catch (e) {
        if (!signal.cancelled) setState({ phase: 'error', error: classifyBackend(e) })
      }
    },
    [client, doctype, project, limit],
  )

  useEffect(() => {
    const signal = { cancelled: false }
    void load(signal)
    return () => {
      signal.cancelled = true
    }
  }, [load])

  const reload = useCallback(() => void load({ cancelled: false }), [load])

  const ready = state.phase === 'ready' ? state : undefined

  const fieldOptions = useMemo(
    () => (ready ? makeFieldOptions(ready.linkOptions) : undefined),
    [ready],
  )

  /**
   * The table view starts from the DocType's own column projection. Controlled,
   * because a host that later persists saved views hands one in — but the DEFAULT
   * is the schema's answer, not "every field".
   */
  const [view, setView] = useState<ViewConfig | undefined>(undefined)
  const dtName = ready?.dt.name
  useEffect(() => {
    if (!ready) return
    setView({
      id: `doctype:${ready.dt.name}`,
      name: ready.dt.name,
      kind: 'table',
      filters: [],
      sorts: [],
      hiddenFields: listHiddenFields(ready.dt),
    })
    // Re-seed only when the DocType changes; user edits to the view persist.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dtName])

  const cards = useMemo(
    () => (ready ? pickCardFields(ready.dt, ready.fields) : []),
    [ready],
  )

  /** Persist ONE inline edit. The engine validates the whole document on update,
   *  so send the full record with the cell change merged in (never a partial body). */
  const onEditCommit = useCallback(
    async (record: Record<string, unknown>, field: FieldDefinition, value: unknown) => {
      if (state.phase !== 'ready') return
      const name = typeof record.name === 'string' ? record.name : ''
      if (!name) return
      setMutationError(null)
      try {
        const body = savePayload({ ...record, [field.name]: value }, state.dt)
        const saved = await client.records.update(doctype, name, body)
        const next = enrichLinks(toRecord(saved, state.dt), state.dt, state.linkOptions)
        setState((s) => (s.phase === 'ready' ? { ...s, records: s.records.map((r) => (r.name === name ? next : r)) } : s))
      } catch (e) {
        setMutationError(classifyBackend(e).message)
        throw e // let the board revert its optimistic move
      }
    },
    [client, doctype, state],
  )

  if (state.phase === 'error') {
    return (
      <YStack onLayout={onLayout} width="100%">
        <BackendStateCard state={state.error} onRetry={reload} hint={`framework · GET /v1/framework/${doctype}`} />
      </YStack>
    )
  }

  const refresh = phone ? (
    <Action phone icon={<RefreshCw size={15} />} onPress={reload}>
      Refresh
    </Action>
  ) : (
    <Button size="$2" minH={TAP - 12} icon={<RefreshCw size={15} />} onPress={reload}>
      Refresh
    </Button>
  )

  // A media/asset library (a required Attach) gets the DAM gallery instead of the
  // record views — real upload to the host's object storage + presigned thumbnails.
  if (ready && (media || renderMedia) && isMediaDoctype(ready.dt)) {
    return (
      <YStack onLayout={onLayout} width="100%">
        {renderMedia ? (
          renderMedia({ dt: ready.dt, docs: ready.docs, onOpen, onChanged: reload, toolbarExtra: refresh })
        ) : (
          <MediaGrid
            client={client}
            dt={ready.dt}
            docs={ready.docs}
            media={media!}
            onOpen={onOpen}
            onChanged={reload}
            toolbarExtra={refresh}
          />
        )}
      </YStack>
    )
  }

  const openByKey = (r: Record<string, unknown>) =>
    onOpen(String((r as { name?: unknown }).name ?? (r as { id?: unknown }).id ?? ''))

  return (
    <YStack onLayout={onLayout} gap="$3" width="100%">
      {mutationError ? <ErrorBar message={mutationError} /> : null}

      {phone ? (
        <RecordCards
          titleField={ready?.dt.titleField}
          fields={ready?.fields ?? []}
          cardFields={cards}
          records={ready?.records ?? []}
          loading={state.phase === 'loading'}
          empty={`No records in ${doctype} yet.`}
          onOpen={openByKey}
          onCreate={onCreate}
          toolbarExtra={refresh}
        />
      ) : (
        <YStack testID="doctype-table" width="100%">
          <RecordsView
            title={title}
            fields={ready?.fields ?? []}
            records={ready?.records ?? []}
            loading={state.phase === 'loading'}
            view={view}
            onViewChange={setView}
            onOpen={openByKey}
            onCreate={onCreate}
            createLabel="New record"
            onEditCommit={onEditCommit}
            fieldOptions={fieldOptions}
            toolbarExtra={refresh}
            titleField={ready?.dt.titleField}
            empty={`No records in ${doctype} yet.`}
          />
        </YStack>
      )}
    </YStack>
  )
}
