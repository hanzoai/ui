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
 * The engine validates the WHOLE document on update, so save/publish always send
 * the full record (via `savePayload`, which slugifies the URL key + strips the
 * redacted Password). States are honest: backend-error, inline save error, and a
 * two-step delete confirmation — never optimistic fakery.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card, Text, XStack, YStack } from '@hanzo/gui'
import { ArrowLeft, Ban, Globe, Pencil, PenOff, Save, Send, Trash2, TriangleAlert, X } from '@hanzogui/lucide-icons-2'
import { RecordDetail, RecordForm, type FieldDefinition, type SelectOption } from '@hanzo/data'

import { BackendStateCard, classifyBackend, type BackendState } from '../product'
import { PrimaryButton } from '../product'
import type { FrameworkClient } from './client'
import type { DocType, FrameworkDoc } from './types'
import { docTypeToFields, toRecord, enrichLinks, savePayload, newDraft, statusField, titleOf, hasProjectField, PROJECT_FIELD } from './fields'
import { loadLinkOptions, makeFieldOptions } from './data'

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
    return () => { signal.cancelled = true }
  }, [load])

  const reload = useCallback(() => void load({ cancelled: false }), [load])

  const ready = state.phase === 'ready' ? state : undefined
  const dt = ready?.dt
  const record = ready?.record ?? null
  const fields: FieldDefinition[] = useMemo(
    () => (dt ? docTypeToFields(dt, { editing: !isNew }) : []),
    [dt, isNew],
  )
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

  /** Lifecycle op on the current record (publish/unpublish/submit/cancel/delete). */
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
    <Button size="$2" icon={<ArrowLeft size={15} />} onPress={onBack}>Back</Button>
  )

  if (state.phase === 'error') {
    return (
      <YStack gap="$3">
        {backButton}
        <BackendStateCard state={state.error} onRetry={reload} hint={`framework · ${doctype}/${name}`} />
      </YStack>
    )
  }
  if (!dt) return <YStack gap="$3">{backButton}</YStack>

  // Publish (status field) + submit/cancel (submittable) are only offered in read
  // mode on a persisted, draft-status document.
  const statusF = statusField(dt)
  const status = record ? String(record[statusF] ?? '') : ''
  const docstatus = record ? Number(record.docstatus ?? 0) : 0
  const canPublish = !editing && !isNew && statusF && docstatus === 0
  const canSubmit = !editing && !isNew && dt.isSubmittable && docstatus === 0
  const canCancel = !editing && !isNew && dt.isSubmittable && docstatus === 1

  return (
    <YStack gap="$3">
      <XStack items="center" justify="space-between" gap="$4" flexWrap="wrap">
        <XStack items="center" gap="$3" flex={1}>
          {backButton}
          <YStack flex={1}>
            <Text fontSize="$6" fontWeight="800" numberOfLines={1}>{title}</Text>
            <Text fontSize="$2" color="$color10">
              {doctype}{status ? ` · ${status}` : ''}{docstatus === 1 ? ' · submitted' : docstatus === 2 ? ' · cancelled' : ''}
            </Text>
          </YStack>
        </XStack>
        <XStack items="center" gap="$2" flexWrap="wrap">
          {editing ? (
            <>
              {!isNew ? (
                <Button size="$2" icon={<X size={15} />} disabled={busy} onPress={() => { setDraft(record ? { ...record } : {}); setEditing(false); setSaveError(null) }}>Cancel</Button>
              ) : null}
              <PrimaryButton size="$2" icon={<Save size={15} />} disabled={busy} onPress={save}>
                {busy ? 'Saving…' : isNew ? 'Create' : 'Save'}
              </PrimaryButton>
            </>
          ) : (
            <>
              <Button size="$2" theme="red" icon={<Trash2 size={15} />} disabled={busy} onPress={() => setConfirmingDelete(true)}>Delete</Button>
              {canCancel ? (
                <Button size="$2" icon={<Ban size={15} />} disabled={busy} onPress={() => run(() => client.records.cancel(doctype, String(record!.name)))}>Cancel doc</Button>
              ) : null}
              {canSubmit ? (
                <Button size="$2" icon={<Send size={15} />} disabled={busy} onPress={() => run(() => client.records.submit(doctype, String(record!.name)))}>Submit</Button>
              ) : null}
              {canPublish ? (
                status === 'Published' ? (
                  <Button size="$2" icon={<PenOff size={15} />} disabled={busy} onPress={() => run(async () => client.records.update(doctype, String(record!.name), savePayload({ ...record, [statusF]: 'Draft' }, dt)))}>Unpublish</Button>
                ) : (
                  <PrimaryButton size="$2" icon={<Globe size={15} />} disabled={busy} onPress={() => run(async () => client.records.update(doctype, String(record!.name), savePayload({ ...record, [statusF]: 'Published' }, dt)))}>Publish</PrimaryButton>
                )
              ) : null}
              <PrimaryButton size="$2" icon={<Pencil size={15} />} onPress={() => setEditing(true)}>Edit</PrimaryButton>
            </>
          )}
        </XStack>
      </XStack>

      {confirmingDelete ? (
        <Card borderWidth={1} borderColor="$red7" bg="$red2" p="$3" gap="$2" maxWidth={620}>
          <Text fontSize="$3" fontWeight="700">Delete “{title}”? This cannot be undone.</Text>
          <XStack gap="$2">
            <Button size="$2" theme="red" disabled={busy} onPress={remove}>{busy ? 'Deleting…' : 'Confirm delete'}</Button>
            <Button size="$2" disabled={busy} onPress={() => setConfirmingDelete(false)}>Cancel</Button>
          </XStack>
        </Card>
      ) : null}

      {saveError ? (
        <Card borderWidth={1} borderColor="$red7" bg="$red2" p="$3" maxWidth={620}>
          <XStack gap="$2" items="center"><TriangleAlert size={15} /><Text fontSize="$3" color="$red11">{saveError}</Text></XStack>
        </Card>
      ) : null}

      <Card borderWidth={1} borderColor="$borderColor" p="$4" maxWidth={760}>
        {editing ? (
          <RecordForm fields={fields} values={draft} onChange={onChange} fieldOptions={fieldOptions} />
        ) : record ? (
          <RecordDetail title={title} fields={fields} record={record} fieldOptions={fieldOptions} />
        ) : null}
      </Card>
    </YStack>
  )
}

