'use client'

/**
 * UserMenu — the account control: who I am, and the things I do to my account.
 *
 * It was written inside `AppHeader` and could not be reached from anywhere else,
 * so every surface that wanted an account menu without adopting the whole header
 * wrote one: hanzo.app twice, chat, console, billing. Five implementations of one
 * menu, disagreeing on the trigger, the row order and the sign-out copy. This is
 * that menu, extracted whole — `AppHeader` now renders it instead of owning it,
 * so the header and a standalone account control cannot drift apart.
 *
 * Host-agnostic: identity is a value, every row is an injected handler, and a row
 * renders only when its handler is provided — an honest menu, never a dead item.
 * The surface keeps its own `useUser`/router in a thin wrapper; that wrapper is
 * the seam the charter asks for, not a duplicate.
 *
 * The trigger is sized as the PEER of `OrgSwitcher` — same height, same mark,
 * same type — so "which workspace" and "who I am" read as two halves of one
 * identity rather than a caption over a control.
 */
import { useState, type CSSProperties, type ReactNode } from 'react'
import { Popover, Separator, Text, XStack, YStack } from '@hanzo/gui'
import { ChevronsUpDown, LogOut, UserRound } from '@hanzogui/lucide-icons-2'

import { useEmit } from './instrument'
import { MenuLabel, MenuRow } from './MenuRow'
import { displayName } from './name'
import { OrgMark } from './OrgMark'
import { ThemeToggle } from './ThemeToggle'

/** One row. `id` names it in analytics; the label is what the person reads. */
export type UserMenuItem = {
  id: string
  label: string
  icon?: ReactNode
  onPress: () => void
  /** Draws the row in the destructive tone (sign out, delete account). */
  danger?: boolean
  /**
   * Whether this row is the chosen one — for a group that is a CHOICE rather
   * than a list of actions (which theme, which language). Its presence makes the
   * group a `radiogroup` and the row a `radio`, so assistive tech is told that
   * exactly one of them holds, and the chosen row carries a check.
   */
  active?: boolean
}

/** A group of rows, optionally named. A bare array is the unnamed form. */
export type UserMenuGroup = UserMenuItem[] | { label?: string; items: UserMenuItem[] }

const itemsOf = (g: UserMenuGroup): UserMenuItem[] => (Array.isArray(g) ? g : g.items)
const nameOf = (g: UserMenuGroup): string | undefined => (Array.isArray(g) ? undefined : g.label)

export type UserMenuProps = {
  /** The signed-in person's display name. Falls back to the email's local part. */
  name?: string
  email?: string
  /** Avatar URL. Absent → the monogram of the name, like an org's mark. */
  avatar?: string
  /** Grouped rows — each group is separated by a rule, empty groups are dropped.
   *  A group may be named, and a named group of `active` rows is a choice. */
  groups?: UserMenuGroup[]
  /** Theme row content — default `<ThemeToggle/>`; `null` hides the row (a
   *  single-theme surface has nothing to toggle and should not pretend to). */
  theme?: ReactNode
  /** Sign out. Omit on a surface that cannot sign out. */
  onSignOut?: () => void
  /** Sign-out copy — "Sign out" everywhere unless a surface has a reason. */
  signOutLabel?: string
  /** Replace the whole menu body, keeping the trigger. */
  children?: ReactNode
  /** Show the name beside the avatar in the trigger. Default true. */
  label?: boolean
  /** Trigger height. Default 44 — the peer of `OrgSwitcher`. */
  height?: number
  /**
   * Which way the panel opens, and from which edge. A user menu in a top bar
   * opens down from its right edge; the same control at the FOOT of a sidebar
   * has to open upward from its left, and a downward panel there falls off the
   * bottom of the viewport. This was hard-coded `bottom-end`, which is why the
   * console could not mount this component in its rail and kept a local copy of
   * the whole thing — the peer of `OrgSwitcher.direction`, which already had it.
   */
  direction?: 'down' | 'up'
  /** Which edge the panel aligns to. Default `end` (a top-bar avatar); `start`
   *  for a rail, where the panel should share the trigger's left edge. */
  align?: 'start' | 'end'
  /** The trigger's accessible name. Defaults to "<name> · account". */
  aria?: string
  /** `data-testid` on the trigger. */
  testId?: string
  /** Classes for the sheet — the host's own material (glass, elevation). */
  className?: string
  /** Inline style for the sheet — a host's stacking layer belongs here. */
  style?: CSSProperties
}

function Row({ item, onDone }: { item: UserMenuItem; onDone: () => void }) {
  const track = useEmit()
  return (
    <MenuRow
      label={item.label}
      icon={item.icon}
      active={item.active}
      danger={item.danger}
      onPress={() => {
        track({ component: 'UserMenu', action: 'select', id: item.id })
        onDone()
        item.onPress()
      }}
    />
  )
}

// The name to show is a rule over two strings, so it lives in `./name` and is
// reachable without a gui runtime via `@hanzo/ui/product/pure`. Re-exported
// here because it was published from this module.
export { displayName }

export function UserMenu({
  name,
  email,
  avatar,
  groups = [],
  theme,
  onSignOut,
  signOutLabel = 'Sign out',
  children,
  label = true,
  height = 44,
  direction = 'down',
  align = 'end',
  aria,
  testId,
  className,
  style,
}: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const track = useEmit()
  const shown = displayName(name, email)
  const filled = groups.filter((g) => itemsOf(g).length > 0)
  const close = () => setOpen(false)

  return (
    <Popover
      open={open}
      onOpenChange={(next: boolean) => {
        track({ component: 'UserMenu', action: next ? 'open' : 'close' })
        setOpen(next)
      }}
      placement={`${direction === 'up' ? 'top' : 'bottom'}-${align}` as const}
      // `direction` is a PREFERENCE, not a promise — see the note in
      // `OrgSwitcher`. This is the control it bites: at the foot of a desktop
      // rail it opens upward, and the SAME mount near the top of a phone's
      // account sheet has nowhere to go upward at all.
      allowFlip
      stayInFrame
    >
      <Popover.Trigger asChild>
        <XStack
          cursor="pointer"
          items="center"
          gap="$2.5"
          height={height}
          px="$2"
          rounded="$3"
          minW={0}
          hoverStyle={{ bg: '$edge' }}
          role="button"
          tabIndex={0}
          data-testid={testId}
          aria-label={aria ?? (shown ? `${shown} · account` : 'Account')}
        >
          {/* The person wears the same mark treatment as a workspace — an image
              when there is one, a monogram when there is not. */}
          {avatar || shown ? (
            <OrgMark org={{ name: shown || 'Account', logo: avatar }} size={30} />
          ) : (
            <UserRound size={18} />
          )}
          {label && shown ? (
            <Text fontSize="$3" fontWeight="600" color="$ink" numberOfLines={1} maxW={160}>
              {shown}
            </Text>
          ) : null}
          {/* The same chevron `OrgSwitcher` wears. Without it the two controls
              were a mark-and-a-name that opens something and a mark-and-a-name
              that does not appear to, side by side in one rail — which is a
              caption over a control, the exact thing both files say they are
              not. It is the affordance, so it belongs to both or to neither. */}
          {label && shown ? <ChevronsUpDown size={16} color="$faint" /> : null}
        </XStack>
      </Popover.Trigger>

      <Popover.Content
        role="menu"
        /* A menu sheet's rows run its full width. gui's PopperContent centres
           its children, so each row is only as wide as its own text until the
           class that stretches it lands a frame later: the sheet flashes a
           column of narrow, centred rows and then settles. Measured at 66px of
           dead space down both edges of a 300px sheet. */
        items="stretch"
        /* borderWidth/elevation, NOT bordered/elevate. Popover.Content
           declares neither -- gui has them only on Tabs -- and gui DROPS an
           unrecognised prop without a word, so this panel rendered with no
           border and no shadow in every consumer: console, hanzo.app, chat and
           platform. Measured: computed border-left-width 0px while px and bg
           applied normally, and React logged "Received true for a non-boolean
           attribute bordered". The siblings in this package have always used
           borderWidth={1}. */
        borderWidth={1}
        elevation="$2"
        px="$1"
        py="$1"
        width={240}
        bg="$panel"
        borderColor="$borderColor"
        className={className}
        style={style}
      >
        {children ?? (
          <YStack gap="$1">
            {shown || email ? (
              <YStack gap="$0.5" px="$2" py="$1.5">
                {shown ? (
                  <Text fontSize="$2" fontWeight="700" color="$ink" numberOfLines={1}>
                    {shown}
                  </Text>
                ) : null}
                {/* The email is shown only when it is not already the name — a
                    menu that prints one address twice reads as a rendering bug. */}
                {email && email !== shown ? (
                  <Text fontSize="$1" color="$soft" numberOfLines={1}>
                    {email}
                  </Text>
                ) : null}
              </YStack>
            ) : null}

            {filled.map((group, i) => {
              const items = itemsOf(group)
              const groupName = nameOf(group)
              // A group whose every row carries a chosen-one is a CHOICE, so it
              // is a radiogroup — a heading alone would leave the rows unrelated.
              const choice = items.every((it) => it.active !== undefined)
              const rows = items.map((item) => <Row key={item.id} item={item} onDone={close} />)
              return (
                <YStack key={i} gap="$1">
                  {i > 0 || shown || email ? <Separator borderColor="$borderColor" my="$1" /> : null}
                  {groupName ? <MenuLabel>{groupName}</MenuLabel> : null}
                  {choice ? (
                    <YStack role="radiogroup" aria-label={groupName} gap="$1">
                      {rows}
                    </YStack>
                  ) : (
                    rows
                  )}
                </YStack>
              )
            })}

            {theme !== null ? (
              <>
                <Separator borderColor="$borderColor" my="$1" />
                <XStack items="center" gap="$2.5" px="$2" py="$1" rounded="$3">
                  <Text flex={1} fontSize="$2" color="$ink">
                    Theme
                  </Text>
                  {theme ?? <ThemeToggle />}
                </XStack>
              </>
            ) : null}

            {onSignOut ? (
              <>
                <Separator borderColor="$borderColor" my="$1" />
                <Row
                  item={{
                    id: 'sign-out',
                    label: signOutLabel,
                    icon: <LogOut size={16} />,
                    onPress: onSignOut,
                  }}
                  onDone={close}
                />
              </>
            ) : null}
          </YStack>
        )}
      </Popover.Content>
    </Popover>
  )
}
