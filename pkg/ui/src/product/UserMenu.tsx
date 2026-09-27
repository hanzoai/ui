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
import { sx } from '../sx'
import { Popover, Text, XStack } from '@hanzo/gui'
import { ChevronsUpDown, UserRound } from '@hanzogui/lucide-icons-2'

import { Account, type UserMenuGroup } from './account'
import { useEmit } from './instrument'
import { displayName } from './name'
import { OrgMark } from './OrgMark'
import { ThemeToggle } from './ThemeToggle'

// The rows and groups are the body's types — `account.tsx` draws the body both
// this menu and `SessionRail`'s account menu open.
export type { UserMenuGroup, UserMenuItem } from './account'

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
        {...sx(className)}
        style={style}
      >
        {children ?? (
          <Account
            name={name}
            email={email}
            groups={groups}
            // The default toggle is this menu's, not the shared body's (see account.tsx).
            theme={theme === undefined ? <ThemeToggle /> : theme}
            onSignOut={onSignOut}
            signOutLabel={signOutLabel}
            onDone={close}
          />
        )}
      </Popover.Content>
    </Popover>
  )
}
