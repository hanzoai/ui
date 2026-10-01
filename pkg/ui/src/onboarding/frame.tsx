'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { HanzoMark } from '@hanzogui/shell'
import { ArrowLeft } from '@hanzogui/lucide-icons-2'
import { Button } from '../backends/gui/button'
import { Card, CardContent } from '../backends/gui/card'
import { Heading, Paragraph, SizableText, XStack, YStack } from '../backends/gui/layout'
import { Spinner } from '../backends/gui/spinner'
import { ToggleGroup, ToggleGroupItem } from '../backends/gui/toggle-group'
import type { Interval } from './plans'

const Brand = createContext(true)

/**
 * Wrap onboarding in a host whose own shell already draws the logo and the page's
 * `main` (a bare masthead), so the pages draw neither a second logo nor a second `main`.
 */
export function Bare({ children }: { children: ReactNode }) {
  return <Brand.Provider value={false}>{children}</Brand.Provider>
}

/**
 * One page of onboarding: the product's mark, a title, a line under it, and the
 * screen. No progress bar and no step counter. `width` sets how much room the
 * screen has: a column for a form, the full row for three plans.
 */
export function Page({
  site,
  title,
  lede,
  back,
  children,
  center,
  width = 480,
  start,
  busy,
  foot,
}: {
  site: string
  title: string
  lede?: string
  back?: () => void
  children?: ReactNode
  center?: boolean
  width?: number
  /** Left-align the title and the line under it with the column, as a form does. */
  start?: boolean
  busy?: boolean
  /** A quiet line under the screen: who the email is, a way out. */
  foot?: ReactNode
}) {
  const brand = useContext(Brand)
  return (
    <YStack render={brand ? 'main' : 'div'} aria-busy={busy || undefined} bg="$background" minH="100vh" items="center" justify={center ? 'center' : 'flex-start'} gap="$4" pt={center ? 96 : 28} pb={96} px="$4">
      {back ? (
        <Button type="button" variant="ghost" size="icon-lg" aria-label="Back" position="absolute" t={20} l={20} rounded="$10" onClick={back}>
          <ArrowLeft size={18} />
        </Button>
      ) : null}
      {brand ? (
        <XStack items="center" gap="$2.5" mb="$5">
          <HanzoMark size={20} />
          <SizableText size="$5" fontWeight="500" color="$ink">
            {site}
          </SizableText>
        </XStack>
      ) : null}
      {title || lede ? (
        <YStack width="100%" maxW={start ? width : 720} items={start ? 'flex-start' : 'center'} gap="$3">
          {title ? (
            <Heading render="h1" size="$9" fontWeight="500" color="$ink" text={start ? 'left' : 'center'} m={0}>
              {title}
            </Heading>
          ) : null}
          {lede ? (
            <Paragraph size="$3" color="$quiet" text={start ? 'left' : 'center'} maxW={520} m={0}>
              {lede}
            </Paragraph>
          ) : null}
        </YStack>
      ) : null}
      {busy ? <Spinner size={20} /> : null}
      {children ? (
        <YStack width="100%" maxW={width} items="stretch" gap="$4" mt="$2">
          {children}
        </YStack>
      ) : null}
      {foot ? (
        <YStack width="100%" maxW={width} items="center" gap="$1">
          {foot}
        </YStack>
      ) : null}
    </YStack>
  )
}

/** A bordered panel with room inside, the surface for an order, a notice or a plan. */
export function Panel({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <Card aria-label={label} bg="$panel" width="100%">
      <CardContent gap="$3">{children}</CardContent>
    </Card>
  )
}

/** Monthly or Yearly, with what a year saves. `name` says which plan it changes, for screen readers. */
export function IntervalToggle({ interval, onChange, name, save }: { interval: Interval; onChange: (i: Interval) => void; name: string; save: number }) {
  return (
    <ToggleGroup type="single" size="sm" value={interval} disableDeactivation aria-label={`Billing interval for ${name}`} onValueChange={(v) => onChange(v as Interval)}>
      <ToggleGroupItem value="monthly">Monthly</ToggleGroupItem>
      <ToggleGroupItem value="annual">{`Yearly · Save ${save}%`}</ToggleGroupItem>
    </ToggleGroup>
  )
}

/** A line of an order: what, and how much. `muted` for the lines that are not the total. */
export function Line({ label, note, value, muted, strong }: { label: ReactNode; note?: ReactNode; value: ReactNode; muted?: boolean; strong?: boolean }) {
  const color = muted ? '$quiet' : '$ink'
  const weight = strong ? '600' : '400'
  return (
    <XStack justify="space-between" gap="$4" items="flex-start">
      <YStack flex={1} minW={0}>
        <SizableText size="$2" color={color} fontWeight={weight}>
          {label}
        </SizableText>
        {note ? (
          <SizableText size="$1" color="$quiet">
            {note}
          </SizableText>
        ) : null}
      </YStack>
      <SizableText size="$2" color={color} fontWeight={weight}>
        {value}
      </SizableText>
    </XStack>
  )
}
