'use client'

/**
 * Steer — the controls that reach a run mid-flight, and the roster row.
 *
 * A command is QUEUED, not applied: an agent reads it between turns, so the
 * label a person sees after pressing has to say that. A control that reports
 * "stopped" the instant it is pressed is lying for however long the current
 * turn takes.
 *
 * Presentational: the verbs go out through `onCommand` and the surface decides
 * what they mean. `@hanzo/ai`'s `sessions.steer(id, command)` is the one it
 * wants, but this row does not import it — a channel workspace steering through
 * a BFF composes the same control.
 */
import { SizableText, XStack, YStack } from '@hanzo/gui'
import { Bot, Pause, Play, Square, User, Zap } from '@hanzogui/lucide-icons-2'
import type { ComponentProps, ReactNode } from 'react'

import { slot, tip } from '../backends/gui/slot'

type Row = Omit<ComponentProps<typeof XStack>, 'children'>

/** The verbs a run understands. `message` is the composer's, not a button's. */
export type Command = 'pause' | 'resume' | 'stop'

const CONTROLS: { command: Command; label: string; icon: typeof Pause }[] = [
  { command: 'pause', label: 'Pause', icon: Pause },
  { command: 'resume', label: 'Resume', icon: Play },
  { command: 'stop', label: 'Stop', icon: Square },
]

export interface SteerProps extends Row {
  onCommand?: (command: Command) => void
  /**
   * Verbs to withhold — a finished run cannot be paused.
   *
   * NOT `disabled`: that is gui's own boolean on the underlying stack, and
   * taking the name means the row and the primitive disagree about the type of
   * one prop.
   */
  withhold?: Command[]
  /** The last thing that happened, in the surface's words. */
  note?: ReactNode
}

export function Steer({ onCommand, withhold = [], note, ...rest }: SteerProps) {
  return (
    <YStack {...slot('steer')} gap="$1">
      <XStack gap="$1" items="center" {...rest}>
        {CONTROLS.map(({ command, label, icon: Icon }) => {
          const off = withhold.includes(command)
          return (
            <XStack
              key={command}
              items="center"
              gap="$1.5"
              px="$2"
              py="$1"
              rounded="$3"
              opacity={off ? 0.4 : 0.8}
              cursor={off ? 'default' : 'pointer'}
              role="button"
              tabIndex={off ? -1 : 0}
              aria-disabled={off}
              aria-label={label}
              {...tip(label)}
              hoverStyle={off ? undefined : { bg: '$hover', opacity: 1 }}
              pressStyle={off ? undefined : { bg: '$raised' }}
              onPress={() => !off && onCommand?.(command)}
            >
              <Icon size={13} />
              <SizableText size="$1">{label}</SizableText>
            </XStack>
          )
        })}
      </XStack>
      {note ? (
        <SizableText size="$1" color="$soft">
          {note}
        </SizableText>
      ) : null}
    </YStack>
  )
}

/**
 * The three kinds of member, and why one row draws all three.
 *
 * An AGENT is summoned and lives for a session. A BOT is the same thing left
 * running — it is present before anyone asks and after everyone leaves, which
 * is the whole difference and the only one a reader needs. A HUMAN is a person.
 *
 * One component with a `kind` prop rather than three, because the three differ
 * in a badge and an icon; three components is how the hover state comes to
 * differ too.
 */
export type MemberKind = 'agent' | 'bot' | 'human'

const KIND: Record<MemberKind, { icon: typeof Bot; says: string }> = {
  agent: { icon: Zap, says: 'agent' },
  bot: { icon: Bot, says: 'always on' },
  human: { icon: User, says: 'person' },
}

export interface MemberRowProps extends Row {
  name: string
  kind: MemberKind
  /** A line under the name — what it does, or where it is. */
  detail?: string
  onPress?: () => void
}

export function MemberRow({ name, kind, detail, onPress, ...rest }: MemberRowProps) {
  const { icon: Icon, says } = KIND[kind]
  return (
    <XStack
      {...slot('member-row')}
      items="center"
      gap="$2"
      px="$2"
      py="$1.5"
      rounded="$3"
      cursor={onPress ? 'pointer' : 'default'}
      role={onPress ? 'button' : undefined}
      tabIndex={onPress ? 0 : undefined}
      hoverStyle={onPress ? { bg: '$hover' } : undefined}
      onPress={onPress}
      {...rest}
    >
      <XStack
        width={22}
        height={22}
        rounded={9999}
        items="center"
        justify="center"
        bg="$raised"
        shrink={0}
      >
        <Icon size={12} />
      </XStack>
      <YStack flex={1} shrink={1}>
        <SizableText size="$2" numberOfLines={1}>
          {name}
        </SizableText>
        {detail ? (
          <SizableText size="$1" color="$soft" numberOfLines={1}>
            {detail}
          </SizableText>
        ) : null}
      </YStack>
      {/* The kind has to be legible without hovering — a bot reads as always-on. */}
      <SizableText size="$1" color="$color8">
        {says}
      </SizableText>
    </XStack>
  )
}
