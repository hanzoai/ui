'use client'

/**
 * A repository, and the small counts that describe it.
 *
 *   Repo       a card: its name, a line on it, its counts and language, and the
 *              actions the caller puts at its foot; the whole card is a link when
 *              it is given an `href`
 *   Counts     stars and forks, each with its mark; a count the caller does not
 *              hold is not drawn
 *   Languages  the share of each language as one bar and a legend
 *   Faces      people as overlapping initials, with the rest counted
 *
 * Each takes its data as props and fetches nothing, draws from tokens, and is a
 * gui element, so one import serves web, native and desktop.
 */
import type { ReactNode } from 'react'
import { Text, View, XStack, YStack } from '@hanzo/gui'
import { GitFork, Star } from '@hanzogui/lucide-icons-2'

import { slot } from '../backends/gui/slot'

/** A fill the colour table does not name: a page's own CSS value, which gui emits as written. */
const fill = (c: string) => ({ backgroundColor: c }) as object

const group = (n: number) => n.toLocaleString('en-US')
const real = (n: number | undefined): n is number =>
  typeof n === 'number' && Number.isFinite(n) && n >= 0

export type CountsProps = {
  stars?: number
  forks?: number
  /** The size of the marks and figures. */
  size?: 'sm' | 'md'
}

export function Counts({ stars, forks, size = 'md' }: CountsProps) {
  const icon = size === 'sm' ? 12 : 14
  const one = (n: number, mark: ReactNode, name: string) => (
    <XStack key={name} items="center" gap={4} {...slot(`count-${name}`)}>
      {mark}
      <Text
        fontFamily="$mono"
        fontSize={size === 'sm' ? '$1' : '$2'}
        color="var(--muted-foreground)"
        fontVariant={['tabular-nums']}
        aria-label={`${group(n)} ${name}`}
      >
        {group(n)}
      </Text>
    </XStack>
  )
  const shown = [
    real(stars)
      ? one(
          stars,
          <Star size={icon} color="var(--muted-foreground)" aria-hidden />,
          'stars'
        )
      : null,
    real(forks)
      ? one(
          forks,
          <GitFork size={icon} color="var(--muted-foreground)" aria-hidden />,
          'forks'
        )
      : null,
  ].filter(Boolean)
  if (!shown.length) return null
  return (
    <XStack items="center" gap={12} {...slot('counts')}>
      {shown}
    </XStack>
  )
}

export type RepoProps = {
  /** `owner/name`. */
  name: string
  description?: ReactNode
  /** Where the card goes; with none the card is not a link. */
  href?: string
  target?: string
  rel?: string
  language?: ReactNode
  /** A word that files the repository, in an outline beside the counts. */
  tag?: ReactNode
  stars?: number
  forks?: number
  /** What sits at the card's foot: a star button, a link. */
  actions?: ReactNode
}

export function Repo({
  name,
  description,
  href,
  target,
  rel,
  language,
  tag,
  stars,
  forks,
  actions,
}: RepoProps) {
  const linked = href != null
  return (
    <YStack
      {...slot('repo')}
      gap={10}
      p={16}
      rounded="var(--radius-xl)"
      borderWidth={1}
      borderColor="var(--border)"
      {...fill('var(--surface-card)')}
      {...(linked
        ? { hoverStyle: { borderColor: 'var(--border-strong)' } }
        : null)}
      minW={0}
    >
      <YStack
        gap={6}
        grow={1}
        shrink={0}
        {...(linked
          ? {
              render: <a href={href} target={target} rel={rel} />,
              textDecorationLine: 'none',
            }
          : null)}
      >
        <Text
          fontFamily="$mono"
          fontSize="$2"
          fontWeight="600"
          color="var(--foreground)"
          numberOfLines={1}
          data-i18n-ltr=""
        >
          {name}
        </Text>
        {description ? (
          <Text
            fontSize="$2"
            lineHeight="$3"
            color="var(--muted-foreground)"
            numberOfLines={2}
            minH={38}
          >
            {description}
          </Text>
        ) : null}
      </YStack>
      <XStack items="center" justify="space-between" gap={8} flexWrap="wrap">
        <XStack items="center" gap={12}>
          {language ? (
            <Text
              fontFamily="$mono"
              fontSize="$1"
              color="var(--muted-foreground)"
            >
              {language}
            </Text>
          ) : null}
          {tag ? (
            <Text
              fontFamily="$mono"
              fontSize="$1"
              color="var(--muted-foreground)"
              px={6}
              py={1}
              rounded={4}
              borderWidth={1}
              borderColor="var(--border)"
            >
              {tag}
            </Text>
          ) : null}
          <Counts stars={stars} forks={forks} size="sm" />
        </XStack>
        {actions}
      </XStack>
    </YStack>
  )
}

export type LanguagesProps = {
  /** Each language and its share, any scale: the bar is each over the sum. */
  share: readonly { name: string; share: number }[]
  /** What the bar says to a reader who cannot see it. */
  label: string
}

/** Four inks cycle down the shares, so neighbours differ in the page's own monochrome. */
const SHARE = [
  'var(--foreground)',
  'color-mix(in srgb, var(--foreground) 62%, transparent)',
  'color-mix(in srgb, var(--foreground) 36%, transparent)',
  'color-mix(in srgb, var(--foreground) 18%, transparent)',
] as const

export function Languages({ share, label }: LanguagesProps) {
  const rows = share.filter((s) => s.share > 0)
  const total = rows.reduce((n, s) => n + s.share, 0)
  if (!total) return null
  return (
    <YStack gap={8} {...slot('languages')}>
      <XStack
        role="img"
        aria-label={label}
        height={8}
        rounded={9999}
        overflow="hidden"
        gap={2}
      >
        {rows.map((s, i) => (
          <View
            key={s.name}
            height="100%"
            width={`${((100 * s.share) / total).toFixed(2)}%` as never}
            {...fill(SHARE[i % SHARE.length])}
          />
        ))}
      </XStack>
      <XStack gap={14} flexWrap="wrap">
        {rows.map((s, i) => (
          <XStack key={s.name} items="center" gap={6}>
            <View
              width={8}
              height={8}
              rounded={9999}
              {...fill(SHARE[i % SHARE.length])}
            />
            <Text
              fontFamily="$mono"
              fontSize="$1"
              color="var(--muted-foreground)"
            >
              {s.name} {((100 * s.share) / total).toFixed(1)}%
            </Text>
          </XStack>
        ))}
      </XStack>
    </YStack>
  )
}

export type FacesProps = {
  /** Each person by the name their initials are read from. */
  people: readonly { name: string }[]
  /** How many are drawn; the rest are counted. */
  max?: number
}

/** Up to two initials of a name. */
export const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => Array.from(w)[0] ?? '')
    .join('')
    .toUpperCase()

export function Faces({ people, max = 5 }: FacesProps) {
  if (!people.length) return null
  const shown = people.slice(0, max)
  const more = people.length - shown.length
  return (
    <XStack items="center" {...slot('faces')}>
      {shown.map((p, i) => (
        <View
          key={`${p.name}-${i}`}
          width={28}
          height={28}
          rounded={9999}
          items="center"
          justify="center"
          borderWidth={2}
          borderColor="var(--background)"
          {...fill('var(--secondary)')}
          ml={i ? -8 : 0}
          {...{ title: p.name }}
        >
          <Text
            fontFamily="$mono"
            fontSize="$1"
            fontWeight="600"
            color="var(--foreground)"
          >
            {initials(p.name)}
          </Text>
        </View>
      ))}
      {more > 0 ? (
        <Text
          fontFamily="$mono"
          fontSize="$1"
          color="var(--muted-foreground)"
          ml={8}
        >
          +{group(more)}
        </Text>
      ) : null}
    </XStack>
  )
}
