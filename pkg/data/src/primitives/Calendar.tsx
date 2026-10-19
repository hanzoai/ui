'use client'

// Calendar — a month-grid day picker for date fields: @hanzo/ui's Calendar, under
// this package's ISO-day contract. A day is a `YYYY-MM-DD` string, never an
// instant, so it is converted at local midnight both ways and cannot slip a day
// in a zone west of Greenwich.
import { Calendar as KitCalendar } from '@hanzo/ui'

export interface CalendarProps {
  /** Selected day as ISO `YYYY-MM-DD`, or undefined. */
  value?: string
  onSelect: (isoDate: string) => void
}

const pad = (n: number) => String(n).padStart(2, '0')

const toLocal = (day: string): Date | undefined => {
  const m = day.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return undefined
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return Number.isNaN(d.getTime()) ? undefined : d
}

export function Calendar({ value, onSelect }: CalendarProps) {
  const selected = value ? toLocal(value) : undefined
  return (
    <KitCalendar
      mode="single"
      selected={selected}
      defaultMonth={selected}
      onSelect={(d?: Date) => {
        if (d) onSelect(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`)
      }}
    />
  )
}
