'use client'

/**
 * RecordCards — the PHONE view of a DocType's documents: one stacked card per
 * record instead of a horizontally-scrolling grid.
 *
 * A 12-column ERP Sales Order in a table on a 390px screen is a wall you drag
 * sideways to read one row; the same record as a card is a title plus its declared
 * list columns as label → value pairs, reading top to bottom in the width you
 * have. Nothing is hidden that the table would have shown — the card renders the
 * DocType's OWN `inListView` projection (`cardFields`), and the full record is one
 * tap away.
 *
 * The whole card is the tap target (far past the 44px floor), values render
 * through the SAME `FieldDisplay` router the table uses, so every field type
 * behaves identically in both, and search is the pure `searchRecords` — no second
 * filtering model.
 */
import { useMemo, useState, type ReactNode } from 'react'
import { Card, Input, Text, XStack, YStack } from '@hanzo/gui'
import { ChevronRight, Search } from '@hanzogui/lucide-icons-2'
import { FieldDisplay, searchRecords, type FieldDefinition } from '@hanzo/data'
import { useI18n, type Say } from '@hanzo/i18n/react'

import { Action, Loading, Meta, WRAP_ANYWHERE } from './parts'
import { mirror } from '../backends/gui/dir'

export interface RecordCardsProps {
  /** The field shown as the card's headline (the DocType's titleField). */
  titleField?: string
  /** All fields (used for search); `cardFields` decides what a card shows. */
  fields: FieldDefinition[]
  /** The subset rendered as label → value rows on each card. */
  cardFields: FieldDefinition[]
  records: Record<string, unknown>[]
  loading?: boolean
  empty?: ReactNode
  onOpen?: (record: Record<string, unknown>) => void
  onCreate?: () => void
  createLabel?: string
  /** Extra toolbar control (e.g. Refresh). */
  toolbarExtra?: ReactNode
}

/** The headline for a card: the title field, else the record key. */
function headline(record: Record<string, unknown>, t: Say, titleField?: string): string {
  const title = titleField ? record[titleField] : undefined
  if (typeof title === 'string' && title.trim()) return title
  if (typeof title === 'number') return String(title)
  const name = record.name ?? record.id
  return typeof name === 'string' && name ? name : t('Untitled')
}

export function RecordCards({
  titleField,
  fields,
  cardFields,
  records,
  loading,
  empty,
  onOpen,
  onCreate,
  createLabel,
  toolbarExtra,
}: RecordCardsProps) {
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const visible = useMemo(() => searchRecords(records, query, fields), [records, query, fields])

  return (
    <YStack testID="doctype-cards" gap="$3" width="100%">
      {/* Toolbar: search takes the full row on a phone; the create action sits
          below it at full width, so both are thumb-reachable and neither clips. */}
      <YStack gap="$2" width="100%">
        <XStack
          items="center"
          gap="$2"
          px="$3"
          minH={44}
          rounded="$3"
          borderWidth={1}
          borderColor="$borderColor"
          width="100%"
        >
          <Search size={15} opacity={0.6} />
          <Input
            unstyled
            flex={1}
            minW={0}
            height={42}
            fontSize="$3"
            color="$color12"
            placeholder={t('Search')}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
          />
        </XStack>
        <XStack gap="$2" items="center" flexWrap="wrap" width="100%">
          {onCreate ? (
            <Action phone primary onPress={onCreate}>
              {createLabel ?? t('New record')}
            </Action>
          ) : null}
          {toolbarExtra}
        </XStack>
      </YStack>

      {loading ? <Loading label={t('Loading records…')} /> : null}

      {!loading && visible.length === 0 ? (
        <Card borderWidth={1} borderColor="$borderColor" p="$4" width="100%">
          <Text fontSize="$3" color="$color10">
            {query ? t('No records match “{query}”.', { query }) : empty ?? t('No records yet.')}
          </Text>
        </Card>
      ) : null}

      <YStack gap="$2" width="100%">
        {visible.map((rec, i) => {
          const key = String(rec.name ?? rec.id ?? i)
          return (
            <Card
              key={key}
              borderWidth={1}
              borderColor="$borderColor"
              rounded="$3"
              p="$3"
              width="100%"
              cursor={onOpen ? 'pointer' : undefined}
              pressStyle={onOpen ? { bg: '$color3' } : undefined}
              hoverStyle={onOpen ? { borderColor: '$color8' } : undefined}
              onPress={onOpen ? () => onOpen(rec) : undefined}
              style={WRAP_ANYWHERE}
            >
              <YStack gap="$2" width="100%">
                <XStack items="center" gap="$2" width="100%">
                  <Text fontSize="$4" fontWeight="700" flex={1} minW={0} numberOfLines={2}>
                    {headline(rec, t, titleField)}
                  </Text>
                  {onOpen ? <ChevronRight {...mirror} size={16} opacity={0.5} /> : null}
                </XStack>

                {cardFields.map((f) => (
                  // Label above value: a two-column row forces the value into a
                  // sliver at 390px. Stacked, every field type gets the full width.
                  <YStack key={f.name} gap="$0.5" width="100%">
                    <Text fontSize="$1" color="$color10" textTransform="uppercase" letterSpacing={0.4}>
                      {f.label}
                    </Text>
                    <XStack width="100%" flexWrap="wrap">
                      <FieldDisplay field={f} value={rec[f.name]} />
                    </XStack>
                  </YStack>
                ))}
              </YStack>
            </Card>
          )
        })}
      </YStack>

      {visible.length ? (
        <Meta>
          {records.length === 1
            ? t('{shown} of {total} record', { shown: visible.length, total: records.length })
            : t('{shown} of {total} records', { shown: visible.length, total: records.length })}
        </Meta>
      ) : null}
    </YStack>
  )
}
