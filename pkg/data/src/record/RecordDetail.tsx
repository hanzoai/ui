'use client'

// RecordDetail (view, optionally inline-editable) + RecordForm (create/edit form)
// — the single-record views, Twenty-grade.
//
// RecordDetail: a titled panel of label → value fields. When `editable`, clicking
// a value edits it in place through the field's own editor (dropdown selects on
// change, text on Enter/blur), persisting via onEditCommit — the same inline model
// as the table. A `related` slot hosts linked-record lists. Read-only without the
// edit props (backward compatible).
// RecordForm: a label → editor list for create/edit, emitting per-field changes;
// the host owns the draft + save.
//
// Drawn with @hanzo/ui's theme rungs: a field's name in the tertiary ink above
// its value, hairlines between fields, the hover rung on an editable value —
// the record page's field list as twenty-ui composes it (MIT, see NOTICE).
import { useState, type ReactNode } from 'react'
import { Text, XStack, YStack } from '@hanzo/gui'
import type { FieldDefinition, SelectOption } from '../field/types'
import { FieldDisplay } from '../field/FieldDisplay'
import { FieldInput, isEditable } from '../field/FieldInput'

const INSTANT = new Set(['boolean', 'select', 'multiSelect', 'date', 'dateTime', 'relation', 'rating', 'files'])

const FieldLabel = ({ children }: { children: ReactNode }) => (
  <Text fontSize="$1" fontWeight="500" color="$hint" numberOfLines={1}>
    {children}
  </Text>
)

export interface RecordDetailProps {
  fields: FieldDefinition[]
  record: Record<string, unknown>
  /** Big title above the fields (e.g. the record's name). */
  title?: string
  /** Enable click-to-edit on each value. */
  editable?: boolean
  /** Persist one field edit (async allowed). */
  onEditCommit?: (field: FieldDefinition, value: unknown) => void | Promise<void>
  /** Inject candidate options for a field's editor (e.g. relation records). */
  fieldOptions?: (field: FieldDefinition) => SelectOption[] | undefined
  /** Linked-records / activity slot, rendered below the fields. */
  related?: ReactNode
}

/** One label → value row; click-to-edit when editable + the type has an input. */
function DetailField({ field, value, editable, onCommit, options }: {
  field: FieldDefinition
  value: unknown
  editable?: boolean
  onCommit?: (value: unknown) => void | Promise<void>
  options?: SelectOption[]
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<unknown>(value)
  const canEdit = editable && !field.readOnly && isEditable(field.type) && Boolean(onCommit)
  const withOpts: FieldDefinition = options ? { ...field, metadata: { ...(field.metadata as object), options } as FieldDefinition['metadata'] } : field

  const commit = (v: unknown) => { setEditing(false); void onCommit?.(v) }

  return (
    <YStack gap="$1" py="$2" borderBottomWidth={1} borderColor="$borderColor">
      <FieldLabel>{field.label}</FieldLabel>
      {editing ? (
        <FieldInput
          field={withOpts}
          value={draft}
          autoFocus
          onChange={(v) => (INSTANT.has(field.type) ? commit(v) : setDraft(v))}
          onSubmit={() => commit(draft)}
          onCancel={() => { setDraft(value); setEditing(false) }}
        />
      ) : (
        <XStack
          items="center"
          minH={24}
          minW={0}
          cursor={canEdit ? 'text' : undefined}
          rounded="$xs"
          px={canEdit ? '$1' : 0}
          mx={canEdit ? -4 : 0}
          hoverStyle={canEdit ? { bg: '$hover' } : undefined}
          {...(canEdit ? { role: 'button', tabIndex: 0, 'aria-label': `Edit ${field.label}` } : null)}
          onKeyDown={canEdit ? (e: { key?: string; preventDefault?: () => void }) => {
            if (e.key !== 'Enter') return
            e.preventDefault?.()
            setDraft(value)
            setEditing(true)
          } : undefined}
          onPress={canEdit ? () => { setDraft(value); setEditing(true) } : undefined}
        >
          <FieldDisplay field={field} value={value} />
        </XStack>
      )}
    </YStack>
  )
}

/** The record detail panel — titled, per-field, optionally inline-editable. */
export function RecordDetail({ fields, record, title, editable, onEditCommit, fieldOptions, related }: RecordDetailProps) {
  return (
    <YStack gap={2}>
      {title ? (
        <YStack pb="$3" mb="$1" borderBottomWidth={1} borderColor="$borderColor">
          <Text fontSize="$7" fontWeight="600" numberOfLines={2} color="$ink">{title}</Text>
        </YStack>
      ) : null}
      {fields.map((f) => (
        <DetailField
          key={f.name}
          field={f}
          value={record[f.name]}
          editable={editable}
          onCommit={onEditCommit ? (v) => onEditCommit(f, v) : undefined}
          options={fieldOptions?.(f)}
        />
      ))}
      {related ? <YStack pt="$4" gap="$2">{related}</YStack> : null}
    </YStack>
  )
}

export interface RecordFormProps {
  fields: FieldDefinition[]
  /** Current draft values. */
  values: Record<string, unknown>
  /** Emit a single field's next value; the host owns the draft + save. */
  onChange: (name: string, value: unknown) => void
  /** Inject candidate options for a field's editor (e.g. relation records). */
  fieldOptions?: (field: FieldDefinition) => SelectOption[] | undefined
}

/** Editable field list — create/edit form. Read-only fields render as display. */
export function RecordForm({ fields, values, onChange, fieldOptions }: RecordFormProps) {
  return (
    <YStack gap="$3">
      {fields.map((f) => {
        const opts = fieldOptions?.(f)
        const withOpts: FieldDefinition = opts ? { ...f, metadata: { ...(f.metadata as object), options: opts } as FieldDefinition['metadata'] } : f
        return (
          <YStack key={f.name} gap="$1">
            <FieldLabel>{f.label}</FieldLabel>
            {f.readOnly ? (
              <XStack><FieldDisplay field={f} value={values[f.name]} /></XStack>
            ) : (
              <FieldInput field={withOpts} value={values[f.name]} onChange={(v) => onChange(f.name, v)} />
            )}
          </YStack>
        )
      })}
    </YStack>
  )
}
