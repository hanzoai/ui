'use client'

/**
 * DocTypeDetail — view / edit / create / delete ONE framework document, plus the
 * lifecycle actions the engine exposes: PUBLISH (a status field flips Draft ⇆
 * Published) and, for a submittable DocType, SUBMIT / CANCEL (docstatus 0→1→2).
 * All metadata-driven: it loads the schema (→ @hanzo/data `FieldDefinition[]`) and
 * renders through `RecordDetail` (read) + `RecordForm` (edit) — the SAME field
 * routers the list uses — so every field type just works with zero per-doctype
 * code. Create (`name === 'new'`) opens the form over a defaulted blank draft.
 *
 * ONLY OFFERS WHAT THE ENGINE ALLOWS. `ops.go` refuses to edit a non-draft
 * ("document is not a draft (docstatus %d); cannot edit") and refuses to delete a
 * submitted document ("must be cancelled before deletion") — so Edit and Delete
 * are gated on `isDraft`. A user filling in a whole form on a submitted invoice
 * and getting an error card on Save is a bug, not a validation.
 *
 * MOBILE FIRST: the label-above-value form (@hanzo/data's `RecordForm`) already
 * reads top-to-bottom at any width; what did not fit was the header — a back
 * button, a title and up to five actions on one line. On a phone the actions take
 * their own full-width wrapping row at the 44px tap floor.
 *
 * The engine validates the WHOLE document on update, so save/publish always send
 * the full record (via `savePayload`, which slugifies the URL key + strips the
 * redacted Password). States are honest: backend-error, inline save error, and a
 * two-step delete confirmation — never optimistic fakery.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, Text, XStack, YStack } from '@hanzo/gui'
import { ArrowLeft, Ban, Globe, Pencil, PenOff, Save, Send, Trash2, X } from '@hanzogui/lucide-icons-2'
import { RecordDetail, RecordForm, type FieldDefinition, type SelectOption } from '@hanzo/data'

import { BackendStateCard, classifyBackend, type BackendState } from '../product/BackendState'
import type { FrameworkClient } from './client'
import type { DocType, FrameworkDoc } from './types'
import { CANCELLED, SUBMITTED } from './types'
import {
  docTypeToFields,
  enrichLinks,
  hasProjectField,
  isDraft,
  newDraft,
  PROJECT_FIELD,
  savePayload,
  statusField,
  titleOf,
  toRecord,
} from './fields'
import { loadLinkOptions, makeFieldOptions } from './data'
import { Action, Actions, ErrorBar, Loading, Panel } from './parts'
import { useContainerLayout } from './responsive'

export interface DocTypeDetailProps {
  client: FrameworkClient
  doctype: string
  /** Document name, or `'new'` to open the create form. */
  name: string
  /** Active project scope — stamped onto a NEW record when the collection has a `project` field. */
  project?: string
  onBack: () => void
  /** Land on a document (after create). */
  onView: (name: string) => void
}

type LoadState =
  | { phase: 'loading' }
  | { phase: 'error'; error: BackendState }
  | { phase: 'ready'; dt: DocType; record: Record<string, unknown> | null; linkOptions: Record<string, SelectOption[]> }

export function DocTypeDetail({ client, doctype, name, project, onBack, onView }: DocTypeDetailProps) {
  const isNew = name === 'new'
  const [state, setState] = useState<LoadState>({ phase: 'loading' })
  const [editing, setEditing] = useState(isNew)
  const [draft, setDraft] = useState<Record<string, unknown>>({})
  const [busy, setBusy] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const { phone, onLayout } = useContainerLayout()

  const load = useCallback(
    async (signal: { cancelled: boolean }) => {
      setState({ phase: 'loading' })
      try {
        const dt = await client.doctypes.get(doctype)
        const linkOptions = await loadLinkOptions(client, dt)
        const doc = isNew ? null : await client.records.get(doctype, name)
        if (signal.cancelled) return
        const record = doc ? enrichLinks(toRecord(doc, dt), dt, linkOptions) : null
        setState({ phase: 'ready', dt, record, linkOptions })
        // A NEW record inherits the active project scope (when the collection has a
        // `project` field), so content created under a selected project is tagged
        // with it and shows up in that project's filtered list.
        const seed = newDraft(dt)
        if (record == null && project && hasProjectField(dt)) seed[PROJECT_FIELD] = project
        setDraft(record ? { ...record } : seed)
        setEditing(isNew)
        setSaveError(null)
        setConfirmingDelete(false)
      } catch (e) {
        if (!signal.cancelled) setState({ phase: 'error', error: classifyBackend(e) })
      }
    },
    [client, doctype, name, isNew, project],
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
  const dt = ready?.dt
  const record = ready?.record ?? null
  const fields: FieldDefinition[] = useMemo(() => (dt ? docTypeToFields(dt, { editing: !isNew }) : []), [dt, isNew])
  const fieldOptions = useMemo(() => (ready ? makeFieldOptions(ready.linkOptions) : undefined), [ready])
  const title = dt ? (isNew ? `New ${doctype}` : titleOf(record ?? {}, dt)) : doctype

  const onChange = useCallback((field: string, value: unknown) => {
    setDraft((d) => ({ ...d, [field]: value }))
  }, [])

  const reflect = useCallback(
    (saved: FrameworkDoc) => {
      if (!dt || !ready) return
      const next = enrichLinks(toRecord(saved, dt), dt, ready.linkOptions)
      setState({ phase: 'ready', dt, record: next, linkOptions: ready.linkOptions })
      setDraft({ ...next })
    },
    [dt, ready],
  )

  const save = useCallback(async () => {
    if (!dt) return
    setBusy(true)
    setSaveError(null)
    try {
      const body = savePayload(draft, dt)
      if (isNew) {
        const created = await client.records.create(doctype, body)
        if (created.name) onView(String(created.name))
        else onBack()
        return
      }
      if (!record?.name) throw new Error('This record has no name to update.')
      reflect(await client.records.update(doctype, String(record.name), body))
      setEditing(false)
    } catch (e) {
      setSaveError(classifyBackend(e).message)
    } finally {
      setBusy(false)
    }
  }, [client, doctype, draft, dt, isNew, onBack, onView, record, reflect])

  /** Lifecycle op on the current record (publish/unpublish/submit/cancel). */
  const run = useCallback(
    async (op: () => Promise<FrameworkDoc | void>) => {
      setBusy(true)
      setSaveError(null)
      try {
        const saved = await op()
        if (saved) reflect(saved)
      } catch (e) {
        setSaveError(classifyBackend(e).message)
      } finally {
        setBusy(false)
      }
    },
    [reflect],
  )

  const remove = useCallback(async () => {
    if (!record?.name) return
    setBusy(true)
    setSaveError(null)
    try {
      await client.records.remove(doctype, String(record.name))
      onBack()
    } catch (e) {
      setSaveError(classifyBackend(e).message)
      setBusy(false)
      setConfirmingDelete(false)
    }
  }, [client, doctype, onBack, record])

  const backButton = (
    <Action phone={phone} icon={<ArrowLeft size={15} />} onPress={onBack}>
      Back
    </Action>
  )

  if (state.phase === 'loading') {
    return (
      <YStack onLayout={onLayout} width="100%">
        <Loading label={`Loading ${doctype}…`} />
      </YStack>
    )
  }
  if (state.phase === 'error') {
    return (
      <YStack onLayout={onLayout} gap="$3" width="100%">
        <XStack>{backButton}</XStack>
        <BackendStateCard state={state.error} onRetry={reload} hint={`framework · ${doctype}/${name}`} />
      </YStack>
    )
  }
  if (!dt) {
    return (
      <YStack onLayout={onLayout} gap="$3" width="100%">
        <XStack>{backButton}</XStack>
      </YStack>
    )
  }

  // What the engine will actually accept, asked once. A submitted document is
  // immutable until cancelled; a cancelled one is a tombstone.
  const draftDoc = isDraft(record)
  const statusF = statusField(dt)
  const status = record ? String(record[statusF] ?? '') : ''
  const docstatus = record ? Number(record.docstatus ?? 0) : 0
  const canEdit = !editing && !isNew && draftDoc
  const canDelete = !editing && !isNew && draftDoc
  const canPublish = canEdit && Boolean(statusF)
  const canSubmit = !editing && !isNew && Boolean(dt.isSubmittable) && draftDoc
  const canCancel = !editing && !isNew && Boolean(dt.isSubmittable) && docstatus === SUBMITTED

  const lifecycle =
    docstatus === SUBMITTED ? ' · submitted' : docstatus === CANCELLED ? ' · cancelled' : ''

  return (
    <YStack onLayout={onLayout} gap="$3" width="100%">
      {/* Header. On a phone the title owns its row and the actions wrap onto their
          own full-width row below — nothing is pushed off-screen. */}
      <YStack gap="$3" width="100%">
        <XStack items="center" gap="$3" width="100%" flexWrap="wrap">
          {phone ? null : backButton}
          <YStack flex={1} minW={200}>
            <Text fontSize="$6" fontWeight="800" numberOfLines={2}>
              {title}
            </Text>
            <Text fontSize="$2" color="$color10" numberOfLines={1}>
              {doctype}
              {status ? ` · ${status}` : ''}
              {lifecycle}
            </Text>
          </YStack>
        </XStack>

        <Actions phone={phone}>
          {phone ? backButton : null}
          {editing ? (
            <>
              {!isNew ? (
                <Action
                  phone={phone}
                  icon={<X size={15} />}
                  disabled={busy}
                  onPress={() => {
                    setDraft(record ? { ...record } : {})
                    setEditing(false)
                    setSaveError(null)
                  }}
                >
                  Cancel
                </Action>
              ) : null}
              <Action phone={phone} primary icon={<Save size={15} />} disabled={busy} onPress={save}>
                {busy ? 'Saving…' : isNew ? 'Create' : 'Save'}
              </Action>
            </>
          ) : (
            <>
              {canDelete ? (
                <Action phone={phone} danger icon={<Trash2 size={15} />} disabled={busy} onPress={() => setConfirmingDelete(true)}>
                  Delete
                </Action>
              ) : null}
              {canCancel ? (
                <Action
                  phone={phone}
                  icon={<Ban size={15} />}
                  disabled={busy}
                  onPress={() => run(() => client.records.cancel(doctype, String(record!.name)))}
                >
                  Cancel doc
                </Action>
              ) : null}
              {canSubmit ? (
                <Action
                  phone={phone}
                  icon={<Send size={15} />}
                  disabled={busy}
                  onPress={() => run(() => client.records.submit(doctype, String(record!.name)))}
                >
                  Submit
                </Action>
              ) : null}
              {canPublish ? (
                status === 'Published' ? (
                  <Action
                    phone={phone}
                    icon={<PenOff size={15} />}
                    disabled={busy}
                    onPress={() =>
                      run(async () =>
                        client.records.update(doctype, String(record!.name), savePayload({ ...record, [statusF]: 'Draft' }, dt)),
                      )
                    }
                  >
                    Unpublish
                  </Action>
                ) : (
                  <Action
                    phone={phone}
                    primary
                    icon={<Globe size={15} />}
                    disabled={busy}
                    onPress={() =>
                      run(async () =>
                        client.records.update(
                          doctype,
                          String(record!.name),
                          savePayload({ ...record, [statusF]: 'Published' }, dt),
                        ),
                      )
                    }
                  >
                    Publish
                  </Action>
                )
              ) : null}
              {canEdit ? (
                <Action phone={phone} primary icon={<Pencil size={15} />} onPress={() => setEditing(true)}>
                  Edit
                </Action>
              ) : null}
            </>
          )}
        </Actions>
      </YStack>

      {/* Say WHY the actions are gone, rather than silently offering nothing. */}
      {!editing && !isNew && !draftDoc ? (
        <Card borderWidth={1} borderColor="$borderColor" bg="$color2" p="$3" maxW={620}>
          <Text fontSize="$2" color="$color11">
            {docstatus === SUBMITTED
              ? 'This document is submitted. Cancel it to make further changes — the engine refuses edits and deletes on a submitted document.'
              : 'This document is cancelled. It is kept as a record and can no longer be edited or deleted.'}
          </Text>
        </Card>
      ) : null}

      {confirmingDelete ? (
        <Card borderWidth={1} borderColor="$red7" bg="$red2" p="$3" gap="$3" maxW={620}>
          <Text fontSize="$3" fontWeight="700">
            Delete “{title}”? This cannot be undone.
          </Text>
          <Actions phone={phone}>
            <Action phone={phone} danger disabled={busy} onPress={remove}>
              {busy ? 'Deleting…' : 'Confirm delete'}
            </Action>
            <Action phone={phone} disabled={busy} onPress={() => setConfirmingDelete(false)}>
              Keep
            </Action>
          </Actions>
        </Card>
      ) : null}

      {saveError ? <ErrorBar message={saveError} /> : null}

      <Panel phone={phone}>
        {editing ? (
          <RecordForm fields={fields} values={draft} onChange={onChange} fieldOptions={fieldOptions} />
        ) : record ? (
          <RecordDetail title={title} fields={fields} record={record} fieldOptions={fieldOptions} />
        ) : null}
      </Panel>
    </YStack>
  )
}
