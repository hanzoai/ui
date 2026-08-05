'use client'

/**
 * Code — a labelled, copyable code region.
 *
 * The language label and the controls live in a bar above the code, never
 * floating over it: an overlaid copy button covers the first line, which is
 * where the prompt or the import sits and the part most often being read.
 *
 * Highlighting is not here. Surfaces disagree on the highlighter (and on whether
 * they want one at all), and a package that picked would either impose a large
 * dependency or be bypassed. `children` is rendered as-is, so a surface can pass
 * plain text or its own highlighted nodes.
 */
import { SizableText, XStack, YStack } from '@hanzo/gui'
import { type ReactNode } from 'react'

import { slot } from '../backends/gui/slot'
import { CopyButton } from '../product/CopyButton'

/**
 * Monospace stack, applied through `style` rather than a `$mono` token.
 *
 * There is no mono family in the token set — only `$body` and `$heading` — so a
 * `fontFamily="$mono"` would not typecheck, and picking `$body` would set code
 * in a proportional face, where columns stop aligning and l/1/I stop being
 * distinguishable. The CSS variable is honoured when the host defines Geist
 * Mono and falls back to the platform's own monospace when it does not.
 */
const MONO = {
  fontFamily: 'var(--font-geist-mono, ui-monospace, SFMono-Regular, Menlo, monospace)',
} as const

export interface CodeProps {
  children?: ReactNode
  /** Shown in the label bar. */
  language?: string
  /** Raw text for the copy control. Falls back to `children` when it is a string. */
  value?: string
  /** Extra controls in the label bar, before copy. */
  actions?: ReactNode
}

export function Code({ children, language = 'text', value, actions }: CodeProps) {
  const text = value ?? (typeof children === 'string' ? children : '')

  return (
    <YStack
      {...slot('code')}
      width="100%"
      rounded="$4"
      borderWidth={1}
      borderColor="$borderColor"
      bg="$color2"
      overflow="hidden"
    >
      <XStack
        items="center"
        gap="$1"
        px="$3"
        py="$1.5"
        borderBottomWidth={1}
        borderColor="$borderColor"
      >
        <SizableText size="$1" style={MONO} color="$color10">
          {language}
        </SizableText>
        <XStack flex={1} />
        {actions}
        {text ? <CopyButton value={text} /> : null}
      </XStack>

      <YStack px="$3" py="$2.5">
        <SizableText size="$1" style={MONO} lineHeight={20}>
          {children}
        </SizableText>
      </YStack>
    </YStack>
  )
}
