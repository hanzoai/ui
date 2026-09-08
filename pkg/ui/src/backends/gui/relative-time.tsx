'use client'

/**
 * RelativeTime — a `<time>` element that keeps saying how long ago (or from
 * now) a moment was, ticking on an interval so a page left open does not go
 * stale. `format` picks the wording: `auto` ("3 hours ago"), `short` ("3h"),
 * or `long`, which hands the same distance to `Intl.RelativeTimeFormat` for
 * locale-correct phrasing ("yesterday", "in 3 hours").
 */
import { SizableText, styled } from '@hanzo/gui'
import * as React from 'react'

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

const autoForm = (diffInSeconds: number) => {
  if (diffInSeconds < 0) {
    const abs = -diffInSeconds
    if (abs < 60) return 'in a moment'
    if (abs < 120) return 'in 1 minute'
    if (abs < 3600) return `in ${Math.floor(abs / 60)} minutes`
    if (abs < 7200) return 'in 1 hour'
    if (abs < 86400) return `in ${Math.floor(abs / 3600)} hours`
    if (abs < 172800) return 'tomorrow'
    if (abs < 604800) return `in ${Math.floor(abs / 86400)} days`
    if (abs < 1209600) return 'in 1 week'
    if (abs < 2592000) return `in ${Math.floor(abs / 604800)} weeks`
    if (abs < 5184000) return 'in 1 month'
    if (abs < 31536000) return `in ${Math.floor(abs / 2592000)} months`
    if (abs < 63072000) return 'in 1 year'
    return `in ${Math.floor(abs / 31536000)} years`
  }

  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 120) return '1 minute ago'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 7200) return '1 hour ago'
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 172800) return '1 day ago'
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
  if (diffInSeconds < 1209600) return '1 week ago'
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`
  if (diffInSeconds < 5184000) return '1 month ago'
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`
  if (diffInSeconds < 63072000) return '1 year ago'
  return `${Math.floor(diffInSeconds / 31536000)} years ago`
}

const longFormatter = /* @__PURE__ */ (() => {
  let cached: Intl.RelativeTimeFormat | undefined
  return () => (cached ??= new Intl.RelativeTimeFormat(undefined, { numeric: 'auto', style: 'long' }))
})()

const longForm = (diffInSeconds: number) => {
  for (const [unit, secondsInUnit] of UNITS) {
    const abs = Math.abs(diffInSeconds)
    if (abs >= secondsInUnit || unit === 'second') {
      const value = Math.round(diffInSeconds / secondsInUnit) * -1
      return longFormatter().format(value, unit)
    }
  }
  return longFormatter().format(0, 'second')
}

const relativeTime = (date: Date | string, format: RelativeTimeFormat) => {
  const diffInSeconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (format === 'short') return shortForm(diffInSeconds)
  if (format === 'long') return longForm(diffInSeconds)
  return autoForm(diffInSeconds)
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
export function RelativeTime({
  date,
  format = 'auto',
  updateInterval = 60000,
  ...props
}: RelativeTimeProps) {
  const [text, setText] = React.useState(() => relativeTime(date, format))

  React.useEffect(() => {
    setText(relativeTime(date, format))
    const id = setInterval(() => setText(relativeTime(date, format)), updateInterval)
    return () => clearInterval(id)
  }, [date, format, updateInterval])

  return (
    <RelativeTimeText
      data-slot="relative-time"
      data-format={format}
      {...({ dateTime: new Date(date).toISOString(), ...props } as React.ComponentProps<typeof RelativeTimeText>)}
    >
      {text}
    </RelativeTimeText>
  )
}
