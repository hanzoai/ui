'use client'

/**
 * Spotlight — a macOS-style search dialog: type to filter a flat list of
 * items grouped by category, arrow keys move the cursor, Enter runs the
 * highlighted row, Escape or a backdrop click closes it.
 *
 * The search, the grouping, the cursor and the keyboard bindings are not
 * reimplemented here — they are `Command`'s, the same state machine the
 * command palette runs on. This file is composition: a `CommandDialog` wired
 * to `isOpen`/`onClose`, with `SpotlightItem`s spread across `CommandGroup`s.
 */
import { useMemo, type ReactNode } from 'react'
import { SizableText, XStack, YStack } from '@hanzo/gui'
import { Search as SearchIcon } from '@hanzogui/lucide-icons-2'

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './command'

export interface SpotlightItem {
  id: string
  title: string
  subtitle?: string
  icon?: ReactNode
  category?: string
  keywords?: string[]
  action?: () => void
}

export interface SpotlightProps {
  /** Controls visibility of the spotlight dialog. */
  isOpen: boolean
  /** Called when the spotlight is closed — Escape, backdrop, or a selection. */
  onClose: () => void
  /** The searchable items, in the order groups should fall when unfiltered. */
  items?: SpotlightItem[]
  /** Called with the picked item, after its own `action` (if any) runs. */
  onSelect?: (item: SpotlightItem) => void
  /** Search input placeholder text. */
  placeholder?: string
}

const NO_CATEGORY = 'Results'

/** Items in first-seen category order — the grouping `Object.entries` alone won't give. */
function groupByCategory(items: SpotlightItem[]) {
  const order: string[] = []
  const groups = new Map<string, SpotlightItem[]>()
  for (const item of items) {
    const category = item.category || NO_CATEGORY
    if (!groups.has(category)) {
      groups.set(category, [])
      order.push(category)
    }
    groups.get(category)!.push(item)
  }
  return order.map((category) => [category, groups.get(category)!] as const)
}

export function Spotlight({
  isOpen,
  onClose,
  items = [],
  onSelect,
  placeholder = 'Search...',
}: SpotlightProps) {
  const groups = useMemo(() => groupByCategory(items), [items])

  const pick = (item: SpotlightItem) => {
    item.action?.()
    onSelect?.(item)
    onClose()
  }

  return (
    <CommandDialog
      data-slot="spotlight"
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title="Spotlight"
      description={placeholder}
    >
      <CommandInput placeholder={placeholder} autoFocus />
      <CommandList>
        <CommandEmpty>No results found</CommandEmpty>
        {groups.map(([category, categoryItems]) => (
          <CommandGroup key={category} heading={category}>
            {categoryItems.map((item) => (
              <CommandItem
                key={item.id}
                data-slot="spotlight-item"
                value={item.title}
                keywords={item.keywords}
                onSelect={() => pick(item)}
              >
                <XStack items="center" gap="$3" flex={1} minW={0}>
                  <XStack
                    items="center"
                    justify="center"
                    width={32}
                    height={32}
                    rounded="$3"
                    bg="$hover"
                  >
                    {item.icon ?? <SearchIcon size={16} opacity={0.7} />}
                  </XStack>
                  <YStack flex={1} minW={0}>
                    <SizableText size="$3" fontWeight="500" numberOfLines={1}>
                      {item.title}
                    </SizableText>
                    {item.subtitle ? (
                      <SizableText size="$1" color="$quiet" numberOfLines={1}>
                        {item.subtitle}
                      </SizableText>
                    ) : null}
                  </YStack>
                </XStack>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  )
}
