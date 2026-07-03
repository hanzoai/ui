// RecordCard — the compact card used by board (kanban) and gallery views. Shows
// a title field bold, then a few field displays. Same FieldDisplay engine as the
// table, so it understands every type. Drag/drop + column grouping live in the
// board host; this is the standalone card unit.
import { Card, Text, XStack, YStack } from '@hanzo/gui'
import type { FieldDefinition } from '../field/types'
import { FieldDisplay } from '../field/FieldDisplay'
import { tokens } from '../theme'

export interface RecordCardProps {
  /** The field whose value is the card title (defaults to the first field). */
  titleField?: string
  /** Fields shown in the card body (the title field is excluded automatically). */
  fields: FieldDefinition[]
  record: Record<string, unknown>
  onPress?: (record: Record<string, unknown>) => void
}

export function RecordCard({ titleField, fields, record, onPress }: RecordCardProps) {
  const titleName = titleField ?? fields[0]?.name
  const titleVal = titleName != null ? record[titleName] : undefined
  const bodyFields = fields.filter((f) => f.name !== titleName)

  return (
    <Card
      p={12}
      gap={8}
      borderWidth={1}
      rounded={8}
      cursor={onPress ? 'pointer' : undefined}
      hoverStyle={onPress ? { bg: tokens.hover } : undefined}
      onPress={onPress ? () => onPress(record) : undefined}
      style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
    >
      <Text fontSize={14} fontWeight="700" numberOfLines={1} style={{ color: tokens.text }}>
        {titleVal == null || titleVal === '' ? 'Untitled' : String(titleVal)}
      </Text>
      {bodyFields.map((f) => (
        <XStack key={f.name} gap={8} items="center">
          <Text fontSize={11} numberOfLines={1} width={84} style={{ color: tokens.textFaint }}>
            {f.label}
          </Text>
          <YStack flex={1}>
            <FieldDisplay field={f} value={record[f.name]} />
          </YStack>
        </XStack>
      ))}
    </Card>
  )
}
