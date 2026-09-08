'use client'

/**
 * PinList — a list of rows a viewer can pin to the top: a favourites list, a
 * recent-files rail, a set of saved queries. Pinning is order, not deletion —
 * a pinned row moves to its own group above the rest and an unpinned one keeps
 * its original position among its peers.
 *
 * Controlled the same shape as `ToggleGroup`: `value`/`defaultValue` is the set
 * of pinned ids, `onValueChange` fires the next set, and `useControllableState`
 * is the one place that reconciles "does the caller drive this" so an
 * uncontrolled `PinList` and a controlled one share every other line.
 *
 * `max` caps how many rows may be pinned at once — reaching it disables the pin
 * toggle on every UNPINNED row while leaving every PINNED row free to unpin,
 * because the cap is on how many are held, never on which one a viewer chooses
 * to release.
 */
import { SizableText, XStack, YStack, styled, useControllableState } from '@hanzo/gui'
import { Pin, PinOff } from '@hanzogui/lucide-icons-2'
import type { ComponentProps, ReactNode } from 'react'
import { ink } from './ink'
import { slot, tip } from './slot'
import { touch } from './gesture'

const ICON = 14
const BUTTON = 28

export interface PinListItem {
  id: string
  label: string
  description?: string
  icon?: ReactNode
  disabled?: boolean
}

const RowFrame = styled(XStack, {
  name: 'PinListRow',
  items: 'center',
  gap: '$3',
  px: '$3',
  py: '$2.5',
  rounded: '$3',
  borderWidth: 1,
  borderColor: 'transparent',
  hoverStyle: { bg: '$hover' },

  variants: {
    pinned: {
      true: { bg: '$edge' },
      false: {},
    },
  } as const,

  defaultVariants: { pinned: false },
})

const PinButton = styled(XStack, {
  name: 'PinListPin',
  items: 'center',
  justify: 'center',
  width: BUTTON,
  height: BUTTON,
  rounded: '$2',
  cursor: 'pointer',
  hoverStyle: { bg: '$background' },
})

export type PinListProps = Omit<ComponentProps<typeof YStack>, 'children' | 'onChange' | 'items'> & {
  /** Rows to list, in their unpinned (base) order. */
  items: PinListItem[]
  /** The pinned ids — controlled. */
  value?: string[]
  /** The pinned ids — uncontrolled initial state. */
  defaultValue?: string[]
  /** Fires with the next set of pinned ids whenever a row is pinned or unpinned. */
  onValueChange?: (value: string[]) => void
  /** Group pinned rows above the rest. Defaults to `true`; `false` pins in place. */
  pinnedFirst?: boolean
  /** How many rows may be pinned at once. Unset means no limit. */
  max?: number
}

/** A list of rows a viewer can pin to the top. */
export function PinList({
  items,
  value,
  defaultValue,
  onValueChange,
  pinnedFirst = true,
  max,
  ...props
}: PinListProps) {
  const [pinned, setPinned] = useControllableState<string[]>({
    prop: value,
    defaultProp: defaultValue ?? [],
    onChange: onValueChange,
  })
  const current = pinned ?? []
  const atMax = max != null && current.length >= max

  const toggle = (id: string) => {
    const next = current.includes(id)
      ? current.filter((existing) => existing !== id)
      : [...current, id]
    setPinned(next)
  }

  const ordered = pinnedFirst
    ? [...items.filter((item) => current.includes(item.id)), ...items.filter((item) => !current.includes(item.id))]
    : items

  return (
    <YStack {...slot('pin-list')} gap="$1" render="ul" {...props}>
      {ordered.map((item) => {
        const isPinned = current.includes(item.id)
        const pinDisabled = Boolean(item.disabled) || (!isPinned && atMax)

        return (
          <RowFrame key={item.id} {...slot('pin-list-row')} data-pinned={isPinned} pinned={isPinned} render="li">
            {item.icon}
            <YStack flex={1} gap="$0.5">
              {ink(item.label, SizableText, { fontSize: '$3', fontWeight: '500', color: '$color' })}
              {item.description
                ? ink(item.description, SizableText, { fontSize: '$2', color: '$quiet' })
                : null}
            </YStack>
            <PinButton
              {...slot('pin-list-toggle')}
              {...tip(isPinned ? `Unpin ${item.label}` : `Pin ${item.label}`)}
              {...touch(BUTTON, 44)}
              render="button"
              {...({ type: 'button', disabled: pinDisabled } as object)}
              aria-pressed={isPinned}
              aria-label={isPinned ? `Unpin ${item.label}` : `Pin ${item.label}`}
              opacity={pinDisabled ? 0.4 : 1}
              cursor={pinDisabled ? 'not-allowed' : 'pointer'}
              onClick={() => !pinDisabled && toggle(item.id)}
            >
              {isPinned ? <Pin size={ICON} fill="currentColor" /> : <PinOff size={ICON} />}
            </PinButton>
          </RowFrame>
        )
      })}
    </YStack>
  )
}
