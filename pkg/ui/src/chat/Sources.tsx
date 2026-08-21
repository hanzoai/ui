'use client'

/**
 * Sources — the citations for a turn, as a strip of cards.
 *
 * This used to be a wrapping grid of 28px marks with the title reachable only
 * as a tooltip, and the argument for it was density: sources are scanned for
 * "which of these do I already trust", and twenty full-width titles push the
 * rail past a screen. The density argument is right. Hiding the HOST was not,
 * because the host is the answer to that exact question — a favicon is sixteen
 * pixels of ambiguity and `nytimes.com` is a verdict — and neither surface that
 * ships citations hides it. hanzo/chat's `SourceItem` (`components/Web/
 * Sources.tsx`) draws favicon, domain, title and a snippet; the extension's
 * `answer/Source.tsx:9-26` draws a number, a favicon, the host and a
 * three-line-clamped title, and its own comment records where that came from:
 * "Source card — chat AnswerView: 160px, number pill first, favicon, host,
 * 3-line title".
 *
 * So density is kept by scrolling sideways rather than by discarding the text —
 * the strip is one row tall whatever the count, which is what the grid was
 * really buying. Both surfaces already scroll: `.ae-sources` is
 * `display:flex; overflow-x:auto` at `newtab.css:260`.
 *
 * The number is not decoration. Both surfaces number the cards to match a
 * marker in the prose, and the marker itself is not here: chat mints it with a
 * remark plugin over private-use codepoints (`components/Web/plugin.ts`), which
 * belongs to the markdown pipeline that stays with the surface.
 */
import { SizableText, XStack, YStack } from '@hanzo/gui'
import type { ComponentProps, ReactNode } from 'react'

import { slot, tip } from '../backends/gui/slot'

/** Card width, px. The extension's is 168 and it cites chat's 160; the point of
 *  a fixed width is that a strip of them scans as a row rather than as ragged
 *  columns, so it is one number and not a range. */
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
   * Who published it — `nytimes.com`, a repo, a filename. Shown above the
   * title, because this is the line a reader actually scans.
   *
   * Derived by the SURFACE, not here. The extension parses it from the URL and
   * strips `www.` (`Source.tsx:10-15`); chat is handed a domain by the server
   * alongside a server-derived favicon. A `new URL()` in this package would be
   * a third answer, and it would be the wrong one for a source that is a file
   * path rather than a link.
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
        <SizableText size="$1" fontWeight="500" color="$color10">
          {title}
        </SizableText>
        <SizableText size="$1" color="$color9">
          {sources.length}
        </SizableText>
      </XStack>

      {/*
        Sideways, not wrapped. A wrapping grid of twenty cards is a block that
        grows down the page and pushes the prose the citations belong to off
        screen; a strip is one row tall at any count. `contain: 'content'` keeps
        the row from being stretched by its own children.
      */}
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
      bg="$color2"
      cursor={press ? 'pointer' : undefined}
      onPress={press}
      role={press ? 'button' : undefined}
      tabIndex={press ? 0 : undefined}
      // The whole card is one target, so its name is the title and the parts
      // inside it are not separately announced.
      aria-label={source.title}
      {...tip(source.title)}
      hoverStyle={press ? { borderColor: '$color8' } : undefined}
      pressStyle={press ? { bg: '$color4' } : undefined}
      {...props}
    >
      <XStack items="center" gap="$1.5">
        {index != null ? (
          <SizableText size="$1" color="$color9">
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
          bg="$color4"
        >
          {source.icon ?? (
            <SizableText size="$1" color="$color11">
              {label.charAt(0).toUpperCase()}
            </SizableText>
          )}
        </XStack>
        <SizableText size="$1" color="$color10" numberOfLines={1}>
          {label}
        </SizableText>
      </XStack>

      {/* Clamped at three, which is what the extension settled on. A title is
          the tiebreaker after the host, not the thing being read. */}
      <SizableText size="$1" color="$color12" numberOfLines={3}>
        {source.title}
      </SizableText>
    </YStack>
  )
}
