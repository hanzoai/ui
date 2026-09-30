'use client'

/**
 * Disclosure — a row that opens to show more, on the platform's own element.
 *
 * It is a `<details>`. That is the whole point, and the reason `Accordion` and
 * `Collapsible` are not used for a page of questions: those mount closed content
 * only when it is open, so a crawler, a reader with scripts off and a print
 * stylesheet all meet a list of headings with nothing under them. A closed
 * `<details>` keeps its answer in the document, paints none of it, and opens
 * with no script at all; the keyboard and the accessibility tree are the
 * browser's.
 *
 * Script adds one thing: the plus turns into a minus while the row is open, and
 * `onOpenChange` hears each change (the analytics hook). Without script the
 * plus stays a plus and the row still opens.
 *
 * `display: flex` on the summary is what removes the UA's triangle, in every
 * engine that matters; nothing here needs a stylesheet.
 */
import { Text, XStack, YStack } from '@hanzo/gui'
import { Minus, Plus } from '@hanzogui/lucide-icons-2'
import { useState, type ComponentProps, type ReactNode } from 'react'
import { slot } from './slot'

const ROW_MIN_H = 44
const ICON = 16

export type DisclosureProps = Omit<ComponentProps<typeof YStack>, 'children' | 'onToggle'> & {
  /** The row's label, always visible. */
  summary: ReactNode
  /** What opens. Rendered in the document whether or not the row is open. */
  children: ReactNode
  /** Open on first paint. */
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

const Disclosure = ({ summary, children, defaultOpen = false, onOpenChange, ...p }: DisclosureProps) => {
  const [open, setOpen] = useState(defaultOpen)
  const Icon = open ? Minus : Plus
  return (
    <YStack
      {...slot('disclosure')}
      render="details"
      borderBottomWidth={1}
      borderColor="$edge"
      {...(defaultOpen ? { open: true } : {})}
      onToggle={(e: { currentTarget: { open: boolean } }) => {
        const next = e.currentTarget.open
        setOpen(next)
        onOpenChange?.(next)
      }}
      {...(p as object)}
    >
      <XStack
        {...slot('disclosure-summary')}
        render="summary"
        display="flex"
        items="center"
        justify="space-between"
        gap="$4"
        minH={ROW_MIN_H}
        py="$4"
        cursor="pointer"
        hoverStyle={{ bg: '$panel' }}
      >
        {typeof summary === 'string' ? (
          <Text flex={1} fontSize="$5" fontWeight="497" color="$ink">
            {summary}
          </Text>
        ) : (
          summary
        )}
        <XStack {...slot('disclosure-icon')} shrink={0} aria-hidden="true">
          <Icon size={ICON} color="$quiet" />
        </XStack>
      </XStack>
      <YStack {...slot('disclosure-content')} pb="$5">
        {children}
      </YStack>
    </YStack>
  )
}

export { Disclosure }
