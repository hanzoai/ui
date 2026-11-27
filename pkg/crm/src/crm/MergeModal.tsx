'use client'

/**
 * Twenty-style Record Merge / Deduplication Modal.
 *
 * Side-by-side field chooser for merging two duplicate People or Companies:
 * pick which record survives (primary), choose field-by-field values when both
 * records differ, then call `CrmApi.merge` (POST /v1/crm/records/:object/merge
 * with automatic Base update + delete fallback).
 */
import { useMemo, useState } from 'react'
import { Button, Text, XStack, YStack } from '@hanzo/gui'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@hanzo/ui'
import { ArrowLeftRight, GitMerge } from '@hanzogui/lucide-icons-2'

import { CrmApi } from '../lib/crm'
import type { BaseRecord } from '../lib/base-data/api'
import { cellText } from './csv'
import type { CrmObject } from './objects'
import { optionOf, rowOf, words, type Schema } from './schema'
import { useViewport } from './responsive'
import { SKIP_MERGE_FIELDS, defaultMergePicks, resolveMergedFields, type MergePick } from './twenty-logic'

export { defaultMergePicks, resolveMergedFields, type MergePick }

export interface MergeModalProps {
  obj: CrmObject
  schema: Schema
  records: [BaseRecord, BaseRecord]
  onClose: () => void
  onMerged: (primaryId: string) => void
}

export function MergeModal({ obj, schema, records, onClose, onMerged }: MergeModalProps) {
  const { mobile } = useViewport()
  const [swapped, setSwapped] = useState(false)
  const primary = swapped ? records[1] : records[0]
  const duplicate = swapped ? records[0] : records[1]

  const editableFields = useMemo(
    () => schema.fields.filter((f) => !f.readOnly && !SKIP_MERGE_FIELDS.has(f.name)),
    [schema],
  )
  const fieldNames = useMemo(() => editableFields.map((f) => f.name), [editableFields])

  const [picks, setPicks] = useState<Record<string, MergePick>>(() =>
    defaultMergePicks(records[0], records[1], editableFields.map((f) => f.name)),
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const primaryRow = useMemo(() => rowOf(schema, primary), [schema, primary])
  const duplicateRow = useMemo(() => rowOf(schema, duplicate), [schema, duplicate])
  const primaryTitle = optionOf(obj.collection, primary).label
  const duplicateTitle = optionOf(obj.collection, duplicate).label

  const handleSwap = () => {
    const nextPrimary = duplicate
    const nextDup = primary
    setSwapped((s) => !s)
    setPicks(defaultMergePicks(nextPrimary, nextDup, fieldNames))
  }

  const runMerge = async () => {
    setBusy(true)
    setError(null)
    try {
      const resolved = resolveMergedFields(primary, duplicate, picks, fieldNames)
      await CrmApi.merge(obj.collection, String(primary.id), String(duplicate.id), resolved)
      onMerged(String(primary.id))
    } catch (e) {
      setError(words(e, 'Could not merge records.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent maxW={680} width="100%">
        <DialogHeader>
          <XStack items="center" gap="$2">
            <GitMerge size={18} color="$blue10" />
            <DialogTitle>{`Merge duplicate ${obj.plural.toLowerCase()}`}</DialogTitle>
          </XStack>
          <DialogDescription>
            Choose which field values to keep. The primary record survives and the duplicate is removed.
          </DialogDescription>
        </DialogHeader>

        <DialogBody gap="$3" maxH="62vh" overflow="scroll">
          <XStack items="center" justify="space-between" gap="$2" flexWrap="wrap" p="$2.5" bg="$color2" rounded="$3" borderWidth={1} borderColor="$borderColor">
            <YStack flex={1} minW={160}>
              <Text fontSize="$1" fontWeight="700" color="$blue10">
                PRIMARY (KEPT)
              </Text>
              <Text fontSize="$3" fontWeight="700" color="$color12" numberOfLines={1}>
                {primaryTitle}
              </Text>
            </YStack>
            <Button size="$2" bg="$background" borderWidth={1} borderColor="$borderColor" onPress={handleSwap} disabled={busy}>
              <XStack items="center" gap="$1">
                <ArrowLeftRight size={13} color="$color11" />
                <Text fontSize="$2" color="$color12">
                  Swap
                </Text>
              </XStack>
            </Button>
            <YStack flex={1} minW={160} items={mobile ? 'flex-start' : 'flex-end'}>
              <Text fontSize="$1" fontWeight="700" color="$red10">
                DUPLICATE (DELETED)
              </Text>
              <Text fontSize="$3" fontWeight="600" color="$color11" numberOfLines={1}>
                {duplicateTitle}
              </Text>
            </YStack>
          </XStack>

          <YStack gap="$2">
            {editableFields.map((f) => {
              const aText = cellText(f, primaryRow[f.name])
              const bText = cellText(f, duplicateRow[f.name])
              if (!aText && !bText) return null
              const pick = picks[f.name] ?? 'primary'
              return (
                <YStack key={f.name} gap="$1.5" p="$2" rounded="$2" borderWidth={1} borderColor="$borderColor" data-slot="crm-merge-field" data-field={f.name}>
                  <Text fontSize="$1" fontWeight="700" color="$color10">
                    {f.label}
                  </Text>
                  <XStack gap="$2" flexDirection={mobile ? 'column' : 'row'}>
                    <Button
                      flex={1}
                      size="$2"
                      justify="flex-start"
                      bg={pick === 'primary' ? '$color4' : '$color2'}
                      borderWidth={1}
                      borderColor={pick === 'primary' ? '$blue10' : '$borderColor'}
                      onPress={() => setPicks((p) => ({ ...p, [f.name]: 'primary' }))}
                    >
                      <Text fontSize="$2" color={aText ? '$color12' : '$color9'} numberOfLines={2}>
                        {aText || '— empty —'}
                      </Text>
                    </Button>
                    <Button
                      flex={1}
                      size="$2"
                      justify="flex-start"
                      bg={pick === 'duplicate' ? '$color4' : '$color2'}
                      borderWidth={1}
                      borderColor={pick === 'duplicate' ? '$blue10' : '$borderColor'}
                      onPress={() => setPicks((p) => ({ ...p, [f.name]: 'duplicate' }))}
                    >
                      <Text fontSize="$2" color={bText ? '$color12' : '$color9'} numberOfLines={2}>
                        {bText || '— empty —'}
                      </Text>
                    </Button>
                  </XStack>
                </YStack>
              )
            })}
          </YStack>

          {error ? (
            <Text fontSize="$2" color="$red10" role="alert">
              {error}
            </Text>
          ) : null}
        </DialogBody>

        <DialogFooter>
          <Button size="$3" chromeless disabled={busy} onPress={onClose}>
            Cancel
          </Button>
          <Button size="$3" theme="blue" disabled={busy} onPress={() => void runMerge()} data-slot="crm-merge-confirm">
            {busy ? 'Merging…' : `Merge into ${primaryTitle}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
