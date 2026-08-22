'use client'

/**
 * Sources — the citations for a turn, as a strip of cards.
 *
 * Each card leads with the host, which is what a reader scans to decide whether
 * they trust a source; the title is the tiebreaker under it. The strip scrolls
 * sideways so it stays one row tall at any count.
 *
 * The number matches a marker in the prose. Minting that marker belongs to the
 * markdown pipeline, which stays with the surface.
 */
import { SizableText, XStack, YStack } from '@hanzo/gui'
import type { ComponentProps, ReactNode } from 'react'

import { slot, tip } from '../backends/gui/slot'

/** Card width, px. Fixed, so a strip scans as a row rather than ragged columns. */
const CARD = 168

export interface Source {
  id: string
  /** Accessible name and tooltip — a title, repo or file path. */
  title: string
  /** Opened on press. Surfaces without navigation can omit it. */
  href?: string
  /** Favicon or mark. Falls back to the first letter of `host` or `title`. */
  icon?: ReactNode
  /**
   * Who published it — `nytimes.com`, a repo, a filename.
   *
   * Derived by the surface: a `new URL()` here would be wrong for a source that
   * is a file path rather than a link.
   */
  host?: string
}

export interface SourcesProps extends Omit<ComponentProps<typeof YStack>, 'children'> {
  sources: Source[]
  title?: string
  /** Raised on press. Given `href`, a surface may navigate instead. */
  onOpen?: (source: Source) => void
}

export function Sources({ sources, title = 'Sources', onOpen, ...props }: SourcesProps) {
  if (sources.length === 0) return null

  return (
    <YStack {...slot('sources')} gap="$2" {...props}>
      <XStack items="center" gap="$1.5">
        <SizableText size="$1" fontWeight="500" color="$soft">
          {title}
        </SizableText>
        <SizableText size="$1" color="$faint">
          {sources.length}
        </SizableText>
      </XStack>

      {/* One row at any count. `contain` keeps it from being stretched by its
          own children. */}
      <XStack
        {...slot('sources-strip')}
        overflow="scroll"
        contain="content"
        gap="$2"
        pb="$1"
      >
        {sources.map((source, i) => (
          <SourceCard key={source.id} source={source} index={i + 1} onOpen={onOpen} />
        ))}
      </XStack>
    </YStack>
  )
}

export interface SourceCardProps extends Omit<ComponentProps<typeof YStack>, 'children' | 'role'> {
  source: Source
  /** Position in the list, 1-based — the number the prose's marker refers to. */
  index?: number
  onOpen?: (source: Source) => void
}

export function SourceCard({ source, index, onOpen, ...props }: SourceCardProps) {
  const press = onOpen ? () => onOpen(source) : undefined
  const label = source.host ?? source.title

  return (
    <YStack
      {...slot('source-card')}
      width={CARD}
      shrink={0}
      gap="$1.5"
      p="$2.5"
      rounded="$4"
      borderWidth={1}
      borderColor="$borderColor"
      bg="$panel"
      cursor={press ? 'pointer' : undefined}
      onPress={press}
      role={press ? 'button' : undefined}
      tabIndex={press ? 0 : undefined}
      // One target, named by the title; the parts inside are not announced.
      aria-label={source.title}
      {...tip(source.title)}
      hoverStyle={press ? { borderColor: '$dim' } : undefined}
      pressStyle={press ? { bg: '$edge' } : undefined}
      {...props}
    >
      <XStack items="center" gap="$1.5">
        {index != null ? (
          <SizableText size="$1" color="$faint">
            {index}
          </SizableText>
        ) : null}
        <XStack
          width={14}
          height={14}
          shrink={0}
          items="center"
          justify="center"
          rounded="$1"
          overflow="hidden"
          bg="$edge"
        >
          {source.icon ?? (
            <SizableText size="$1" color="$quiet">
              {label.charAt(0).toUpperCase()}
            </SizableText>
          )}
        </XStack>
        <SizableText size="$1" color="$soft" numberOfLines={1}>
          {label}
        </SizableText>
      </XStack>

      {/* The tiebreaker under the host, not the thing being read. */}
      <SizableText size="$1" color="$ink" numberOfLines={3}>
        {source.title}
      </SizableText>
    </YStack>
  )
}
