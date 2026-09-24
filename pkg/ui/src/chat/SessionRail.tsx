'use client'

/**
 * SessionRail — the left rail of a sessions surface: start one, go somewhere,
 * reopen a recent one, and who you are.
 *
 *   + New                       the primary row; the current view on a fresh pane
 *   Artifacts · Customize …     the surface's own places, as `links`
 *   More ⌄                      a disclosure over `more`, when there are more
 *   Recents            ⇅        the sessions, newest first, each with a status dot
 *   (z) z@hanzo.ai ⌄   ⚙ ⌕      the account, then settings and search
 *
 * Presentational: no routing, no fetching. `active` comes in, `onOpen` goes out.
 *
 * THE SIDEBAR CANON (console, hanzo.app, hanzo.chat, the extension):
 *   - Collapse is an EXPLICIT toggle and the host persists it. `collapsed` in,
 *     `onCollapse` out. There is no hover-to-expand and no pin.
 *   - Collapsed is a narrow RAIL that stays on screen — icons only, labels as
 *     tooltips — and its top row is the expand control.
 *   - Below `md` there is no rail at all. The column hides, and the same
 *     contents open as a drawer from the left when the host says so (`open`,
 *     `onOpenChange`) — typically from a menu button only a phone shows.
 *
 * Built from the chat `Sidebar` column and its icon button, so the rail is the
 * same material as every other chat surface's.
 */
import { ScrollView, SizableText, XStack, YStack } from '@hanzo/gui'
import {
  ArrowDownUp,
  ChevronDown,
  ChevronUp,
  PanelLeft,
  Plus,
  Search,
  Settings,
} from '@hanzogui/lucide-icons-2'
import { useId, useState, type ComponentProps, type ReactNode } from 'react'

import { Sheet, SheetContent, SheetTitle } from '../backends/gui/sheet'
import { slot, tip } from '../backends/gui/slot'
import { Sidebar, SidebarIconButton } from './Sidebar'

type Col = Omit<ComponentProps<typeof YStack>, 'children'>

/** Expanded width, px — the column's own width, its hairline outside it. */
const WIDTH = 272

/** Collapsed width, px. The same rail width every chat surface collapses to. */
const RAIL = 56

/** The keyboard focus ring every control in the package draws. */
const RING = { outlineColor: '$outlineColor', outlineWidth: 2, outlineStyle: 'solid' } as const

/** One row: 32px, the 8px radius, icon then label. */
const ROW = { minH: 32, px: '$2', rounded: '$3', gap: '$2.5' } as const

/** Where a session is. `running` pulses; finished and idle are an open ring. */
export type SessionStatus = 'running' | 'paused' | 'done' | 'stopped' | 'error' | 'idle'

export interface RailSession {
  id: string
  title: string
  status?: SessionStatus
}

export interface RailLink {
  id: string
  label: string
  icon: ReactNode
  onPress?: () => void
  /** This place is the current view. */
  active?: boolean
}

export interface RailAccount {
  /** The line shown — an email or a name. */
  name: string
  /** Avatar slot. Falls back to the first letter of `name`. */
  avatar?: ReactNode
  /** The caret beside the name: the account menu. */
  onPress?: () => void
}

export interface SessionRailProps extends Col {
  /** Starts a new session. */
  onNew?: () => void
  newLabel?: string
  /** The fresh pane IS the current view, so New draws as the active row. */
  fresh?: boolean
  /** The surface's own places, under New. */
  links?: RailLink[]
  /** Behind the "More" disclosure. None, and there is no More row. */
  more?: RailLink[]
  moreLabel?: string
  /** The sessions, newest first. */
  recents: RailSession[]
  recentsLabel?: string
  /** The open session's id. */
  active?: string | null
  onOpen: (id: string) => void
  /** The sort/filter control beside the Recents label. None, no control. */
  onSort?: () => void
  sortLabel?: string
  /** Shown in place of the list when there are no recents. */
  empty?: ReactNode
  /** Drawn above the account row — a notice, a setup card. */
  notice?: ReactNode
  account?: RailAccount
  onSettings?: () => void
  onSearch?: () => void
  /** Collapsed to the icon rail. The host owns and persists it. */
  collapsed?: boolean
  onCollapse?: (collapsed: boolean) => void
  /** The rail's top row when collapsed — a surface's mark. It is the expand control. */
  mark?: ReactNode
  /** Below `md`: the drawer is open. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** The landmark's name. */
  label?: string
  /** Expanded width, px. */
  width?: number
}

/** The status mark: a 6px dot, filled while something is happening. */
export function StatusDot({ status = 'idle' }: { status?: SessionStatus }) {
  const filled = status === 'running' || status === 'paused' || status === 'error'
  return (
    <XStack
      {...slot('status-dot')}
      data-status={status}
      // The pulse is a class the package's own sheet owns (styles/motion.css),
      // opacity only — nothing reflows for a dot nobody is reading.
      className={status === 'running' ? 'hz-pulse' : undefined}
      width={6}
      height={6}
      rounded={9999}
      shrink={0}
      bg={filled ? (status === 'error' ? '$bad' : status === 'paused' ? '$faint' : '$quiet') : 'transparent'}
      borderWidth={filled ? 0 : 1}
      borderColor="$faint"
      aria-hidden
    />
  )
}

/** Where a row starts: the 16px column every icon and dot sits centred in. */
const Lead = ({ children }: { children: ReactNode }) => (
  <XStack width={16} height={16} shrink={0} items="center" justify="center">
    {children}
  </XStack>
)

interface RowProps {
  label: string
  icon: ReactNode
  onPress?: () => void
  active?: boolean
  rail: boolean
  quiet?: boolean
  expanded?: boolean
  controls?: string
  data?: string
}

/** One nav row. On the rail it is the icon alone, the label its tooltip and name. */
function Row({ label, icon, onPress, active, rail, quiet, expanded, controls, data = 'rail-row' }: RowProps) {
  return (
    <XStack
      {...slot(data)}
      {...(rail ? tip(label) : null)}
      {...ROW}
      items="center"
      justify={rail ? 'center' : 'flex-start'}
      cursor="pointer"
      role="button"
      tabIndex={0}
      aria-label={rail ? label : undefined}
      aria-current={active ? 'page' : undefined}
      aria-expanded={expanded}
      aria-controls={controls}
      bg={active ? '$raised' : undefined}
      hoverStyle={{ bg: active ? '$raised' : '$hover' }}
      pressStyle={{ bg: '$raised' }}
      focusVisibleStyle={RING}
      onPress={onPress}
      onKeyDown={(e: any) => {
        if (e?.key !== 'Enter' && e?.key !== ' ') return
        e.preventDefault?.()
        onPress?.()
      }}
    >
      <Lead>{icon}</Lead>
      {rail ? null : (
        <SizableText size="$3" numberOfLines={1} flex={1} color={quiet ? '$soft' : '$ink'}>
          {label}
        </SizableText>
      )}
    </XStack>
  )
}

/** The account line: avatar, the name clamped, the caret. */
function Account({ account, rail }: { account: RailAccount; rail: boolean }) {
  const face = (
    <XStack
      width={24}
      height={24}
      rounded={9999}
      items="center"
      justify="center"
      bg="$raised"
      overflow="hidden"
      shrink={0}
    >
      {account.avatar ?? (
        <SizableText size="$1" fontWeight="600" color="$ink">
          {account.name.charAt(0).toUpperCase()}
        </SizableText>
      )}
    </XStack>
  )
  return (
    <XStack
      {...slot('rail-account')}
      {...(rail ? tip(account.name) : null)}
      {...ROW}
      gap="$2"
      px="$1"
      flex={rail ? undefined : 1}
      minW={0}
      items="center"
      justify={rail ? 'center' : 'flex-start'}
      cursor={account.onPress ? 'pointer' : undefined}
      role={account.onPress ? 'button' : undefined}
      tabIndex={account.onPress ? 0 : undefined}
      aria-label={account.onPress ? `Account: ${account.name}` : undefined}
      aria-haspopup={account.onPress ? 'menu' : undefined}
      hoverStyle={account.onPress ? { bg: '$hover' } : undefined}
      onPress={account.onPress}
      onKeyDown={(e: any) => {
        if (!account.onPress || (e?.key !== 'Enter' && e?.key !== ' ')) return
        e.preventDefault?.()
        account.onPress()
      }}
    >
      {face}
      {rail ? null : (
        <>
          <SizableText size="$3" numberOfLines={1} flex={1} minW={0} color="$ink">
            {account.name}
          </SizableText>
          {account.onPress ? <ChevronDown size={14} color="$soft" /> : null}
        </>
      )}
    </XStack>
  )
}

/** The rail's contents — the same tree in the column and in the drawer. */
function Contents({
  onNew,
  newLabel = 'New',
  fresh = false,
  links = [],
  more = [],
  moreLabel = 'More',
  recents,
  recentsLabel = 'Recents',
  active = null,
  onOpen,
  onSort,
  sortLabel = 'Sort and filter',
  empty,
  notice,
  account,
  onSettings,
  onSearch,
  collapsed = false,
  onCollapse,
  mark,
  rail,
}: SessionRailProps & { rail: boolean }) {
  const [unfolded, setUnfolded] = useState(false)
  const id = useId()
  const moreId = `${id}-more`
  const headId = `${id}-recents`

  return (
    <>
      {rail ? (
        // Collapsed, the top row is the way back: the surface's mark when it has
        // one, the panel glyph otherwise. It is never hover — it is a press.
        <XStack justify="center" pb="$1">
          <SidebarIconButton
            label="Expand sidebar"
            width={36}
            height={36}
            onPress={() => onCollapse?.(false)}
          >
            {mark ?? <PanelLeft size={16} />}
          </SidebarIconButton>
        </XStack>
      ) : null}

      <YStack {...slot('rail-nav')} gap="$0" role="list">
        {onNew ? (
          <YStack role="listitem">
            <Row label={newLabel} icon={<Plus size={16} />} onPress={onNew} active={fresh} rail={rail} data="rail-new" />
          </YStack>
        ) : null}
        {links.map((link) => (
          <YStack key={link.id} role="listitem">
            <Row label={link.label} icon={link.icon} onPress={link.onPress} active={link.active} rail={rail} />
          </YStack>
        ))}
        {more.length ? (
          <YStack role="listitem">
            <Row
              label={moreLabel}
              icon={unfolded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              onPress={() => setUnfolded((v) => !v)}
              rail={rail}
              quiet
              expanded={unfolded}
              controls={moreId}
              data="rail-more"
            />
            {unfolded ? (
              <YStack id={moreId} role="list" gap="$0">
                {more.map((link) => (
                  <YStack key={link.id} role="listitem">
                    <Row label={link.label} icon={link.icon} onPress={link.onPress} active={link.active} rail={rail} />
                  </YStack>
                ))}
              </YStack>
            ) : null}
          </YStack>
        ) : null}
      </YStack>

      {rail ? (
        <YStack flex={1} />
      ) : (
        <YStack {...slot('rail-recents')} flex={1} minH={0} mt="$5">
          <XStack items="center" justify="space-between" height={28} pl="$2" pr="$1" shrink={0}>
            <SizableText id={headId} size="$2" color="$soft">
              {recentsLabel}
            </SizableText>
            {onSort ? (
              <SidebarIconButton label={sortLabel} onPress={onSort} width={24} height={24}>
                <ArrowDownUp size={14} />
              </SidebarIconButton>
            ) : null}
          </XStack>
          <ScrollView flex={1} showsVerticalScrollIndicator={false}>
            {recents.length === 0 ? (
              empty ? (
                <YStack px="$2" py="$2">
                  {typeof empty === 'string' ? (
                    <SizableText size="$2" color="$soft">
                      {empty}
                    </SizableText>
                  ) : (
                    empty
                  )}
                </YStack>
              ) : null
            ) : (
              <YStack role="list" aria-labelledby={headId} gap={1}>
                {recents.map((s) => {
                  const on = s.id === active
                  return (
                    <YStack key={s.id} role="listitem">
                      <XStack
                        {...slot('rail-session')}
                        {...ROW}
                        items="center"
                        cursor="pointer"
                        role="button"
                        tabIndex={0}
                        aria-current={on ? 'page' : undefined}
                        bg={on ? '$raised' : undefined}
                        hoverStyle={{ bg: on ? '$raised' : '$hover' }}
                        pressStyle={{ bg: '$raised' }}
                        focusVisibleStyle={RING}
                        onPress={() => onOpen(s.id)}
                        onKeyDown={(e: any) => {
                          if (e?.key !== 'Enter' && e?.key !== ' ') return
                          e.preventDefault?.()
                          onOpen(s.id)
                        }}
                      >
                        <Lead>
                          <StatusDot status={s.status} />
                        </Lead>
                        <SizableText size="$3" numberOfLines={1} flex={1} minW={0} color={on ? '$ink' : '$quiet'}>
                          {s.title}
                        </SizableText>
                      </XStack>
                    </YStack>
                  )
                })}
              </YStack>
            )}
          </ScrollView>
        </YStack>
      )}

      {notice && !rail ? <YStack pt="$2">{notice}</YStack> : null}

      <XStack
        {...slot('rail-foot')}
        items="center"
        gap="$1"
        pt="$2"
        mt="$1"
        borderTopWidth={1}
        borderColor="$borderColor"
        flexDirection={rail ? 'column' : 'row'}
      >
        {account ? <Account account={account} rail={rail} /> : <XStack flex={1} />}
        {onSettings ? (
          <SidebarIconButton label="Settings" onPress={onSettings}>
            <Settings size={16} />
          </SidebarIconButton>
        ) : null}
        {onSearch ? (
          <SidebarIconButton label="Search" onPress={onSearch}>
            <Search size={16} />
          </SidebarIconButton>
        ) : null}
        {onCollapse && !rail ? (
          <SidebarIconButton label="Collapse sidebar" onPress={() => onCollapse(!collapsed)}>
            <PanelLeft size={16} />
          </SidebarIconButton>
        ) : null}
      </XStack>
    </>
  )
}

export function SessionRail(props: SessionRailProps) {
  const {
    // Everything the contents read is named here, so none of it reaches the
    // column as a stray DOM attribute through `rest`.
    onNew, newLabel, fresh, links, more, moreLabel, recents, recentsLabel, active, onOpen,
    onSort, sortLabel, empty, notice, account, onSettings, onSearch, collapsed = false,
    onCollapse, mark, open = false, onOpenChange, label = 'Sessions', width = WIDTH,
    ...rest
  } = props
  const rail = collapsed

  return (
    <>
      <Sidebar
        {...slot('session-rail')}
        role="navigation"
        aria-label={label}
        data-collapsed={rail ? 'true' : 'false'}
        width={rail ? RAIL : width}
        gap="$0"
        px={rail ? '$1.5' : '$2'}
        py="$2"
        // Mobile is never a rail: below `md` the column is gone and the drawer
        // below carries the same contents.
        $max-md={{ display: 'none' }}
        {...rest}
      >
        <Contents {...props} rail={rail} />
      </Sidebar>

      {open ? (
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent side="left" width={width} maxW="86%" p="$2" gap="$0" bg="$panel">
            <SheetTitle {...slot('session-rail-title')} position="absolute" opacity={0} pointerEvents="none">
              {label}
            </SheetTitle>
            <YStack {...slot('session-rail-drawer')} role="navigation" aria-label={label} flex={1} minH={0}>
              {/* Going somewhere from the drawer closes it: the drawer is the
                  way to a place, not a place. */}
              <Contents
                {...props}
                rail={false}
                collapsed={false}
                onCollapse={undefined}
                onNew={onNew ? () => (onOpenChange?.(false), onNew()) : undefined}
                onOpen={(sid) => (onOpenChange?.(false), onOpen(sid))}
              />
            </YStack>
          </SheetContent>
        </Sheet>
      ) : null}
    </>
  )
}
