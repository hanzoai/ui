'use client'

/**
 * Suggestions — the row of asks above the composer, and a way to put it away.
 *
 * Ported from build-v2 `components/editor/ask-ai` (the "Review security ·
 * Review SEO · Improve accessibility" chips) (MIT, derived from OSW Studio and
 * DeepSite — see NOTICE). A chip SENDS its words as the next turn in whatever
 * mode the composer is in — it does not fill the box and wait — which is what
 * v2 settled on, so `onPick` hands the words out and the host sends them.
 *
 * The row scrolls sideways rather than wrapping or widening its column: three
 * chips must not push a phone's composer off the bottom or its page sideways.
 */
import { ScrollView, SizableText, XStack } from '@hanzo/gui'
import { X } from '@hanzogui/lucide-icons-2'
import type { ComponentProps } from 'react'

import { Button } from '../backends/gui/button'
import { slot } from '../backends/gui/slot'

type Row = Omit<ComponentProps<typeof XStack>, 'children'>

/** v2's three, for a host that has nothing more specific to offer. */
export const SUGGESTIONS: readonly string[] = ['Review security', 'Review SEO', 'Improve accessibility']

export interface SuggestionsProps extends Row {
  items: readonly string[]
  onPick: (item: string) => void
  /** Omit and the row cannot be dismissed. */
  onDismiss?: () => void
  /** The group's accessible name. */
  label?: string
}

export function Suggestions({ items, onPick, onDismiss, label = 'Suggestions', ...rest }: SuggestionsProps) {
  if (items.length === 0) return null
  return (
    <XStack {...slot('suggestions')} role="group" aria-label={label} items="center" gap="$1.5" minW={0} {...rest}>
      <ScrollView horizontal flex={1} minW={0} showsHorizontalScrollIndicator={false}>
        <XStack gap="$1.5" items="center">
          {items.map((item) => (
            <Button
              key={item}
              type="button"
              variant="outline"
              size="sm"
              minHeight={24}
              px="$2.5"
              rounded={999}
              bg="transparent"
              onClick={() => onPick(item)}
            >
              <SizableText size="$1" color="$quiet" numberOfLines={1}>
                {item}
              </SizableText>
            </Button>
          ))}
        </XStack>
      </ScrollView>
      {onDismiss ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          minHeight={24}
          minWidth={24}
          aria-label={`Hide ${label.toLowerCase()}`}
          title={`Hide ${label.toLowerCase()}`}
          onClick={onDismiss}
        >
          <X size={13} />
        </Button>
      ) : null}
    </XStack>
  )
}
