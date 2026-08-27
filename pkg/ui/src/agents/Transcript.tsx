'use client'

/**
 * Transcript — what a run has done, as blocks.
 *
 * A streamed answer arrives one TOKEN per event, so an unfolded transcript
 * prints a sentence as a dozen mid-word cards each under its own actor line —
 * measured at four parts label to one part text. `fold()` joins consecutive
 * turns of the same kind and actor into one block with one label, and this
 * component draws blocks. The folding is exported beside it because it is the
 * same decision every surface has to make and it is pure.
 *
 * Presentational and total: an event whose payload is a shape nobody modelled
 * still renders as its own text rather than as a gap.
 */
import { ScrollView, SizableText, XStack, YStack } from '@hanzo/gui'
import { useEffect, useRef, type ComponentProps, type ReactNode } from 'react'

import { slot } from '../backends/gui/slot'

type Scroll = Omit<ComponentProps<typeof ScrollView>, 'children'>

/** The shape a transcript needs from an event. A superset is fine. */
export interface Turn {
  kind?: string
  actor?: string
  seq?: number
  id?: string
  text: string
}

/** One folded run of same-kind, same-actor turns. */
export interface Block {
  key: string
  kind: string
  actor?: string
  text: string
}

/**
 * Fold turns into blocks.
 *
 * Message tokens join with NOTHING, because each carries its own leading space
 * and re-inserting one doubles it. Every other kind joins with a newline: two
 * tool results are two facts, not one run-on sentence.
 */
export function fold(turns: Turn[]): Block[] {
  const out: { key: string; kind: string; actor?: string; parts: string[] }[] = []
  turns.forEach((turn, i) => {
    const kind = turn.kind ?? 'turn'
    const last = out[out.length - 1]
    if (last && last.kind === kind && last.actor === turn.actor) last.parts.push(turn.text)
    // Position is the fallback key and never a random one: a turn carrying
    // neither seq nor id would otherwise be keyed differently on every render,
    // so the list would grow a copy per paint.
    else out.push({ key: `${turn.seq ?? turn.id ?? i}`, kind, actor: turn.actor, parts: [turn.text] })
  })
  return out.map((b) => ({
    key: b.key,
    kind: b.kind,
    actor: b.actor,
    text: b.parts.join(b.kind === 'message' ? '' : '\n'),
  }))
}

export interface TranscriptProps extends Scroll {
  blocks: Block[]
  /** Keep the newest turn in view as the run streams. */
  follow?: boolean
  /** Drawn above the blocks — a status line, a turn count. */
  header?: ReactNode
  empty?: ReactNode
}

export function Transcript({ blocks, follow = true, header, empty, ...rest }: TranscriptProps) {
  const foot = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (follow) foot.current?.scrollIntoView({ block: 'end' })
  }, [blocks.length, follow])

  return (
    <ScrollView {...slot('transcript')} flex={1} showsVerticalScrollIndicator={false} {...rest}>
      <YStack gap="$3" p="$4">
        {header}
        {!blocks.length
          ? empty ?? (
              <SizableText size="$2" color="$soft">
                Nothing yet.
              </SizableText>
            )
          : blocks.map((block) => (
              <YStack key={block.key} gap="$1">
                <XStack gap="$2" items="center">
                  <SizableText size="$1" color="$soft">
                    {block.actor ?? block.kind}
                  </SizableText>
                  {block.actor ? (
                    <SizableText size="$1" color="$color8">
                      {block.kind}
                    </SizableText>
                  ) : null}
                </XStack>
                <SizableText size="$2" color="$quiet">
                  {block.text}
                </SizableText>
              </YStack>
            ))}
        {/* The scroll anchor. A zero-height div, because gui has no such thing. */}
        <div ref={foot} />
      </YStack>
    </ScrollView>
  )
}
