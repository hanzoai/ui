'use client'

/**
 * Twenty-style Floating Bottom Bulk Action Bar.
 *
 * Appears anchored at the bottom center whenever 1+ records are selected:
 * - Bulk Edit (Stage / Status / Type / Owner)
 * - Add to List (People)
 * - Merge (when 2 records are selected on People or Companies)
 * - Export CSV
 * - Bulk Delete
 *
 * Responsive on 390px mobile: constrained to `calc(100vw - 24px)` with zero page overflow.
 */
import { useState, type ReactNode } from 'react'
import { Button, Input, Text, XStack, YStack } from '@hanzo/gui'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@hanzo/ui'
import type { FieldDefinition, SelectOption } from '@hanzo/data'
import { Download, GitMerge, List, SlidersHorizontal, Trash2, X } from '@hanzogui/lucide-icons-2'

import { CrmApi } from '../lib/crm'
import type { BaseRecord } from '../lib/base-data/api'
import { ApiError } from '../lib/host'
import { MergeModal } from './MergeModal'
import type { CrmObject } from './objects'
import { Picker } from './Actions'
import { pool, save, words, type Schema } from './schema'
import { buildBulkCsv } from './twenty-logic'

export { buildBulkCsv }

const BULK_EDIT_PRIORITY = new Set(['stage', 'status', 'type', 'owner', 'assignee', 'lifecycle', 'outreach'])

export interface BulkBarProps {
  obj: CrmObject
  schema: Schema
  ids: string[]
  raw: Map<string, BaseRecord>
  extra?: ReactNode
  onClear?: () => void
  onDone: () => void
}

export function BulkBar({ obj, schema, ids, raw, extra, onClear, onDone }: BulkBarProps) {
  const [modal, setModal] = useState<'edit' | 'list' | 'merge' | 'delete' | null>(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const editableFields = schema.fields
    .filter((f) => !f.readOnly && (f.type === 'select' || f.name === 'owner' || f.name === 'assignee'))
    .sort((a, b) => Number(BULK_EDIT_PRIORITY.has(b.name)) - Number(BULK_EDIT_PRIORITY.has(a.name)))

  const [editField, setEditField] = useState(editableFields[0]?.name ?? '')
  const [editValue, setEditValue] = useState('')
  const [listName, setListName] = useState('')

  if (ids.length === 0) return null

  const selectedRecords = ids.map((id) => raw.get(id) ?? ({ id } as BaseRecord))
  const canMerge = ids.length === 2 && (obj.collection === 'people' || obj.collection === 'companies')
  const activeFieldDef = editableFields.find((f) => f.name === editField) as FieldDefinition | undefined
  const activeOptions = ((activeFieldDef?.metadata as { options?: SelectOption[] } | undefined)?.options ?? [])

  const exportCsv = () => {
    const csv = buildBulkCsv(schema, selectedRecords)
    save(`${obj.id}-${new Date().toISOString().slice(0, 10)}.csv`, csv)
  }

  const runEdit = async () => {
    if (!editField || !editValue.trim()) return setResult('Choose a field and value.')
    setBusy(true)
    setResult(null)
    try {
      const r = await pool(selectedRecords, 6, (rec) =>
        CrmApi.update(obj.collection, String(rec.id), { [editField]: editValue.trim() }).then(() => undefined),
      )
      setResult(`Updated ${selectedRecords.length - r.failed} record(s)${r.failed ? ` · ${r.failed} failed` : ''}.`)
      onDone()
    } catch (e) {
      setResult(words(e, 'Bulk edit failed.'))
    } finally {
      setBusy(false)
    }
  }

  const runAddToList = async () => {
    const name = listName.trim()
    if (!name) return setResult('Enter a list name.')
    setBusy(true)
    setResult(null)
    try {
      const existing = await CrmApi.list('lists', { filter: `name = "${name.replace(/"/g, '')}"`, perPage: 1, skipTotal: true })
      const listId = existing.items[0]
        ? String(existing.items[0].id)
        : String((await CrmApi.create('lists', { name, object: 'people', purpose: 'outreach' })).id)
      let added = 0
      const r = await pool(selectedRecords, 6, async (rec) => {
        try {
          await CrmApi.create('list_members', { list: listId, person: rec.id, source: 'manual' })
          added += 1
        } catch (e) {
          if (!(e instanceof ApiError && e.status === 400)) throw e
        }
      })
      setResult(`Added ${added} to "${name}"${r.failed ? ` · ${r.failed} failed` : ''}.`)
      onDone()
    } catch (e) {
      setResult(words(e, 'Could not add to list.'))
    } finally {
      setBusy(false)
    }
  }

  const runDelete = async () => {
    setBusy(true)
    setResult(null)
    try {
      const r = await pool(selectedRecords, 6, (rec) => CrmApi.remove(obj.collection, String(rec.id)))
      setResult(`Deleted ${selectedRecords.length - r.failed} record(s)${r.failed ? ` · ${r.failed} failed` : ''}.`)
      onClear?.()
      onDone()
    } catch (e) {
      setResult(words(e, 'Bulk delete failed.'))
    } finally {
      setBusy(false)
    }
  }

  const close = () => {
    setModal(null)
    setResult(null)
  }

  return (
    <>
      <XStack
        position="fixed"
        b={20}
        l="50%"
        z={800}
        items="center"
        gap="$1.5"
        px="$3"
        py="$2"
        bg="$background"
        borderWidth={1}
        borderColor="$color8"
        rounded="$5"
        flexWrap="wrap"
        maxW="calc(100vw - 24px)"
        style={{ transform: 'translateX(-50%)', boxShadow: '0 10px 30px rgba(0,0,0,0.28)' }}
        data-slot="crm-bulk-bar"
      >
        <XStack items="center" gap="$1.5" pr="$1.5" borderRightWidth={1} borderColor="$borderColor">
          <Text fontSize="$2" fontWeight="700" color="$color12" data-slot="crm-bulk-count">
            {`${ids.length} selected`}
          </Text>
          {onClear ? (
            <Button size="$1" chromeless px="$1" onPress={onClear} aria-label="Clear selection">
              <X size={13} color="$color10" />
            </Button>
          ) : null}
        </XStack>

        {editableFields.length > 0 ? (
          <Button size="$2" bg="$color2" borderWidth={1} borderColor="$borderColor" onPress={() => (setResult(null), setModal('edit'))}>
            <XStack items="center" gap="$1">
              <SlidersHorizontal size={13} color="$color11" />
              <Text fontSize="$2" color="$color12">
                Bulk edit
              </Text>
            </XStack>
          </Button>
        ) : null}

        {obj.collection === 'people' ? (
          <Button size="$2" bg="$color2" borderWidth={1} borderColor="$borderColor" onPress={() => (setResult(null), setModal('list'))}>
            <XStack items="center" gap="$1">
              <List size={13} color="$color11" />
              <Text fontSize="$2" color="$color12">
                Add to list
              </Text>
            </XStack>
          </Button>
        ) : null}

        {canMerge ? (
          <Button size="$2" theme="blue" onPress={() => setModal('merge')} data-slot="crm-bulk-merge">
            <XStack items="center" gap="$1">
              <GitMerge size={13} color="$color12" />
              <Text fontSize="$2" color="$color12">
                Merge
              </Text>
            </XStack>
          </Button>
        ) : null}

        <Button size="$2" bg="$color2" borderWidth={1} borderColor="$borderColor" onPress={exportCsv} data-slot="crm-bulk-export">
          <XStack items="center" gap="$1">
            <Download size={13} color="$color11" />
            <Text fontSize="$2" color="$color12">
              Export CSV
            </Text>
          </XStack>
        </Button>

        {extra}

        <Button size="$2" theme="red" onPress={() => (setResult(null), setModal('delete'))} data-slot="crm-bulk-delete">
          <XStack items="center" gap="$1">
            <Trash2 size={13} color="$color12" />
            <Text fontSize="$2" color="$color12">
              Delete
            </Text>
          </XStack>
        </Button>
      </XStack>

      {modal === 'merge' && canMerge ? (
        <MergeModal
          obj={obj}
          schema={schema}
          records={[selectedRecords[0], selectedRecords[1]]}
          onClose={close}
          onMerged={() => {
            close()
            onClear?.()
            onDone()
          }}
        />
      ) : null}

      {modal === 'edit' || modal === 'list' || modal === 'delete' ? (
        <Dialog open onOpenChange={(o) => !o && !busy && close()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {modal === 'edit' ? 'Bulk edit records' : modal === 'list' ? 'Add to list' : 'Delete selected records'}
              </DialogTitle>
              <DialogDescription>{`${ids.length} ${obj.plural.toLowerCase()} selected`}</DialogDescription>
            </DialogHeader>
            <DialogBody gap="$3">
              {modal === 'edit' ? (
                <YStack gap="$2">
                  <Picker
                    label="Field"
                    value={editField}
                    onChange={(v) => {
                      setEditField(v)
                      setEditValue('')
                    }}
                    options={editableFields.map((f) => ({ value: f.name, label: f.label }))}
                  />
                  {activeFieldDef?.type === 'select' ? (
                    <Picker
                      label="Value"
                      value={editValue}
                      onChange={setEditValue}
                      options={[{ value: '', label: 'Choose a value' }, ...activeOptions]}
                    />
                  ) : (
                    <Input size="$3" value={editValue} onChangeText={setEditValue} placeholder={`New ${activeFieldDef?.label ?? 'value'}`} />
                  )}
                </YStack>
              ) : modal === 'list' ? (
                <Input size="$3" value={listName} onChangeText={setListName} placeholder="List name (existing or new)" />
              ) : (
                <Text fontSize="$3" color="$color11">
                  This permanently removes the selected records for everyone in the org.
                </Text>
              )}
              {result ? (
                <Text fontSize="$2" color="$color12" data-slot="crm-bulk-result">
                  {result}
                </Text>
              ) : null}
            </DialogBody>
            <DialogFooter>
              <Button size="$3" chromeless disabled={busy} onPress={close}>
                {result ? 'Close' : 'Cancel'}
              </Button>
              {result ? null : (
                <Button
                  size="$3"
                  theme={modal === 'delete' ? 'red' : 'blue'}
                  disabled={busy}
                  onPress={() => void (modal === 'edit' ? runEdit() : modal === 'list' ? runAddToList() : runDelete())}
                >
                  {busy ? 'Working…' : modal === 'edit' ? 'Apply' : modal === 'list' ? 'Add' : 'Delete'}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  )
}
