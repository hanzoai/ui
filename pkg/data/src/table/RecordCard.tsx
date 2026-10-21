// RecordCard — the compact card used by board (kanban) and gallery views. Shows
// a title field bold, then a few field displays. Same FieldDisplay engine as the
// table, so it understands every type. Drag/drop + column grouping live in the
// board host; this is the standalone card unit.
//
// Under `<Density value="compact">` (a CRM shell) it is the record kit's kanban
// card (MIT, NOTICE): the panel ground under a hairline
// at a 4px corner; a 32px header holding the record as a chip (its avatar in the
// record's hue, its name) and a checkbox slot that opens from 0 to 24 on hover
// or once the card is selected; then the field rows, 2 apart, each a 16px icon
// (or the field's name) 8 from a value held to 156. Hover edges it in the
// strong rim; selected fills it; active (open in the side panel) fills and edges
// it; keyboard focus inside fills it; a drag source fades to 0.3 and the preview
// lifts by 2%. At regular density it renders as it always has.
import { useState, type ReactNode } from 'react'
import { Card, Text, XStack, YStack } from '@hanzo/gui'
import { Avatar, Checkbox, Chip, useDensity } from '@hanzo/ui'
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
  /** Record look: whether the card is in the selection (its checkbox shows and it fills). */
  selected?: boolean
  /** Record look: the checkbox's change. The checkbox is drawn only when this is given. */
  onSelectedChange?: (selected: boolean) => void
  /** Record look: the card's record is the one open in the side panel. */
  active?: boolean
  /** Record look: a 16px icon per field name, in place of the field's name. */
  fieldIcons?: Record<string, ReactNode>
  /** Record look: the field whose value is the record's picture. */
  imageField?: string
  /** Record look: the source of a drag fades; the preview under the pointer lifts. */
  drag?: 'source' | 'preview'
}

/** The card's measures (the record kit's board card, MIT). */
export const CARD = { header: 32, check: 24, value: 156, icon: 16, rows: 2 } as const

export function RecordCard(props: RecordCardProps) {
  const density = useDensity()
  return density === 'compact' ? <KanbanCard {...props} /> : <SheetCard {...props} />
}

const titleOf = (titleField: string | undefined, fields: FieldDefinition[], record: Record<string, unknown>) => {
  const name = titleField ?? fields[0]?.name
  const value = name != null ? record[name] : undefined
  return { name, text: value == null || value === '' ? 'Untitled' : String(value) }
}

/** Whether a press began on a control of its own (a button, a link, the checkbox). */
const pressedControl = (e: unknown) => {
  const target = (e as { target?: unknown } | undefined)?.target
  return !!(target instanceof Element && target.closest('button, a, [role="button"], [role="checkbox"], [role="link"]'))
}

function KanbanCard({
  titleField,
  fields,
  record,
  onPress,
  selected = false,
  onSelectedChange,
  active = false,
  fieldIcons,
  imageField,
  drag,
}: RecordCardProps) {
  const [hovered, setHovered] = useState(false)
  const [within, setWithin] = useState(false)
  const title = titleOf(titleField, fields, record)
  const body = fields.filter((f) => f.name !== title.name && f.name !== imageField)
  const id = record.id != null ? String(record.id) : title.text
  const src = imageField ? (record[imageField] as string | null | undefined) : undefined
  const open = onPress ? () => onPress(record) : undefined
  const check = onSelectedChange && (hovered || selected)

  return (
    <YStack
      data-slot="record-card"
      data-selected={selected ? '' : undefined}
      data-active={active ? '' : undefined}
      bg={selected || active || within ? '$hover' : '$panel'}
      borderWidth={1}
      borderColor={active ? '$rim' : '$borderColor'}
      hoverStyle={{ borderColor: '$rim' }}
      rounded="$xs"
      overflow="hidden"
      cursor={open ? 'pointer' : undefined}
      opacity={drag === 'source' ? 0.3 : 1}
      scale={drag === 'preview' ? 1.02 : 1}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onFocus={() => setWithin(true)}
      onBlur={() => setWithin(false)}
      // A press anywhere opens the record — except on the controls inside it,
      // which act for themselves: the chip (the keyboard's way in) and the box.
      onPress={open ? (e: unknown) => (pressedControl(e) ? undefined : open()) : undefined}
    >
      <XStack data-slot="record-card-header" minH={CARD.header} items="center" pt="$2" pr="$2" pb="$1" pl="$2">
        <XStack flex={1} minW={0}>
          <Chip
            size="sm"
            weight="medium"
            label={title.text}
            startElement={<Avatar size="sm" shape="rounded" name={title.text} colorSeed={id} src={src ?? null} />}
            {...(open ? { onPress: open } : null)}
          />
        </XStack>
        {onSelectedChange ? (
          <XStack
            data-slot="record-card-check"
            // The chip's line, not the box's halo: the header stays 32 and the
            // halo's outer 2px is clipped until the pointer is on it.
            height={20}
            width={check ? CARD.check : 0}
            $touchable={{ width: CARD.check }}
            overflow="hidden"
            justify="flex-end"
            items="center"
            shrink={0}
            style={{ transition: 'width 160ms var(--ease-out, ease)' }}
          >
            <Checkbox
              variant="outline"
              checked={selected}
              onCheckedChange={(next: boolean | 'indeterminate') => onSelectedChange(next === true)}
              aria-label={`Select ${title.text}`}
            />
          </XStack>
        ) : null}
      </XStack>
      {body.length ? (
        <YStack data-slot="record-card-body" gap={CARD.rows} pt={0} pr="$2" pb="$2" pl={10}>
          {body.map((f) => (
            <XStack key={f.name} items="center" gap="$2" minH={24}>
              {fieldIcons?.[f.name] ? (
                <XStack width={CARD.icon} height={CARD.icon} items="center" justify="center" shrink={0}>
                  {fieldIcons[f.name]}
                </XStack>
              ) : (
                <Text fontSize="$1" color="$hint" numberOfLines={1} shrink={0}>
                  {f.label}
                </Text>
              )}
              <YStack flex={1} minW={0} maxW={CARD.value}>
                <FieldDisplay field={f} value={record[f.name]} />
              </YStack>
            </XStack>
          ))}
        </YStack>
      ) : null}
    </YStack>
  )
}

/** The card as it has always been drawn, for a regular surface. */
function SheetCard({ titleField, fields, record, onPress }: RecordCardProps) {
  const title = titleOf(titleField, fields, record)
  const bodyFields = fields.filter((f) => f.name !== title.name)

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
        {title.text}
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
