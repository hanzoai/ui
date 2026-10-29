'use client'

/**
 * RelativeTime — a `<time>` element that keeps saying how long ago (or from
 * now) a moment was, ticking on an interval so a page left open does not go
 * stale. `format` picks the wording: `auto` ("3 hours ago"), `short` ("3h"),
 * or `long`, which hands the same distance to `Intl.RelativeTimeFormat` for
 * locale-correct phrasing ("yesterday", "in 3 hours").
 */
import * as React from 'react'
import { SizableText, styled } from '@hanzo/gui'

import { useLocale, useTranslate, type Translate } from '../../i18n/react'

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31536000],
  ['month', 2592000],
  ['week', 604800],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
  ['second', 1],
]

const SHORT_SUFFIX: Record<Intl.RelativeTimeFormatUnit, string> = {
  year: 'y',
  month: 'mo',
  week: 'w',
  day: 'd',
  hour: 'h',
  minute: 'm',
  second: 's',
} as Record<Intl.RelativeTimeFormatUnit, string>

const shortForm = (diffInSeconds: number) => {
  const abs = Math.abs(diffInSeconds)
  for (const [unit, secondsInUnit] of UNITS) {
    if (abs >= secondsInUnit || unit === 'second') {
      const value = Math.floor(abs / secondsInUnit)
      const distance = `${value}${SHORT_SUFFIX[unit]}`
      return diffInSeconds < 0 ? `in ${distance}` : distance
    }
  }
  return '0s'
}

const autoForm = (diffInSeconds: number, tr: Translate) => {
  if (diffInSeconds < 0) {
    const abs = -diffInSeconds
    if (abs < 60) return tr('in a moment')
    if (abs < 120) return tr('in 1 minute')
    if (abs < 3600) return tr('in {n} minutes', { n: Math.floor(abs / 60) })
    if (abs < 7200) return tr('in 1 hour')
    if (abs < 86400) return tr('in {n} hours', { n: Math.floor(abs / 3600) })
    if (abs < 172800) return tr('tomorrow')
    if (abs < 604800) return tr('in {n} days', { n: Math.floor(abs / 86400) })
    if (abs < 1209600) return tr('in 1 week')
    if (abs < 2592000) return tr('in {n} weeks', { n: Math.floor(abs / 604800) })
    if (abs < 5184000) return tr('in 1 month')
    if (abs < 31536000) return tr('in {n} months', { n: Math.floor(abs / 2592000) })
    if (abs < 63072000) return tr('in 1 year')
    return tr('in {n} years', { n: Math.floor(abs / 31536000) })
  }

  if (diffInSeconds < 60) return tr('just now')
  if (diffInSeconds < 120) return tr('1 minute ago')
  if (diffInSeconds < 3600) return tr('{n} minutes ago', { n: Math.floor(diffInSeconds / 60) })
  if (diffInSeconds < 7200) return tr('1 hour ago')
  if (diffInSeconds < 86400) return tr('{n} hours ago', { n: Math.floor(diffInSeconds / 3600) })
  if (diffInSeconds < 172800) return tr('1 day ago')
  if (diffInSeconds < 604800) return tr('{n} days ago', { n: Math.floor(diffInSeconds / 86400) })
  if (diffInSeconds < 1209600) return tr('1 week ago')
  if (diffInSeconds < 2592000) return tr('{n} weeks ago', { n: Math.floor(diffInSeconds / 604800) })
  if (diffInSeconds < 5184000) return tr('1 month ago')
  if (diffInSeconds < 31536000) return tr('{n} months ago', { n: Math.floor(diffInSeconds / 2592000) })
  if (diffInSeconds < 63072000) return tr('1 year ago')
  return tr('{n} years ago', { n: Math.floor(diffInSeconds / 31536000) })
}

const longForm = (diffInSeconds: number, locale?: string) => {
  const format = new Intl.RelativeTimeFormat(locale, {
    numeric: 'auto',
    style: 'long',
  })
  for (const [unit, secondsInUnit] of UNITS) {
    const abs = Math.abs(diffInSeconds)
    if (abs >= secondsInUnit || unit === 'second') {
      const value = Math.round(diffInSeconds / secondsInUnit) * -1
      return format.format(value, unit)
    }
  }
  return format.format(0, 'second')
}

const relativeTime = (date: Date | string, format: RelativeTimeFormat, tr: Translate, locale?: string) => {
  const diffInSeconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (format === 'short') return shortForm(diffInSeconds)
  if (format === 'long') return longForm(diffInSeconds, locale)
  return autoForm(diffInSeconds, tr)
}

export type RelativeTimeFormat = 'auto' | 'short' | 'long'

const RelativeTimeText = styled(SizableText, {
  name: 'RelativeTime',
  render: 'time',
})

export type RelativeTimeProps = Omit<React.ComponentProps<'time'>, 'dateTime' | 'children'> & {
  date: Date | string
  format?: RelativeTimeFormat
  updateInterval?: number
}

/** A self-updating `<time>` reading how long ago (or until) `date` is. */
export function RelativeTime({ date, format = 'auto', updateInterval = 60000, ...props }: RelativeTimeProps) {
  const tr = useTranslate()
  const { active, locale } = useLocale()
  const intl = active ? locale : undefined
  const [text, setText] = React.useState(() => relativeTime(date, format, tr, intl))

  React.useEffect(() => {
    setText(relativeTime(date, format, tr, intl))
    const id = setInterval(() => setText(relativeTime(date, format, tr, intl)), updateInterval)
    return () => clearInterval(id)
  }, [date, format, updateInterval, tr, intl])

  return (
    <RelativeTimeText
      data-slot="relative-time"
      data-format={format}
      {...({
        dateTime: new Date(date).toISOString(),
        ...props,
      } as React.ComponentProps<typeof RelativeTimeText>)}
    >
      {text}
    </RelativeTimeText>
  )
}
