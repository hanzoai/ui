'use client'

/**
 * Twenty-style Calendar View for date-bearing CRM objects:
 *   - Tasks (`due`)
 *   - Pipeline deals (`close_date`)
 *   - Fundraising (`close_date`)
 *   - Candidates (`applied`)
 *
 * Desktop (`>=768px`): 7-column Month grid with clickable record pills per day.
 * Mobile (`<768px`, e.g. 390px): Grouped chronological agenda list (zero overflow).
 */
import { useMemo, useState } from 'react'
import { Button, Text, XStack, YStack } from '@hanzo/gui'
import { Card } from '@hanzo/ui'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from '@hanzogui/lucide-icons-2'

import { useViewport } from './responsive'
import {
  CALENDAR_MONTHS as MONTHS,
  CALENDAR_WEEKDAYS as WEEKDAYS,
  buildAgendaGroups,
  buildMonthGrid,
  calendarTitleText as titleText,
  extractDateKey,
  formatDateKey,
  groupRecordsByDate,
  type AgendaGroup,
  type CalendarCell,
  type CalendarItem,
} from './twenty-logic'

export { buildAgendaGroups, buildMonthGrid, extractDateKey, formatDateKey, groupRecordsByDate, type AgendaGroup, type CalendarCell, type CalendarItem }

export interface CalendarViewProps {
  records: readonly Record<string, unknown>[]
  dateField: string
  dateLabel?: string
  titleField: string
  onOpen: (record: Record<string, unknown>) => void
  onCreate?: () => void
  createLabel?: string
}

export function CalendarView({
  records,
  dateField,
  dateLabel,
  titleField,
  onOpen,
  onCreate,
  createLabel = 'New record',
}: CalendarViewProps) {
  const { mobile } = useViewport()
  const now = new Date()
  const todayKey = formatDateKey(now.getFullYear(), now.getMonth(), now.getDate())

  const [cursor, setCursor] = useState(() => ({ year: now.getFullYear(), month: now.getMonth() }))

  const shiftMonth = (delta: number) => {
    setCursor((c) => {
      const next = new Date(Date.UTC(c.year, c.month + delta, 1))
      return { year: next.getUTCFullYear(), month: next.getUTCMonth() }
    })
  }

  const cells = useMemo(() => buildMonthGrid(cursor.year, cursor.month, todayKey), [cursor.year, cursor.month, todayKey])
  const { byDate, unscheduled } = useMemo(
    () => groupRecordsByDate(records, dateField, titleField),
    [records, dateField, titleField],
  )
  const agenda = useMemo(
    () => buildAgendaGroups(byDate, cursor.year, cursor.month, todayKey),
    [byDate, cursor.year, cursor.month, todayKey],
  )

  return (
    <YStack gap="$3" width="100%" maxW="100%" data-slot="crm-calendar" data-field={dateField}>
      <XStack items="center" justify="space-between" gap="$2" flexWrap="wrap">
        <XStack items="center" gap="$2">
          <Button size="$2" bg="$color2" borderWidth={1} borderColor="$borderColor" onPress={() => shiftMonth(-1)} aria-label="Previous month">
            <ChevronLeft size={14} color="$color11" />
          </Button>
          <Text fontSize="$5" fontWeight="700" color="$color12" minW={150} text="center" data-slot="crm-calendar-month">
            {`${MONTHS[cursor.month]} ${cursor.year}`}
          </Text>
          <Button size="$2" bg="$color2" borderWidth={1} borderColor="$borderColor" onPress={() => shiftMonth(1)} aria-label="Next month">
            <ChevronRight size={14} color="$color11" />
          </Button>
          <Button
            size="$2"
            chromeless
            onPress={() => setCursor({ year: now.getFullYear(), month: now.getMonth() })}
          >
            Today
          </Button>
        </XStack>
        <XStack items="center" gap="$2">
          <Text fontSize="$2" color="$color10">
            {`${dateLabel ?? dateField} · ${records.length - unscheduled.length} scheduled`}
          </Text>
          {onCreate ? (
            <Button size="$2" theme="blue" onPress={onCreate}>
              {createLabel}
            </Button>
          ) : null}
        </XStack>
      </XStack>

      {mobile ? (
        <YStack gap="$2.5" data-slot="crm-calendar-agenda">
          {agenda.length === 0 ? (
            <Card p="$4" borderWidth={1} borderColor="$borderColor" items="center" gap="$2">
              <CalendarIcon size={20} color="$color9" />
              <Text fontSize="$3" color="$color10">
                {`Nothing scheduled in ${MONTHS[cursor.month]} ${cursor.year}.`}
              </Text>
            </Card>
          ) : (
            agenda.map((group) => (
              <YStack key={group.dateKey} gap="$1.5" data-slot="crm-agenda-day">
                <XStack items="center" gap="$2">
                  <Text fontSize="$2" fontWeight="700" color={group.isToday ? '$blue10' : '$color11'}>
                    {group.label}
                  </Text>
                  {group.isToday ? (
                    <Text fontSize="$1" color="$blue10" px="$1.5" py={1} bg="$color3" rounded="$2">
                      Today
                    </Text>
                  ) : null}
                </XStack>
                {group.items.map((item) => (
                  <Card
                    key={item.id}
                    p="$3"
                    borderWidth={1}
                    borderColor="$borderColor"
                    bg="$color2"
                    cursor="pointer"
                    onPress={() => onOpen(item.raw)}
                    data-slot="crm-calendar-item"
                  >
                    <XStack items="center" justify="space-between" gap="$2">
                      <Text fontSize="$3" fontWeight="600" color="$color12" flex={1} numberOfLines={1}>
                        {item.title}
                      </Text>
                      {item.badge ? (
                        <Text fontSize="$1" color="$color10" px="$2" py={2} bg="$color3" rounded="$2">
                          {item.badge.replace(/_/g, ' ')}
                        </Text>
                      ) : null}
                    </XStack>
                    {item.subtitle ? (
                      <Text fontSize="$2" color="$color10" mt="$1" numberOfLines={1}>
                        {item.subtitle}
                      </Text>
                    ) : null}
                  </Card>
                ))}
              </YStack>
            ))
          )}
        </YStack>
      ) : (
        <Card borderWidth={1} borderColor="$borderColor" overflow="hidden" data-slot="crm-calendar-grid">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
            {WEEKDAYS.map((d) => (
              <YStack key={d} px="$2" py="$1.5" borderBottomWidth={1} borderColor="$borderColor" bg="$color2">
                <Text fontSize="$1" fontWeight="700" color="$color10">
                  {d}
                </Text>
              </YStack>
            ))}
            {cells.map((cell) => {
              const items = byDate.get(cell.dateKey) ?? []
              return (
                <YStack
                  key={cell.dateKey}
                  minH={104}
                  p="$1.5"
                  gap="$1"
                  borderRightWidth={1}
                  borderBottomWidth={1}
                  borderColor="$borderColor"
                  bg={cell.inMonth ? '$background' : '$color2'}
                  opacity={cell.inMonth ? 1 : 0.6}
                  data-slot="crm-calendar-cell"
                  data-date={cell.dateKey}
                >
                  <XStack items="center" justify="space-between">
                    <Text
                      fontSize="$1"
                      fontWeight={cell.isToday ? '700' : '500'}
                      color={cell.isToday ? '$blue10' : '$color10'}
                      px={cell.isToday ? '$1.5' : 0}
                      py={cell.isToday ? 1 : 0}
                      rounded="$4"
                      bg={cell.isToday ? '$color3' : 'transparent'}
                    >
                      {cell.day}
                    </Text>
                    {items.length > 0 ? (
                      <Text fontSize="$1" color="$color9">
                        {items.length}
                      </Text>
                    ) : null}
                  </XStack>
                  {items.slice(0, 3).map((item) => (
                    <XStack
                      key={item.id}
                      px="$1.5"
                      py={3}
                      rounded="$1"
                      bg="$color3"
                      borderWidth={1}
                      borderColor="$borderColor"
                      cursor="pointer"
                      hoverStyle={{ bg: '$color4' }}
                      onPress={() => onOpen(item.raw)}
                      data-slot="crm-calendar-item"
                    >
                      <Text fontSize="$1" fontWeight="500" color="$color12" numberOfLines={1}>
                        {item.title}
                      </Text>
                    </XStack>
                  ))}
                  {items.length > 3 ? (
                    <Text fontSize="$1" color="$color10" px="$1">
                      {`+${items.length - 3} more`}
                    </Text>
                  ) : null}
                </YStack>
              )
            })}
          </div>
        </Card>
      )}

      {unscheduled.length > 0 ? (
        <YStack gap="$1.5" data-slot="crm-calendar-unscheduled">
          <Text fontSize="$2" fontWeight="600" color="$color10">
            {`Unscheduled (${unscheduled.length})`}
          </Text>
          <XStack gap="$2" flexWrap="wrap">
            {unscheduled.slice(0, 12).map((r) => (
              <Button
                key={String(r.id)}
                size="$2"
                bg="$color2"
                borderWidth={1}
                borderColor="$borderColor"
                onPress={() => onOpen(r)}
              >
                <Text fontSize="$2" color="$color11" numberOfLines={1}>
                  {titleText(r, titleField)}
                </Text>
              </Button>
            ))}
          </XStack>
        </YStack>
      ) : null}
    </YStack>
  )
}
