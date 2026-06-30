// RecordDetail (read) + RecordForm (edit) — the single-record views.
//
// RecordDetail: a label → value field list (the detail panel).
// RecordForm: a label → editor field list (create/edit), emitting changes per
// field. Both render through the same FieldDisplay/FieldInput routers, so every
// field type works and a new type needs no changes here.
import { Text, XStack, YStack } from '@hanzo/gui'
import type { FieldDefinition } from '../field/types'
import { FieldDisplay } from '../field/FieldDisplay'
import { FieldInput } from '../field/FieldInput'
import { tokens } from '../theme'

export interface RecordDetailProps {
  fields: FieldDefinition[]
  record: Record<string, unknown>
}

/** Read-only field list — the record detail panel. */
export function RecordDetail({ fields, record }: RecordDetailProps) {
  return (
    <YStack gap={14}>
      {fields.map((f) => (
        <YStack key={f.name} gap={4}>
          <Text fontSize={12} fontWeight="600" style={{ color: tokens.textFaint, textTransform: 'uppercase' }}>
            {f.label}
          </Text>
          <FieldDisplay field={f} value={record[f.name]} />
        </YStack>
      ))}
    </YStack>
  )
}

export interface RecordFormProps {
  fields: FieldDefinition[]
  /** Current draft values. */
  values: Record<string, unknown>
  /** Emit a single field's next value; the host owns the draft + save. */
  onChange: (name: string, value: unknown) => void
}

/** Editable field list — create/edit form. Read-only fields render as display. */
export function RecordForm({ fields, values, onChange }: RecordFormProps) {
  return (
    <YStack gap={14}>
      {fields.map((f) => (
        <YStack key={f.name} gap={6}>
          <Text fontSize={12} fontWeight="600" style={{ color: tokens.textFaint, textTransform: 'uppercase' }}>
            {f.label}
          </Text>
          {f.readOnly ? (
            <XStack>
              <FieldDisplay field={f} value={values[f.name]} />
            </XStack>
          ) : (
            <FieldInput field={f} value={values[f.name]} onChange={(v) => onChange(f.name, v)} />
          )}
        </YStack>
      ))}
    </YStack>
  )
}
