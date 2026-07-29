'use client'

/**
 * Sources — the citation grid for a turn.
 *
 * A dense grid of marks rather than a list of titles. Sources are scanned for
 * "which of these do I already trust", and twenty full-width titles would push
 * the rail well past a screen. Each mark keeps its title as accessible name and
 * tooltip, so the information is reordered, not discarded.
 */
import { SizableText, XStack, YStack } from '@hanzo/gui'
import type { ReactNode } from 'react'

import { slot, tip } from '../backends/gui/slot'

export interface Source {
  id: string
  /** Accessible name and tooltip — a title, repo or file path. */
  title: string
  /** Opened on press. Surfaces without navigation can omit it. */
  href?: string
  /** Favicon or mark. Falls back to the first letter of `title`. */
  icon?: ReactNode
}

export interface SourcesProps {
  sources: Source[]
  title?: string
  /** Raised on press. Given `href`, a surface may navigate instead. */
  onOpen?: (source: Source) => void
}

export function Sources({ sources, title = 'Sources', onOpen }: SourcesProps) {
  if (sources.length === 0) return null

  return (
    <YStack {...slot('sources')} gap="$2" p="$3" rounded="$4" borderWidth={1} borderColor="$borderColor">
      <XStack items="center" gap="$1.5">
        <SizableText size="$1" fontWeight="500" color="$color10">
          {title}
        </SizableText>
        <SizableText size="$1" color="$color9">
          {sources.length}
        </SizableText>
      </XStack>

      <XStack flexWrap="wrap" gap="$1.5">
        {sources.map((source) => (
          <SourceChip key={source.id} source={source} onOpen={onOpen} />
        ))}
      </XStack>
    </YStack>
  )
}

export interface SourceChipProps {
  source: Source
  onOpen?: (source: Source) => void
}

export function SourceChip({ source, onOpen }: SourceChipProps) {
  const press = onOpen ? () => onOpen(source) : undefined

  return (
    <XStack
      {...slot('source-chip')}
      width={28}
      height={28}
      items="center"
      justify="center"
      rounded="$3"
      borderWidth={1}
      borderColor="$borderColor"
      bg="$color3"
      overflow="hidden"
      cursor={press ? 'pointer' : undefined}
      onPress={press}
      role={press ? 'button' : undefined}
      tabIndex={press ? 0 : undefined}
      aria-label={source.title}
      {...tip(source.title)}
      hoverStyle={press ? { borderColor: '$color8' } : undefined}
      pressStyle={press ? { bg: '$color5' } : undefined}
    >
      {source.icon ?? (
        <SizableText size="$1" color="$color11">
          {source.title.charAt(0).toUpperCase()}
        </SizableText>
      )}
    </XStack>
  )
}
