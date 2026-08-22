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
import { ScrollView, SizableText, XStack, YStack } from '@hanzo/gui'
import { type ComponentProps, type ReactNode } from 'react'

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

export interface CodeProps extends Omit<ComponentProps<typeof YStack>, 'children'> {
  children?: ReactNode
  /** Shown in the label bar. */
  language?: string
  /** Raw text for the copy control. Falls back to `children` when it is a string. */
  value?: string
  /** Extra controls in the label bar, before copy. */
  actions?: ReactNode
}

export function Code({ children, language = 'text', value, actions, ...props }: CodeProps) {
  const text = value ?? (typeof children === 'string' ? children : '')

  return (
    <YStack
      {...slot('code')}
      width="100%"
      rounded="$4"
      borderWidth={1}
      borderColor="$borderColor"
      bg="$panel"
      overflow="hidden"
      {...props}
    >
      <XStack
        items="center"
        gap="$1"
        px="$3"
        py="$1.5"
        borderBottomWidth={1}
        borderColor="$borderColor"
      >
        {/* `$quiet`, not `$soft`. The label sits on `$panel` at 11px, and
            `$soft` measures 2.97:1 there — under WCAG's 4.5:1 for body text
            and under even the 3:1 large-text floor this is too small to claim.
            `$quiet` is the ramp's readable secondary and clears it. The bar is
            chrome, so it stays quieter than the code; quiet is a rung, not an
            excuse to be unreadable. */}
        <SizableText size="$1" style={MONO} color="$quiet">
          {language}
        </SizableText>
        <XStack flex={1} />
        {actions}
        {text ? <CopyButton value={text} /> : null}
      </XStack>

      {/*
        A long line scrolls; it does not wrap and it does not disappear.

        The frame carries `overflow="hidden"` so the corners stay round, which
        on its own CLIPS anything wider than the block — and code is the one
        content type where the interesting part is regularly past column 80 (a
        curl with a URL, a stack frame, a one-line pipeline). Both surfaces that
        style a code block reach for the same rule: hanzo.app's `.md pre`
        (`assets/globals.css:1370`) and the extension's `.ae-widget-example`
        (`newtab.css:419`) are each `overflow-x: auto`. A horizontal ScrollView
        is that rule spelled so it also holds on native, where there is no
        overflow property to set.
      */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <YStack px="$3" py="$2.5">
          <SizableText size="$1" style={MONO} lineHeight={20}>
            {children}
          </SizableText>
        </YStack>
      </ScrollView>
    </YStack>
  )
}
