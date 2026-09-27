'use client'

/**
 * What a settings section is drawn from, so every section reads as one page:
 *
 *   Heading   the section's title, what it is for, and its one action
 *   Group     a small title over a run of rows or fields
 *   Card      a bordered list; its `Row`s draw the rules between them
 *   Row       one thing in a Card: what it is, a line about it, what can be done
 *   Field     a labelled control, with a line under it when there is more to say
 *   Soft      the quiet line for empty, loading, signed-out and refused
 *   Note      what the last action did, said once, where it was done
 *   Once      a credential the platform shows once: the value, and a copy
 *
 * Presentational. Every string is the host's; nothing here fetches or decides.
 */
import { SizableText, XStack, YStack } from '@hanzo/gui'
import type { ReactNode } from 'react'

import { slot } from '../backends/gui/slot'
import { CopyButton } from '../product/CopyButton'

export interface HeadingProps {
  title: string
  /** One or two lines on what the section is for. */
  detail?: string
  /** The section's one action — an Add, a Save. */
  action?: ReactNode
  /** The heading's outline level. The page's own title is the nav's, so 2. */
  level?: 1 | 2 | 3
}

/** A section's title, what it is for, and its one action. */
export function Heading({ title, detail, action, level = 2 }: HeadingProps) {
  return (
    <XStack {...slot('settings-heading')} items="flex-start" gap="$3">
      <YStack flex={1} minW={0} gap="$1">
        <SizableText role="heading" aria-level={level} size="$6" color="$ink">
          {title}
        </SizableText>
        {detail ? (
          <SizableText size="$2" color="$soft">
            {detail}
          </SizableText>
        ) : null}
      </YStack>
      {action}
    </XStack>
  )
}

export interface GroupProps {
  title: string
  detail?: string
  action?: ReactNode
  /** One level under the section's `Heading`. */
  level?: 2 | 3 | 4
  children: ReactNode
}

/** A group inside a section: a small title over what it holds. */
export function Group({ title, detail, action, level = 3, children }: GroupProps) {
  return (
    <YStack {...slot('settings-group')} gap="$2">
      <XStack items="center" gap="$2">
        <YStack flex={1} minW={0} gap="$0.5">
          <SizableText role="heading" aria-level={level} size="$3" color="$ink">
            {title}
          </SizableText>
          {detail ? (
            <SizableText size="$1" color="$soft">
              {detail}
            </SizableText>
          ) : null}
        </YStack>
        {action}
      </XStack>
      {children}
    </YStack>
  )
}

/**
 * A bordered box of rows. Its rows draw the rules between them; the first says
 * `first`. It holds what a section needs in one frame — `Row`s, a form line, a
 * `Soft` — so it claims no list role its children would have to live up to.
 */
export function Card({ children }: { children: ReactNode }) {
  return (
    <YStack
      {...slot('settings-card')}
      borderWidth={1}
      borderColor="$borderColor"
      rounded="$3"
      overflow="hidden"
    >
      {children}
    </YStack>
  )
}

export interface RowProps {
  title: string
  detail?: string
  /** Before the words — a mark, an icon, a status. */
  leading?: ReactNode
  /** After them — what can be done to this row. */
  trailing?: ReactNode
  /** The Card's first row draws no rule above itself. */
  first?: boolean
  /** The title is an identifier — a key name, a path — and is set in `$mono`. */
  mono?: boolean
}

/** One row of a Card: what it is, a line about it, and what can be done to it. */
export function Row({ title, detail, leading, trailing, first, mono }: RowProps) {
  return (
    <XStack
      {...slot('settings-row')}
      items="center"
      gap="$3"
      px="$3"
      py="$2.5"
      borderTopWidth={first ? 0 : 1}
      borderColor="$borderColor"
    >
      {leading}
      <YStack flex={1} minW={0} gap="$0.5">
        <SizableText size="$2" color="$ink" numberOfLines={1} fontFamily={mono ? '$mono' : undefined}>
          {title}
        </SizableText>
        {detail ? (
          <SizableText size="$1" color="$soft" numberOfLines={2}>
            {detail}
          </SizableText>
        ) : null}
      </YStack>
      {trailing}
    </XStack>
  )
}

/** A labelled control, with a line under it when there is more to say. */
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <YStack {...slot('settings-field')} gap="$1.5">
      <SizableText size="$2" color="$ink">
        {label}
      </SizableText>
      {children}
      {hint ? (
        <SizableText size="$1" color="$soft">
          {hint}
        </SizableText>
      ) : null}
    </YStack>
  )
}

/** The quiet line for empty, loading, signed-out and refused — and the one thing to do about it. */
export function Soft({ children, action }: { children: string; action?: ReactNode }) {
  return (
    <YStack {...slot('settings-soft')} py="$5" items="center" gap="$3">
      <SizableText size="$2" color="$soft" text="center">
        {children}
      </SizableText>
      {action}
    </YStack>
  )
}

/** What the last action did, said once, where it was done. Empty, it draws nothing. */
export function Note({ children }: { children: string }) {
  if (!children) return null
  return (
    <SizableText {...slot('settings-note')} size="$1" color="$soft" role="status">
      {children}
    </SizableText>
  )
}

export interface OnceProps {
  /** The credential. */
  value: string
  /** What it is — "API key". Names the value and its copy control. */
  label: string
  /** The line under it. */
  says?: string
  /** What follows — a Done. */
  children?: ReactNode
}

/** A credential the platform answers once: the value to copy, and what it is for. */
export function Once({ value, label, says = 'Copy it now. It is not shown again.', children }: OnceProps) {
  return (
    <YStack
      {...slot('settings-once')}
      gap="$2"
      px="$3"
      py="$3"
      rounded="$3"
      borderWidth={1}
      borderColor="$borderColor"
      bg="$raised"
    >
      <XStack items="center" gap="$2">
        <SizableText
          flex={1}
          minW={0}
          size="$2"
          color="$ink"
          fontFamily="$mono"
          aria-label={label}
          style={{ wordBreak: 'break-all' }}
        >
          {value}
        </SizableText>
        <CopyButton value={value} label={`Copy ${label.toLowerCase()}`} />
      </XStack>
      <SizableText size="$1" color="$soft">
        {says}
      </SizableText>
      {children}
    </YStack>
  )
}
