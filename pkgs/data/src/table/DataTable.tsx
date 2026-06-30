// DataTable — the metadata-driven record grid. Give it a list of FieldDefinitions
// (columns) and records (rows); each cell renders through FieldDisplay, so the
// table understands every field type automatically and a new type needs zero
// table changes. The universal list view for any Base-backed object — CRM
// contacts, CMS entries, commerce products — all the same component.
import { Text, XStack, YStack } from '@hanzo/gui'
import type { FieldDefinition } from '../field/types'
import { FieldDisplay } from '../field/FieldDisplay'
import { tokens } from '../theme'

export interface DataTableProps {
  /** Columns, in order. Each carries its own type + optional fixed `width`. */
  fields: FieldDefinition[]
  /** Rows. Each is a flat map of field name → value. */
  records: Array<Record<string, unknown>>
  /** Stable row key; defaults to `record.id` then index. */
  getRowKey?: (record: Record<string, unknown>, index: number) => string
  /** Click a row (open detail). */
  onRowPress?: (record: Record<string, unknown>) => void
  loading?: boolean
  /** Empty-state text. */
  empty?: string
}

export function DataTable({
  fields,
  records,
  getRowKey,
  onRowPress,
  loading,
  empty = 'No records yet.',
}: DataTableProps) {
  const keyOf = (r: Record<string, unknown>, i: number) =>
    getRowKey ? getRowKey(r, i) : (r.id != null ? String(r.id) : String(i))

  return (
    <YStack
      borderWidth={1}
      rounded={8}
      overflow="hidden"
      style={{ borderColor: tokens.border, backgroundColor: tokens.surface }}
    >
      {/* header */}
      <XStack px={16} py={10} gap={16} style={{ backgroundColor: tokens.surfaceRaised, borderBottomWidth: 1, borderBottomColor: tokens.border }}>
        {fields.map((f) => (
          <YStack key={f.name} width={f.width} flex={f.width ? undefined : 1}>
            <Text fontSize={12} fontWeight="600" numberOfLines={1} style={{ color: tokens.textFaint, textTransform: 'uppercase' }}>
              {f.label}
            </Text>
          </YStack>
        ))}
      </XStack>

      {/* body */}
      {loading ? (
        <YStack px={16} py={28} items="center">
          <Text style={{ color: tokens.textFaint }}>Loading…</Text>
        </YStack>
      ) : records.length === 0 ? (
        <YStack px={16} py={28} items="center">
          <Text style={{ color: tokens.textFaint }}>{empty}</Text>
        </YStack>
      ) : (
        records.map((record, i) => (
          <XStack
            key={keyOf(record, i)}
            px={16}
            py={12}
            gap={16}
            items="center"
            cursor={onRowPress ? 'pointer' : undefined}
            hoverStyle={onRowPress ? { bg: tokens.hover } : undefined}
            onPress={onRowPress ? () => onRowPress(record) : undefined}
            style={{ borderBottomWidth: 1, borderBottomColor: tokens.border }}
          >
            {fields.map((f) => (
              <YStack key={f.name} width={f.width} flex={f.width ? undefined : 1}>
                <FieldDisplay field={f} value={record[f.name]} />
              </YStack>
            ))}
          </XStack>
        ))
      )}
    </YStack>
  )
}
