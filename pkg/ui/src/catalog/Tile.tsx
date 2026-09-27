'use client'

/**
 * The cards on a `Shelf`.
 *
 *   Tiles      the cards, in as many columns as fit — one on a phone
 *   Tile       one card: its mark, what it is, a few lines, a quiet fact, and
 *              its one action at the top right
 *   Featured   the one card a shelf puts first, drawn larger
 *   Add        a card's action: a plus while it is not yours, a check once it is
 *
 * Pressing a card opens it; its action is its own control BESIDE that press,
 * never inside it — a button in a button is two targets that fight.
 *
 * `Tiles` lays out on the package's one grid (`@hanzo/ui/grid`), whose `{ min }`
 * track is `repeat(auto-fill, minmax(min(280px, 100%), 1fr))`: as many columns
 * as fit, and never a track wider than a phone. That grid is a `div` with
 * `display: grid`, so this module is web-only, like the grid itself.
 */
import { SizableText, XStack, YStack } from '@hanzo/gui'
import { Check, Plus } from '@hanzogui/lucide-icons-2'
import type { ReactNode } from 'react'

import { Button } from '../backends/gui/button'
import { press, RING } from '../backends/gui/press'
import { slot } from '../backends/gui/slot'
import { Grid } from '../grid'

/** A card's narrowest column, px. */
const MIN = 280

/** A press that holds a card's words reads from the left. */
const LEFT = { textAlign: 'left' } as const

export interface TilesProps {
  /** Names the list — "Skills to add". */
  label: string
  /** Narrowest a column gets before the grid drops one, px. */
  min?: number
  children?: ReactNode
}

/** The cards, in as many columns as fit, one on a phone. A list of `Tile`s. */
export function Tiles({ label, min = MIN, children }: TilesProps) {
  return (
    <Grid role="list" aria-label={label} columns={{ min }} gap={12}>
      {children}
    </Grid>
  )
}

export interface TileProps {
  title: string
  /** A few lines about it; clamped at three. */
  detail?: string
  /** A quiet fact under them — where it comes from, when it was saved. */
  meta?: string
  /** Its picture, ~32px square. */
  mark?: ReactNode
  /** Its one control, at the top right — an `Add`, a switch. */
  action?: ReactNode
  /** Pressing the card. None, and the card is words only. */
  onOpen?: () => void
}

/** One card: what it is, a few lines about it, a quiet fact, and its action. */
export function Tile({ title, detail, meta, mark, action, onOpen }: TileProps) {
  const body = (
    <>
      {mark}
      <YStack flex={1} minW={0} gap="$1">
        <SizableText size="$3" color="$ink" numberOfLines={1}>
          {title}
        </SizableText>
        {detail ? (
          <SizableText size="$1" color="$soft" numberOfLines={3}>
            {detail}
          </SizableText>
        ) : null}
        {meta ? (
          <SizableText size="$1" color="$soft" numberOfLines={1} opacity={0.8}>
            {meta}
          </SizableText>
        ) : null}
      </YStack>
    </>
  )
  return (
    <XStack
      {...slot('tile')}
      role="listitem"
      items="flex-start"
      gap="$2"
      p="$3"
      minW={0}
      rounded="$4"
      borderWidth={1}
      borderColor="$borderColor"
      bg="$panel"
      hoverStyle={onOpen ? { borderColor: '$edge' } : undefined}
    >
      {onOpen ? (
        <XStack
          {...slot('tile-open')}
          {...press(onOpen)}
          aria-label={title}
          flex={1}
          minW={0}
          gap="$3"
          items="flex-start"
          cursor="pointer"
          rounded="$2"
          style={LEFT}
          focusVisibleStyle={RING}
        >
          {body}
        </XStack>
      ) : (
        <XStack flex={1} minW={0} gap="$3" items="flex-start">
          {body}
        </XStack>
      )}
      {action}
    </XStack>
  )
}

export interface FeaturedProps {
  title: string
  detail: string
  meta?: string
  mark: ReactNode
  action?: ReactNode
  onOpen: () => void
  /** The word over the title. */
  tag?: string
}

/** The one card the shelf puts first, drawn larger. Its action wraps under it on a phone. */
export function Featured({ title, detail, meta, mark, action, onOpen, tag = 'Featured' }: FeaturedProps) {
  return (
    <XStack
      {...slot('featured')}
      items="flex-start"
      gap="$4"
      p="$4"
      rounded="$4"
      borderWidth={1}
      borderColor="$borderColor"
      bg="$panel"
      flexWrap="wrap"
      rowGap="$3"
    >
      <XStack
        {...slot('featured-open')}
        {...press(onOpen)}
        aria-label={title}
        flex={1}
        minW={220}
        gap="$4"
        items="flex-start"
        cursor="pointer"
        rounded="$2"
        style={LEFT}
        focusVisibleStyle={RING}
      >
        {mark}
        <YStack flex={1} minW={0} gap="$1.5">
          <SizableText size="$1" color="$soft" textTransform="uppercase" letterSpacing={1}>
            {tag}
          </SizableText>
          <SizableText size="$6" color="$ink" numberOfLines={1}>
            {title}
          </SizableText>
          <SizableText size="$2" color="$soft" numberOfLines={3}>
            {detail}
          </SizableText>
          {meta ? (
            <SizableText size="$1" color="$soft" numberOfLines={1}>
              {meta}
            </SizableText>
          ) : null}
        </YStack>
      </XStack>
      {action}
    </XStack>
  )
}

export interface AddProps {
  /** What is added — names the control ("Add git_repos") and the check. */
  name: string
  /** It is already yours: a check, not a control. */
  added: boolean
  /** A request is in flight. */
  busy?: boolean
  onPress: () => void
}

/** A card's add control: a plus while it is not yours, a check once it is. */
export function Add({ name, added, busy, onPress }: AddProps) {
  if (added) {
    return (
      <XStack
        {...slot('add-done')}
        role="img"
        aria-label={`${name} is added`}
        width={32}
        height={32}
        items="center"
        justify="center"
        shrink={0}
      >
        <Check size={16} />
      </XStack>
    )
  }
  return (
    <Button size="icon-sm" variant="outline" aria-label={`Add ${name}`} disabled={busy} onPress={onPress}>
      <Plus size={14} />
    </Button>
  )
}
