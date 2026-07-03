// Calendar — a compact month-grid day picker for date / dateTime fields. Pure
// primitives + the data palette; no date library. Emits an ISO `YYYY-MM-DD` on
// select. Month navigation is local state; today and the selected day are marked.
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from '@hanzogui/lucide-icons-2'
import { Text, XStack, YStack } from '@hanzo/gui'
import { tokens, tagTone } from '../theme'

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const iso = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export interface CalendarProps {
  /** Selected day as ISO `YYYY-MM-DD`, or undefined. */
  value?: string
  onSelect: (isoDate: string) => void
}

export function Calendar({ value, onSelect }: CalendarProps) {
  const selected = value ? new Date(`${value}T00:00:00`) : null
  const init = selected && !Number.isNaN(selected.getTime()) ? selected : new Date()
  const [view, setView] = useState({ year: init.getFullYear(), month: init.getMonth() })
  const today = iso(new Date())

  const first = new Date(view.year, view.month, 1)
  const startPad = first.getDay()
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array.from({ length: startPad }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const shift = (delta: number) => {
    const m = view.month + delta
    setView({ year: view.year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 })
  }
  const selectedIso = selected ? iso(selected) : ''

  return (
    <YStack width={252} p={10} gap={8}>
      <XStack items="center" justify="space-between">
        <YStack width={28} height={28} rounded={6} items="center" justify="center" cursor="pointer" hoverStyle={{ bg: tokens.hover }} onPress={() => shift(-1)}>
          <ChevronLeft size={16} color={tokens.textMuted} />
        </YStack>
        <Text fontSize={13} fontWeight="700" style={{ color: tokens.text }}>{`${MONTHS[view.month]} ${view.year}`}</Text>
        <YStack width={28} height={28} rounded={6} items="center" justify="center" cursor="pointer" hoverStyle={{ bg: tokens.hover }} onPress={() => shift(1)}>
          <ChevronRight size={16} color={tokens.textMuted} />
        </YStack>
      </XStack>

      <XStack>
        {DOW.map((d, i) => (
          <YStack key={i} width={32} items="center">
            <Text fontSize={11} fontWeight="600" style={{ color: tokens.textFaint }}>{d}</Text>
          </YStack>
        ))}
      </XStack>

      <YStack>
        {Array.from({ length: cells.length / 7 }, (_, row) => (
          <XStack key={row}>
            {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
              if (day == null) return <YStack key={col} width={32} height={30} />
              const dISO = iso(new Date(view.year, view.month, day))
              const isSel = dISO === selectedIso
              const isToday = dISO === today
              return (
                <YStack
                  key={col}
                  width={32}
                  height={30}
                  items="center"
                  justify="center"
                  rounded={6}
                  cursor="pointer"
                  hoverStyle={{ bg: tokens.hover }}
                  onPress={() => onSelect(dISO)}
                  style={isSel ? { backgroundColor: tokens.accent } : undefined}
                >
                  <Text
                    fontSize={12}
                    fontWeight={isSel || isToday ? '700' : '400'}
                    style={{ color: isSel ? '#0b1220' : isToday ? tagTone('blue').fg : tokens.text }}
                  >
                    {day}
                  </Text>
                </YStack>
              )
            })}
          </XStack>
        ))}
      </YStack>
    </YStack>
  )
}
