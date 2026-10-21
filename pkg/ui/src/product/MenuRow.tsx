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
 *
 * THE ANATOMY IS SHARED. `MenuRowContent` is what sits inside any menu row — the
 * leading slot (a dot, an icon, an icon in its tinted well, an avatar, a drag
 * grip), the label with its contextual text, the second line, the shortcut keys,
 * and the trailing check or submenu chevron — and `DropdownMenuItem`'s
 * declarative rows render it inside gui's own `Menu.Item`, so a menu item and a
 * sheet row are one anatomy with each keeping its own role.
 *
 * `size="row"` is the record geometry (the record kit's MenuItem, MIT, NOTICE): 32px,
 * 4px inset, 8px gap, a 4px corner concentric in an 8px panel, the hover tint one
 * rung up, the label in the secondary ink. The default stays the sheet row these
 * screens were drawn with.
 */
import { useState, type ReactNode } from 'react'
import { Text, XStack, YStack, isWeb } from '@hanzo/gui'
import { Check, ChevronRight, GripVertical } from '@hanzogui/lucide-icons-2'

import { press, RING } from '../backends/gui/press'
import { Shortcut, type ShortcutKeys } from '../backends/gui/shortcut'
import { touch } from '../backends/gui/gesture'

/** The tier hue a row may carry. Monochrome by default — only the genuine states
 *  take a colour (a live network green, a caution amber). */
export type DotColor = '$green10' | '$yellow10' | '$soft' | '$faint' | '$dim'

/** The record row's geometry, shared with DropdownMenu so a menu and a list are one row. */
export const MENU_ROW = { h: 32, px: 4, gap: 8, icon: 16, chevron: 14, well: 4 } as const

export type MenuRowShortcut = ReactNode | string | ShortcutKeys

export type MenuRowContentProps = {
  label: ReactNode
  /** A second, muted line under the label. */
  sub?: ReactNode
  /** Dimmed text beside the label — a count, a type, an id. */
  contextual?: ReactNode
  /** `left` sits right after the label; `right` is pushed to the trailing end. */
  contextualPosition?: 'left' | 'right'
  /** A tier dot in place of an icon. */
  dot?: DotColor
  /** The leading slot: an icon, an Avatar, a logo. */
  icon?: ReactNode
  /** Seat the icon in its tinted well (4px padding, 4px corner). */
  iconContainer?: boolean
  /** A drag grip: `always` in place of the icon, `onHover` swapping with it. */
  grip?: 'never' | 'always' | 'onHover'
  /** Keys: a ReactNode, one key, or a list read as one chord. */
  shortcut?: MenuRowShortcut
  /** The trailing check of the chosen row. */
  check?: boolean
  /** A submenu chevron; `open` turns it a quarter. */
  submenu?: boolean | 'open'
  /** `danger` for a destructive row, `placeholder` for a row that offers rather than does. */
  tone?: 'default' | 'danger' | 'placeholder'
  /** The record row reads in the secondary ink; the sheet row in full ink. */
  quiet?: boolean
  /** Whether the row is under the pointer, for the hover-only grip. */
  hovered?: boolean
  /** The second line's rung: the sheet's softer one or a menu's quiet one. */
  subColor?: '$soft' | '$hint'
}

/** The label's ink. The sheet row keeps the red it was drawn with; the record row reads the error state. */
const labelColor = (tone: MenuRowContentProps['tone'], quiet: boolean) =>
  tone === 'danger' ? (quiet ? '$bad' : '$red10') : tone === 'placeholder' ? '$hint' : quiet ? '$aside' : '$ink'

/** A key, a chord or a sequence, as the kit's Shortcut keycaps (spoken once). A node is the caller's own rendering. */
const keys = (shortcut: MenuRowShortcut) => {
  if (shortcut == null || shortcut === false) return null
  if (typeof shortcut === 'string') return <Shortcut keys={[shortcut]} />
  if (Array.isArray(shortcut)) return <Shortcut keys={shortcut as ShortcutKeys} />
  return shortcut as ReactNode
}

export function MenuRowContent({
  label,
  sub,
  contextual,
  contextualPosition = 'left',
  dot,
  icon,
  iconContainer = false,
  grip = 'never',
  shortcut,
  check = false,
  submenu = false,
  tone = 'default',
  quiet = false,
  hovered = false,
  subColor = '$hint',
}: MenuRowContentProps) {
  const lead = dot ? <YStack width={8} height={8} rounded="$10" bg={dot} /> : icon
  const swap = grip === 'onHover' && hovered
  const leading =
    grip === 'always' || swap ? (
      <GripVertical size={MENU_ROW.icon} color="$hush" />
    ) : lead && iconContainer ? (
      <XStack p={MENU_ROW.well} rounded="$xs" bg="$hover" items="center" justify="center" shrink={0}>
        {lead}
      </XStack>
    ) : (
      lead
    )
  const dim = contextual != null && contextual !== '' ? (
    <Text fontSize="$2" color="$hint" numberOfLines={1} pl={4} shrink={1}>
      {contextual}
    </Text>
  ) : null
  return (
    <>
      {/* Wrapped only when the slot can swap: a grip and an icon share one
          16px place so the label does not move when they trade. A bare dot or
          icon is placed as it always was. */}
      {grip !== 'never' ? (
        <XStack shrink={0} items="center" justify="center" minW={MENU_ROW.icon}>
          {leading}
        </XStack>
      ) : (
        leading ?? null
      )}
      <YStack flex={1} minW={0}>
        <XStack items="center" minW={0}>
          {typeof label === 'string' || typeof label === 'number' ? (
            <Text fontSize="$2" color={labelColor(tone, quiet)} numberOfLines={1} shrink={1}>
              {label}
            </Text>
          ) : (
            label
          )}
          {contextualPosition === 'left' ? dim : null}
        </XStack>
        {sub ? (
          typeof sub === 'string' ? (
            <Text fontSize="$1" color={subColor} numberOfLines={1}>
              {sub}
            </Text>
          ) : (
            sub
          )
        ) : null}
      </YStack>
      {contextualPosition === 'right' ? dim : null}
      {shortcut != null ? <XStack shrink={0}>{keys(shortcut)}</XStack> : null}
      {check ? <Check size={MENU_ROW.icon} strokeWidth={2} /> : null}
      {submenu ? (
        <XStack
          shrink={0}
          animation="quick"
          rotate={submenu === 'open' ? '90deg' : '0deg'}
          {...({ 'data-open': submenu === 'open' ? '' : undefined } as object)}
        >
          <ChevronRight size={MENU_ROW.chevron} color="$hush" />
        </XStack>
      ) : null}
    </>
  )
}

export type MenuRowProps = Omit<MenuRowContentProps, 'check' | 'tone' | 'quiet' | 'hovered' | 'subColor' | 'label' | 'sub'> & {
  label: string
  /** A second, muted line under the label. */
  sub?: string
  /** Whether this row is the chosen one — see the note above on what it decides. */
  active?: boolean
  /** The destructive register — sign out, delete, revoke. */
  danger?: boolean
  /** A row that offers rather than does: "Add a field", "No value". */
  placeholder?: boolean
  /** Keyboard-highlighted from outside (a list whose cursor is not focus). */
  focused?: boolean
  disabled?: boolean
  /** Trailing actions: shown on hover or focus on a pointer, always on touch. */
  actions?: ReactNode
  actionsVisibility?: 'hover' | 'always'
  /**
   * `suggestion` is a typeahead row (an @-mention, a variable): its selection
   * follows a caret, not the pointer, so the selected row is a rung stronger
   * than hover.
   */
  variant?: 'default' | 'suggestion'
  /** With `variant="suggestion"`, the row the caret is on. */
  selected?: boolean
  /** `row` is the record geometry; the default is the identity sheet's. */
  size?: 'default' | 'row'
  onPress?: () => void
}

export function MenuRow({
  label,
  sub,
  dot,
  icon,
  active,
  danger,
  placeholder,
  focused = false,
  disabled = false,
  actions,
  actionsVisibility = 'hover',
  variant = 'default',
  selected = false,
  size = 'default',
  onPress,
  ...content
}: MenuRowProps) {
  const selectable = active !== undefined
  const row = size === 'row'
  const [hovered, setHovered] = useState(false)
  const [within, setWithin] = useState(false)
  const shown = actionsVisibility === 'always' || hovered || within
  const lit = variant === 'suggestion' && selected ? '$raised' : focused ? '$hover' : active ? '$edge' : 'transparent'
  const run = disabled ? undefined : onPress
  const hover = { onHoverIn: () => setHovered(true), onHoverOut: () => setHovered(false) }
  const body = (
    <XStack
      {...press(run)}
      // After `press`, whose role is `button`: a row is a menu item.
      {...({ role: selectable ? (isWeb ? 'menuitemradio' : 'radio') : 'menuitem' } as object)}
      aria-checked={selectable ? !!active : undefined}
      aria-disabled={disabled || undefined}
      {...(variant === 'suggestion' ? ({ 'aria-selected': selected } as object) : null)}
      cursor={disabled ? 'default' : 'pointer'}
      items="center"
      // The sheet row: 8 round, 10 between. The record row: the source kit's 32 / 4 / 8.
      {...(row
        ? { gap: MENU_ROW.gap, px: MENU_ROW.px, minH: MENU_ROW.h, rounded: '$xs' as const, ...touch(MENU_ROW.h, 44, 'y') }
        : { gap: '$2.5' as const, px: '$2' as const, py: '$2' as const, rounded: '$3' as const })}
      bg={lit}
      opacity={disabled ? 0.5 : 1}
      hoverStyle={disabled ? undefined : { bg: variant === 'suggestion' && selected ? '$raised' : row ? '$hover' : '$raised' }}
      focusVisibleStyle={RING}
      {...(actions ? { flex: 1, minW: 0 } : hover)}
      onFocus={() => setWithin(true)}
      onBlur={() => setWithin(false)}
    >
      <MenuRowContent
        {...content}
        label={label}
        sub={sub}
        dot={dot}
        icon={icon}
        check={!!active}
        tone={danger ? 'danger' : placeholder ? 'placeholder' : 'default'}
        quiet={row}
        hovered={hovered}
        subColor={row ? '$hint' : '$soft'}
      />
    </XStack>
  )
  if (!actions) return body
  // The actions sit BESIDE the row, not inside it: a control inside a
  // `menuitem` is a nested interactive. One hover covers both.
  return (
    <XStack {...({ 'data-slot': 'menu-row-with-actions' } as object)} items="center" gap={MENU_ROW.gap} {...hover}>
      {body}
      <XStack
        {...({ 'data-slot': 'menu-row-actions' } as object)}
        role="group"
        shrink={0}
        items="center"
        gap="$1"
        opacity={shown ? 1 : 0}
        // A finger cannot hover: on a coarse pointer the actions are always there.
        $touchable={{ opacity: 1 }}
        animation="75ms"
      >
        {actions}
      </XStack>
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
