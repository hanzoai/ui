'use client'

/**
 * MenuRow — ONE row for the identity sheets: `OrgSwitcher`, `UserMenu`, and
 * whatever a surface adds to either through `footer`.
 *
 * The anatomy is always the same — a leading dot or icon, a label, an optional
 * second line, and a check on the chosen one — and it was written four times:
 * once inside the org switcher, once inside the account menu, and twice more in
 * the console, which had to draw its own to put project rows in the same sheet.
 * Four copies is four sets of numbers, and they disagreed: the same sheet held
 * rows a step apart in their gutter and two different hover tints.
 *
 * A row also has to SAY what it is. A row that can be current is one of a set
 * exactly one of which holds (`menuitemradio`, inside the caller's `group`); a
 * row without the notion is an action (`menuitem`). The presence of `active`
 * decides it, so no call site states it twice and none of them can forget.
 *
 * Every sheet these rows sit in is a `menu`, and a menu owns menu items, groups
 * and separators — nothing else. The choice used to be a `radiogroup` of `radio`
 * rows, the pair gui's `role` union carries whole, and axe fails a `radiogroup`
 * inside a `menu` outright (`aria-required-children`: "children which are not
 * allowed"). `group` + `menuitemradio` + `aria-checked` is the pair ARIA names
 * for a single choice inside a menu. gui's union is React Native's role set and
 * lacks `menuitemradio`, so the one cast below says it; the attribute reaches
 * the DOM as written.
 */
import type { ReactNode } from 'react'
import { Text, XStack, YStack, isWeb } from '@hanzo/gui'
import { Check } from '@hanzogui/lucide-icons-2'

import { press, RING } from '../backends/gui/press'

/** The tier hue a row may carry. Monochrome by default — only the genuine states
 *  take a colour (a live network green, a caution amber). */
export type DotColor = '$green10' | '$yellow10' | '$soft' | '$faint' | '$dim'

export type MenuRowProps = {
  label: string
  /** A second, muted line under the label. */
  sub?: string
  /** A tier dot in place of an icon. */
  dot?: DotColor
  icon?: ReactNode
  /** Whether this row is the chosen one — see the note above on what it decides. */
  active?: boolean
  /** The destructive register — sign out, delete, revoke. */
  danger?: boolean
  onPress: () => void
}

export function MenuRow({ label, sub, dot, icon, active, danger, onPress }: MenuRowProps) {
  const selectable = active !== undefined
  return (
    <XStack
      {...press(onPress)}
      // After `press`, whose role is `button`: a row is a menu item.
      {...({ role: selectable ? (isWeb ? 'menuitemradio' : 'radio') : 'menuitem' } as object)}
      aria-checked={selectable ? !!active : undefined}
      cursor="pointer"
      items="center"
      gap="$2.5"
      px="$2"
      py="$2"
      rounded="$3"
      bg={active ? '$edge' : 'transparent'}
      hoverStyle={{ bg: '$raised' }}
      focusVisibleStyle={RING}
    >
      {dot ? <YStack width={8} height={8} rounded="$10" bg={dot} /> : icon}
      <YStack flex={1} minW={0}>
        <Text fontSize="$2" color={danger ? '$red10' : '$ink'} numberOfLines={1}>
          {label}
        </Text>
        {sub ? (
          <Text fontSize="$1" color="$soft" numberOfLines={1}>
            {sub}
          </Text>
        ) : null}
      </YStack>
      {active ? <Check size={16} /> : null}
    </XStack>
  )
}

/**
 * A quiet heading over a group of rows — "Organization", "Project", "Theme".
 *
 * Sentence case, unlike `MenuLabelView` in the menu family: that one marks
 * sections of a command list, where a heading is a signpost between verbs. This
 * sheet is read as prose about who and where you are, and a word in caps in the
 * middle of it shouts.
 */
export function MenuLabel({ children }: { children: ReactNode }) {
  return (
    <Text px="$2" py="$1" fontSize="$1" color="$soft" fontWeight="500">
      {children}
    </Text>
  )
}

/** The hairline between two groups of rows. */
export function MenuRule() {
  return <XStack height={1} bg="$borderColor" my="$1" />
}
