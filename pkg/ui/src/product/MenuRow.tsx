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
 * exactly one of which holds (`radio`, inside the caller's `radiogroup`); a row
 * without the notion is an action (`menuitem`). The presence of `active` decides
 * it, so no call site states it twice and none of them can forget.
 *
 * `radio` rather than the more obvious `option` because @hanzo/gui's `role` union
 * is React Native's accessibility-role set: it admits `option` but NOT `listbox`,
 * so an `option` here could never be given the parent ARIA requires.
 * `radiogroup`/`radio` is the single-select pair gui carries whole.
 */
import type { ReactNode } from 'react'
import { Text, XStack, YStack } from '@hanzo/gui'
import { Check } from '@hanzogui/lucide-icons-2'

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
      onPress={onPress}
      role={selectable ? 'radio' : 'menuitem'}
      aria-checked={selectable ? !!active : undefined}
      cursor="pointer"
      items="center"
      gap="$2.5"
      px="$2"
      py="$2"
      rounded="$3"
      bg={active ? '$edge' : 'transparent'}
      hoverStyle={{ bg: '$raised' }}
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
