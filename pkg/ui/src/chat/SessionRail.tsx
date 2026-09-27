'use client'

/**
 * SessionRail — the left rail of a sessions surface: who it is, find one, start
 * one, go somewhere, reopen a recent one, and who you are.
 *
 *   Hanzo Build                 the brand; pressing it starts a new session
 *   [⌕ Search              ]    finds a session
 *   + New                       the primary row; the current view on a fresh pane
 *   Artifacts · Customize …     the surface's own places, as `links`
 *   More ⌄                      a disclosure over `more`, when there are more
 *   Recents            ⇅        the sessions, newest first, each with a status dot
 *   [ Try Hanzo in Slack  × ]   `notice` — a `RailNotice`, when the host has one
 *   (D) Dave            ⌄  ◧    the account and its menu, then collapse
 *       acme
 *
 * Presentational: no routing, no fetching. `active` comes in, `onOpen` goes out.
 *
 * THE SIDEBAR CANON (console, hanzo.app, hanzo.chat, hanzo.build, the extension):
 *   - Collapse is an EXPLICIT toggle and the host persists it. `collapsed` in,
 *     `onCollapse` out. There is no hover-to-expand and no pin.
 *   - Collapsed is a narrow RAIL that stays on screen — icons only, labels as
 *     tooltips — and its top row is the expand control.
 *   - Below `md` there is no rail at all. The column hides, `RailBar` is the
 *     pane's header (menu · brand · search), and its menu opens the same
 *     contents as a drawer from the left (`open`, `onOpenChange`). Anything
 *     chosen in the drawer closes it: the drawer is the way to a place, not a
 *     place.
 *
 * ONE WAY to each thing. Search is the box in the head (an icon on the collapsed
 * rail); settings, usage and signing out are rows of the account menu. There is
 * no second search or settings control at the foot.
 *
 * Built from the chat `Sidebar` column and its icon button, so the rail is the
 * same material as every other chat surface's. The account menu is the same
 * body `UserMenu` draws (`product/account.tsx`), anchored to the account row
 * itself — above it on the open rail, beside it on the collapsed one.
 */
import { ScrollView, SizableText, XStack, YStack } from '@hanzo/gui'
import {
  ArrowDownUp,
  ChevronDown,
  ChevronUp,
  Menu,
  PanelLeft,
  Plus,
  Search,
  X,
} from '@hanzogui/lucide-icons-2'
import { useId, useState, type ComponentProps, type ReactNode } from 'react'

import { Button } from '../backends/gui/button'
import { Popover, PopoverContent, PopoverTrigger } from '../backends/gui/popover'
import { press, RING } from '../backends/gui/press'
import { Sheet, SheetContent, SheetTitle } from '../backends/gui/sheet'
import { slot, tip } from '../backends/gui/slot'
import { Account, type UserMenuGroup } from '../product/account'
import { Sidebar, SidebarIconButton } from './Sidebar'

type Col = Omit<ComponentProps<typeof YStack>, 'children'>
type Row = Omit<ComponentProps<typeof XStack>, 'children'>

/** Expanded width, px — the column's own width, its hairline outside it. */
const WIDTH = 272

/** Collapsed width, px. The same rail width every chat surface collapses to. */
const RAIL = 56

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
  /** The first line — the person's name, or their email. */
  name: string
  /** The second line, muted — the organization they act in. */
  sub?: string
  /** Avatar slot. Falls back to the first letter of `name`. */
  avatar?: ReactNode
  /** Heads the menu, under the name, when it is not the name itself. */
  email?: string
  /**
   * The menu's rows, in groups with a rule between. A group whose every row
   * carries `active` is a choice — a named group, the chosen row checked —
   * which is how an organization switcher is drawn.
   */
  groups?: UserMenuGroup[]
  /** Sign out, at the foot of the menu. */
  onSignOut?: () => void
  signOutLabel?: string
  /**
   * With no menu (no `groups`, no `onSignOut`), the row is this one action —
   * a signed-out rail's "Sign in".
   */
  onPress?: () => void
}

export interface SessionRailProps extends Col {
  /**
   * The head's first line — the surface's name. A string is drawn as the
   * wordmark; a node brings its own (and its own accessible name).
   */
  brand?: ReactNode
  /** Pressing the brand. Starts a new session (`onNew`) unless given. */
  onBrand?: () => void
  /** Search. The head draws a search box; the collapsed rail an icon. */
  onSearch?: () => void
  /** The search control's accessible name — "Search runs". */
  searchLabel?: string
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
  /** Drawn above the account row — a `RailNotice`. */
  notice?: ReactNode
  /** Who is signed in, and their menu. */
  account?: RailAccount
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

/**
 * The surface's name, the head's first line and the phone bar's middle. A
 * press when there is somewhere to go; the words alone otherwise.
 */
function Brand({ brand, onPress }: { brand: ReactNode; onPress?: () => void }) {
  const face =
    typeof brand === 'string' ? (
      <SizableText size="$5" fontWeight="600" color="$ink" numberOfLines={1}>
        {brand}
      </SizableText>
    ) : (
      brand
    )
  if (!onPress) return <XStack {...slot('rail-brand')} items="center" minW={0}>{face}</XStack>
  return (
    <XStack
      {...slot('rail-brand')}
      {...press(onPress)}
      items="center"
      minW={0}
      rounded="$2"
      cursor="pointer"
      focusVisibleStyle={RING}
    >
      {face}
    </XStack>
  )
}

interface ItemProps {
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
function Item({ label, icon, onPress, active, rail, quiet, expanded, controls, data = 'rail-row' }: ItemProps) {
  return (
    <XStack
      {...slot(data)}
      {...(rail ? tip(label) : null)}
      {...press(onPress)}
      {...ROW}
      items="center"
      justify={rail ? 'center' : 'flex-start'}
      cursor="pointer"
      aria-label={rail ? label : undefined}
      aria-current={active ? 'page' : undefined}
      aria-expanded={expanded}
      aria-controls={controls}
      bg={active ? '$raised' : undefined}
      hoverStyle={{ bg: active ? '$raised' : '$hover' }}
      pressStyle={{ bg: '$raised' }}
      focusVisibleStyle={RING}
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

/** The menu exists when there is something in it to do. */
const hasMenu = (a: RailAccount) => Boolean(a.onSignOut || a.groups?.some((g) => (Array.isArray(g) ? g : g.items).length))

/**
 * The account row: avatar, the name over its second line, the caret — and the
 * menu it opens, anchored to the row itself.
 */
function Who({ account, rail }: { account: RailAccount; rail: boolean }) {
  const [open, setOpen] = useState(false)
  const menu = hasMenu(account)
  const acts = menu || Boolean(account.onPress)
  const said = account.sub ? `${account.name} · ${account.sub}` : account.name

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

  const look = {
    ...slot('rail-account'),
    ...(rail ? tip(said) : null),
    ...ROW,
    gap: '$2',
    px: '$1',
    flex: rail ? undefined : 1,
    minW: 0,
    items: 'center',
    justify: rail ? 'center' : 'flex-start',
    cursor: acts ? 'pointer' : undefined,
    hoverStyle: acts ? ({ bg: '$hover' } as const) : undefined,
    focusVisibleStyle: acts ? RING : undefined,
  } as const

  const body = (
    <>
      {face}
      {rail ? null : (
        <>
          <YStack flex={1} minW={0}>
            <SizableText size="$3" numberOfLines={1} color="$ink">
              {account.name}
            </SizableText>
            {account.sub ? (
              <SizableText {...slot('rail-account-sub')} size="$1" numberOfLines={1} color="$soft">
                {account.sub}
              </SizableText>
            ) : null}
          </YStack>
          {acts ? <ChevronDown size={14} color="$soft" /> : null}
        </>
      )}
    </>
  )

  if (!menu)
    return account.onPress ? (
      <XStack {...look} {...press(account.onPress)} aria-label={rail ? account.name : undefined}>
        {body}
      </XStack>
    ) : (
      <XStack {...look}>{body}</XStack>
    )

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      // Above the row on the open rail, where the row spans the column; beside
      // it on the collapsed rail, where above would cover the rail's icons.
      placement={rail ? 'right-end' : 'top-start'}
      allowFlip
      stayInFrame
    >
      <PopoverTrigger asChild>
        <XStack
          {...look}
          role="button"
          tabIndex={0}
          aria-label={`Account: ${said}`}
          aria-haspopup="menu"
          aria-expanded={open}
          // The trigger opens on a press; the keyboard is this row's own (gui
          // does not activate role="button" on Enter).
          onKeyDown={(e: { key?: string; preventDefault?: () => void }) => {
            if (e?.key !== 'Enter' && e?.key !== ' ') return
            e.preventDefault?.()
            setOpen(!open)
          }}
        >
          {body}
        </XStack>
      </PopoverTrigger>
      <PopoverContent
        {...slot('rail-menu')}
        role="menu"
        aria-label="Account"
        sideOffset={6}
        // A menu's rows run its full width; gui's popper centres children.
        items="stretch"
        width={260}
        maxW="92vw"
        p="$1"
        rounded="$3"
        elevation="$2"
      >
        <Account
          name={account.name}
          email={account.email}
          groups={account.groups}
          onSignOut={account.onSignOut}
          signOutLabel={account.signOutLabel}
          onDone={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  )
}

/** The rail's contents — the same tree in the column and in the drawer. */
function Contents({
  brand,
  onBrand,
  onSearch,
  searchLabel = 'Search',
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
        <YStack items="center" gap="$1" pb="$1">
          <SidebarIconButton
            label="Expand sidebar"
            width={36}
            height={36}
            onPress={() => onCollapse?.(false)}
          >
            {mark ?? <PanelLeft size={16} />}
          </SidebarIconButton>
          {onSearch ? (
            <Item label={searchLabel} icon={<Search size={16} />} onPress={onSearch} rail data="rail-search" />
          ) : null}
        </YStack>
      ) : brand || onSearch ? (
        // Open, the head: the name, and under it the search. In flow, so the
        // rows below start where it ends at any font size.
        <YStack {...slot('rail-head')} gap="$2.5" pt={2} pb="$4" shrink={0}>
          {brand ? (
            <XStack px="$2.5">
              <Brand brand={brand} onPress={onBrand ?? onNew} />
            </XStack>
          ) : null}
          {onSearch ? (
            <XStack
              {...slot('rail-search')}
              {...press(onSearch)}
              aria-label={searchLabel}
              items="center"
              gap="$2"
              px="$2.5"
              height={34}
              rounded="$3"
              borderWidth={1}
              borderColor="$borderColor"
              bg="$panel"
              cursor="pointer"
              hoverStyle={{ bg: '$hover' }}
              focusVisibleStyle={RING}
            >
              <Search size={15} color="$soft" />
              <SizableText size="$2" color="$soft">
                Search
              </SizableText>
            </XStack>
          ) : null}
        </YStack>
      ) : null}

      <YStack {...slot('rail-nav')} gap="$0" role="list">
        {onNew ? (
          <YStack role="listitem">
            <Item label={newLabel} icon={<Plus size={16} />} onPress={onNew} active={fresh} rail={rail} data="rail-new" />
          </YStack>
        ) : null}
        {links.map((link) => (
          <YStack key={link.id} role="listitem">
            <Item label={link.label} icon={link.icon} onPress={link.onPress} active={link.active} rail={rail} />
          </YStack>
        ))}
        {more.length ? (
          <YStack role="listitem">
            <Item
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
                    <Item label={link.label} icon={link.icon} onPress={link.onPress} active={link.active} rail={rail} />
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
                        {...press(() => onOpen(s.id))}
                        {...ROW}
                        items="center"
                        cursor="pointer"
                        aria-current={on ? 'page' : undefined}
                        bg={on ? '$raised' : undefined}
                        hoverStyle={{ bg: on ? '$raised' : '$hover' }}
                        pressStyle={{ bg: '$raised' }}
                        focusVisibleStyle={RING}
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
        {account ? <Who account={account} rail={rail} /> : <XStack flex={1} />}
        {onCollapse && !rail ? (
          <SidebarIconButton label="Collapse sidebar" onPress={() => onCollapse(!collapsed)}>
            <PanelLeft size={16} />
          </SidebarIconButton>
        ) : null}
      </XStack>
    </>
  )
}

/** `run`, then close the drawer — or nothing, when there is nothing to run. */
const closing =
  (close: () => void) =>
  <A extends unknown[]>(run?: (...args: A) => void) =>
    run ? (...args: A) => (close(), run(...args)) : undefined

export function SessionRail(props: SessionRailProps) {
  const {
    // Everything the contents read is named here, so none of it reaches the
    // column as a stray DOM attribute through `rest`.
    brand, onBrand, onSearch, searchLabel, onNew, newLabel, fresh, links, more, moreLabel,
    recents, recentsLabel, active, onOpen, onSort, sortLabel, empty, notice, account,
    collapsed = false, onCollapse, mark, open = false, onOpenChange, label = 'Sessions',
    width = WIDTH,
    ...rest
  } = props
  const rail = collapsed
  const shut = closing(() => onOpenChange?.(false))
  const relink = (list?: RailLink[]) => list?.map((l) => ({ ...l, onPress: shut(l.onPress) }))

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
              {/* Going anywhere from the drawer closes it: the drawer is the way
                  to a place, not a place. Every press in it that leads
                  somewhere is wrapped once, here. */}
              <Contents
                {...props}
                rail={false}
                collapsed={false}
                onCollapse={undefined}
                onBrand={shut(onBrand ?? onNew)}
                onSearch={shut(onSearch)}
                onNew={shut(onNew)}
                onOpen={shut(onOpen)!}
                links={relink(links)}
                more={relink(more)}
                account={
                  account && {
                    ...account,
                    onPress: shut(account.onPress),
                    onSignOut: shut(account.onSignOut),
                    groups: account.groups?.map((g) =>
                      Array.isArray(g)
                        ? g.map((i) => ({ ...i, onPress: shut(i.onPress)! }))
                        : { ...g, items: g.items.map((i) => ({ ...i, onPress: shut(i.onPress)! })) },
                    ),
                  }
                }
              />
            </YStack>
          </SheetContent>
        </Sheet>
      ) : null}
    </>
  )
}

export interface RailNoticeProps extends Row {
  /** The notice's mark, ~16px. */
  icon?: ReactNode
  /** What is on offer, one line. */
  title: string
  /** The action's words — "Set up". */
  action?: string
  onAction?: () => void
  /** Dismissing it. The host remembers that it was. */
  onDismiss?: () => void
  dismissLabel?: string
}

/**
 * RailNotice — a small card at the rail's foot, above the account: an offer
 * ("Try Hanzo in Slack"), its one action, and a way to put it away. Pass it as
 * `SessionRail notice`; the host decides when it shows and remembers a dismissal.
 */
export function RailNotice({
  icon,
  title,
  action,
  onAction,
  onDismiss,
  dismissLabel = 'Dismiss',
  ...rest
}: RailNoticeProps) {
  const id = useId()
  return (
    <XStack
      {...slot('rail-notice')}
      items="center"
      gap="$2.5"
      px="$3"
      py="$2.5"
      rounded="$3"
      borderWidth={1}
      borderColor="$borderColor"
      bg="$panel"
      {...rest}
    >
      {icon ? (
        <XStack shrink={0} aria-hidden>
          {icon}
        </XStack>
      ) : null}
      <YStack flex={1} minW={0} gap="$0.5">
        <SizableText id={`${id}-title`} size="$2" color="$ink" numberOfLines={1}>
          {title}
        </SizableText>
        {action && onAction ? (
          <XStack
            {...slot('rail-notice-action')}
            {...press(onAction)}
            // "Set up" alone is ambiguous out of context; the title says what.
            aria-describedby={`${id}-title`}
            self="flex-start"
            cursor="pointer"
            rounded="$1"
            focusVisibleStyle={RING}
          >
            <SizableText size="$1" color="$soft" textDecorationLine="underline">
              {action}
            </SizableText>
          </XStack>
        ) : null}
      </YStack>
      {onDismiss ? (
        <XStack
          {...slot('rail-notice-dismiss')}
          {...press(onDismiss)}
          {...tip(dismissLabel)}
          aria-label={dismissLabel}
          p="$1"
          rounded="$2"
          cursor="pointer"
          hoverStyle={{ bg: '$hover' }}
          focusVisibleStyle={RING}
        >
          <X size={14} />
        </XStack>
      ) : null}
    </XStack>
  )
}

export interface RailBarProps extends Row {
  /** Opens the rail's drawer. */
  onMenu: () => void
  /** The menu button's accessible name — "Open runs". */
  menuLabel?: string
  /** The surface's name, as the rail's head draws it. */
  brand?: ReactNode
  /** Pressing the brand. */
  onBrand?: () => void
  /** Search, as the rail's head offers it. */
  onSearch?: () => void
  searchLabel?: string
}

/**
 * RailBar — the phone's header for a surface with a `SessionRail`: the menu
 * that opens the rail's drawer, the brand, and search on the right. Only below
 * `md`, where there is no rail; from `md` up it draws nothing and the rail's own
 * head carries the same three. Place it at the top of the pane, in flow.
 */
export function RailBar({
  onMenu,
  menuLabel = 'Open menu',
  brand,
  onBrand,
  onSearch,
  searchLabel = 'Search',
  ...rest
}: RailBarProps) {
  return (
    <XStack
      {...slot('rail-bar')}
      height={44}
      px="$2"
      gap="$2"
      items="center"
      shrink={0}
      $md={{ display: 'none' }}
      {...rest}
    >
      <Button variant="ghost" size="icon-sm" onPress={onMenu} aria-label={menuLabel}>
        <Menu size={18} />
      </Button>
      {brand ? <Brand brand={brand} onPress={onBrand} /> : null}
      <XStack flex={1} />
      {onSearch ? (
        <Button variant="ghost" size="icon-sm" onPress={onSearch} aria-label={searchLabel}>
          <Search size={18} />
        </Button>
      ) : null}
    </XStack>
  )
}
