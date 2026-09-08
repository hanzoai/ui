'use client'

/**
 * Menubar — a persistent row of pull-down menus, the kind a desktop app keeps
 * across the top of its window (File, Edit, View, ...).
 *
 * Each `MenubarMenu` is its own `@hanzo/gui` `Menu`, so a single trigger click
 * opens a real menu with the full compound surface (items, checkbox items, a
 * radio group, separators, a label, a submenu) and every a11y/dismiss/typeahead
 * behaviour that `Menu` already has. What THIS file adds on top, because a row
 * of independent menus is not yet a menubar, is the coordination between them:
 * one open menu at a time, hovering a sibling trigger while a menu is open
 * switches to it instead of requiring a second click, and the arrow keys rove
 * focus across the triggers (Home/End jump to the first/last). That state lives
 * in one root context, read by `MenubarTrigger` and `MenubarMenu` — neither
 * hand-rolls it a second time.
 *
 * The rows, checkbox rows, radio rows, label, separator and submenu below are
 * the same 32px-row, 8px-gutter, 44px-tap design as `dropdown-menu.tsx` and
 * `context-menu.tsx` — one menu design, not three. `MenubarContent` mounts its
 * own `Menu.Portal` and re-applies the trigger's resolved theme inside it via
 * `PortalTheme` (gui portals re-root the subtree, so React theme context does
 * not otherwise flow there).
 *
 * Cross-platform: gui style props only — no Tailwind class strings, no Radix,
 * no DOM APIs beyond the `data-slot` markers every gui backend component uses
 * to publish its parts for CSS and tests.
 */
import * as React from 'react'
import { Menu, Text, XStack, type GuiElement } from '@hanzo/gui'
import { Check, ChevronRight, Circle } from '@hanzogui/lucide-icons-2'

import { touch } from './gesture'
import { ink } from './ink'
import { slot } from './slot'
import { PortalTheme, useThemeName } from '../../product/menu/portal-theme'

// ── Geometry — the one menu design, restated (module-private in the siblings) ──
const ROW_H = 32
const TAP_MIN = 44
const ROW_PX = 8
const MIN_W = 192
const INSET_PL = 32
const INDICATOR_SLOT = 14
const ICON = 16
const BAR_H = 40

const panel = {
  bg: '$panel',
  borderColor: '$borderColor',
  borderWidth: 1,
  rounded: '$4',
  p: 4,
  minW: MIN_W,
  overflow: 'hidden',
  shadowColor: 'rgba(0,0,0,0.45)',
  shadowRadius: 20,
  shadowOffset: { width: 0, height: 10 },
} as const

const row = {
  items: 'center',
  gap: ROW_PX,
  px: ROW_PX,
  minH: ROW_H,
  rounded: '$3',
  select: 'none',
  cursor: 'pointer',
  ...touch(ROW_H, TAP_MIN, 'y'),
  hoverStyle: { bg: '$raised' },
  focusStyle: { bg: '$raised' },
  pressStyle: { bg: '$rim' },
} as const

/** Row text style — free-form children go through `ink()` so a bare string renders on native. */
const label = { size: '$2', color: '$ink' } as const
/** Trigger text style — same type scale, medium weight to read as a menu title. */
const triggerLabel = { size: '$2', color: '$ink', fontWeight: '500' } as const

/** Left indicator well shared by checkbox + radio rows. */
const Indicator = ({ children }: { children: React.ReactNode }) => (
  <XStack
    position="absolute"
    l={ROW_PX}
    width={INDICATOR_SLOT}
    height={INDICATOR_SLOT}
    items="center"
    justify="center"
    pointerEvents="none"
  >
    <Menu.ItemIndicator>{children}</Menu.ItemIndicator>
  </XStack>
)

// ── Root — one open menu at a time, arrow keys rove the triggers ───────────────
type MenubarState = {
  value: string | undefined
  setValue: (value: string | undefined) => void
}
const MenubarContext = /* @__PURE__ */ React.createContext<MenubarState | null>(null)
/** Which menu a `MenubarMenu` is, read by its `MenubarTrigger`. */
const MenubarMenuIdContext = /* @__PURE__ */ React.createContext<string | null>(null)

// gui puts popper geometry (`offset`, `placement`) on the `Menu` ROOT, while the
// compound API puts `sideOffset`/`align` on `Content` — one value, one owner:
// the root holds it, Content publishes into it via these two contexts, freshly
// scoped per `MenubarMenu` instance. Same split as `dropdown-menu.tsx`.
const OffsetContext = /* @__PURE__ */ React.createContext<((n: number) => void) | null>(null)
type Placement = NonNullable<React.ComponentProps<typeof Menu>['placement']>
const PlacementContext = /* @__PURE__ */ React.createContext<
  ((p: Placement | undefined) => void) | null
>(null)
const DEFAULT_OFFSET = 8

export type MenubarProps = Omit<React.ComponentProps<typeof XStack>, 'onValueChange'> & {
  /** Which menu is open, by its `MenubarMenu`'s `value`. Controlled. */
  value?: string
  defaultValue?: string
  onValueChange?: (value: string | undefined) => void
}

function Menubar({ value, defaultValue, onValueChange, children, ...props }: MenubarProps) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue)
  const active = value !== undefined ? value : uncontrolled
  const setValue = React.useCallback(
    (next: string | undefined) => {
      if (value === undefined) setUncontrolled(next)
      onValueChange?.(next)
    },
    [value, onValueChange],
  )

  /** Arrow/Home/End rove the triggers; a live menu follows focus onto the next one. */
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    const root = event.currentTarget as HTMLElement
    const triggers = [...root.querySelectorAll<HTMLElement>('[data-slot="menubar-trigger"]')]
    const at = triggers.indexOf(document.activeElement as HTMLElement)
    if (at === -1) return
    event.preventDefault()
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? triggers.length - 1
          : event.key === 'ArrowRight'
            ? (at + 1) % triggers.length
            : (at - 1 + triggers.length) % triggers.length
    triggers[next]?.focus()
    if (active !== undefined) setValue(triggers[next]?.dataset.menubarValue)
  }

  return (
    <MenubarContext.Provider value={{ value: active, setValue }}>
      <XStack
        {...slot('menubar')}
        role="menubar"
        items="center"
        gap={4}
        p={4}
        minH={BAR_H}
        rounded="$4"
        borderWidth={1}
        borderColor="$borderColor"
        bg="$background"
        onKeyDown={onKeyDown}
        {...props}
      >
        {children}
      </XStack>
    </MenubarContext.Provider>
  )
}

export type MenubarMenuProps = React.ComponentProps<typeof Menu> & {
  /** Identifies this menu to the root's `value`/`onValueChange`. Auto-generated if omitted. */
  value?: string
}

function MenubarMenu({ value, children, ...props }: MenubarMenuProps) {
  const root = React.useContext(MenubarContext)
  const auto = React.useId()
  const id = value ?? auto
  const [offset, setOffset] = React.useState(DEFAULT_OFFSET)
  const [placement, setPlacement] = React.useState<Placement | undefined>(undefined)
  return (
    <MenubarMenuIdContext.Provider value={id}>
      <OffsetContext.Provider value={setOffset}>
        <PlacementContext.Provider value={setPlacement}>
          <Menu
            open={root ? root.value === id : undefined}
            onOpenChange={(open: boolean) => root?.setValue(open ? id : undefined)}
            offset={offset}
            {...(placement ? { placement } : null)}
            {...props}
          >
            {children}
          </Menu>
        </PlacementContext.Provider>
      </OffsetContext.Provider>
    </MenubarMenuIdContext.Provider>
  )
}

// ── Trigger — a click opens it; hovering a sibling while one is open switches ──
export type MenubarTriggerProps = React.ComponentProps<typeof Menu.Trigger>

const MenubarTrigger: React.ForwardRefExoticComponent<
  MenubarTriggerProps & React.RefAttributes<GuiElement>
> = /* @__PURE__ */ React.forwardRef<GuiElement, MenubarTriggerProps>(function MenubarTrigger({ children, onMouseEnter, ...props }, ref) {
  const root = React.useContext(MenubarContext)
  const id = React.useContext(MenubarMenuIdContext)
  const open = root != null && id != null && root.value === id
  return (
    <Menu.Trigger
      ref={ref}
      {...slot('menubar-trigger')}
      // read back by the root's arrow-key rove to know which menu a trigger opens
      data-menubar-value={id ?? undefined}
      data-state={open ? 'open' : 'closed'}
      tabIndex={0}
      items="center"
      select="none"
      cursor="pointer"
      px={12}
      minH={ROW_H}
      rounded="$3"
      bg={open ? '$raised' : 'transparent'}
      hoverStyle={{ bg: '$raised' }}
      focusStyle={{ bg: '$raised' }}
      {...touch(ROW_H, TAP_MIN, 'y')}
      onMouseEnter={(event: React.MouseEvent) => {
        if (root?.value !== undefined && id != null) root.setValue(id)
        onMouseEnter?.(event as never)
      }}
      {...props}
    >
      {ink(children, undefined, triggerLabel)}
    </Menu.Trigger>
  )
})

// ── Content — self-portalling, theme-forwarded ──────────────────────────────────
export type MenubarContentProps = React.ComponentProps<typeof Menu.Content> & {
  sideOffset?: number
  align?: 'start' | 'center' | 'end'
}

/** `align`, as the suffix of the floating-ui placement string the root's `Menu` reads. */
const placementFor = (align: 'start' | 'center' | 'end' | undefined): Placement =>
  align && align !== 'center' ? (`bottom-${align}` as Placement) : ('bottom' as Placement)

const MenubarContent = /* @__PURE__ */ React.forwardRef<GuiElement, MenubarContentProps>(
  function MenubarContent({ sideOffset = DEFAULT_OFFSET, align = 'start', children, ...props }, ref) {
    const themeName = useThemeName()
    const setOffset = React.useContext(OffsetContext)
    const setPlacement = React.useContext(PlacementContext)
    React.useEffect(() => setOffset?.(sideOffset), [setOffset, sideOffset])
    React.useEffect(() => setPlacement?.(placementFor(align)), [setPlacement, align])
    return (
      <Menu.Portal>
        <PortalTheme name={themeName}>
          <Menu.Content ref={ref} {...slot('menubar-content')} {...panel} {...props}>
            {children}
          </Menu.Content>
        </PortalTheme>
      </Menu.Portal>
    )
  },
)

const MenubarSubContent = /* @__PURE__ */ React.forwardRef<
  GuiElement,
  React.ComponentProps<typeof Menu.SubContent>
>(function MenubarSubContent(props, ref) {
  return <Menu.SubContent ref={ref} {...slot('menubar-sub-content')} {...panel} {...props} />
})

// ── Rows ────────────────────────────────────────────────────────────────────────
export type MenubarItemProps = Omit<
  React.ComponentProps<typeof Menu.Item>,
  'inset' | 'variant'
> & {
  inset?: boolean
  variant?: 'default' | 'destructive'
}

const MenubarItem = /* @__PURE__ */ React.forwardRef<GuiElement, MenubarItemProps>(
  function MenubarItem({ inset, variant = 'default', disabled, children, ...props }, ref) {
    return (
      <Menu.Item
        ref={ref}
        {...slot('menubar-item')}
        data-inset={inset}
        data-variant={variant}
        disabled={disabled}
        {...row}
        pl={inset ? INSET_PL : ROW_PX}
        theme={variant === 'destructive' ? 'red' : undefined}
        opacity={disabled ? 0.5 : 1}
        cursor={disabled ? 'default' : 'pointer'}
        {...props}
      >
        {ink(children, undefined, label)}
      </Menu.Item>
    )
  },
)

const MenubarCheckboxItem = /* @__PURE__ */ React.forwardRef<
  GuiElement,
  React.ComponentProps<typeof Menu.CheckboxItem>
>(function MenubarCheckboxItem({ children, checked, ...props }, ref) {
  return (
    <Menu.CheckboxItem
      ref={ref}
      {...slot('menubar-checkbox-item')}
      checked={checked}
      {...row}
      pl={INSET_PL}
      {...props}
    >
      <Indicator>
        <Check size={ICON} />
      </Indicator>
      {ink(children, undefined, label)}
    </Menu.CheckboxItem>
  )
})

const MenubarRadioItem = /* @__PURE__ */ React.forwardRef<
  GuiElement,
  React.ComponentProps<typeof Menu.RadioItem>
>(function MenubarRadioItem({ children, value, ...props }, ref) {
  return (
    <Menu.RadioItem
      ref={ref}
      {...slot('menubar-radio-item')}
      value={value}
      {...row}
      pl={INSET_PL}
      {...props}
    >
      <Indicator>
        <Circle size={8} fill="currentColor" />
      </Indicator>
      {ink(children, undefined, label)}
    </Menu.RadioItem>
  )
})

const MenubarSubTrigger = /* @__PURE__ */ React.forwardRef<
  GuiElement,
  Omit<React.ComponentProps<typeof Menu.SubTrigger>, 'inset'> & { inset?: boolean }
>(function MenubarSubTrigger({ inset, children, ...props }, ref) {
  return (
    <Menu.SubTrigger
      ref={ref}
      {...slot('menubar-sub-trigger')}
      data-inset={inset}
      {...row}
      pl={inset ? INSET_PL : ROW_PX}
      {...props}
    >
      {ink(children, undefined, label)}
      <ChevronRight size={ICON} ml="auto" opacity={0.6} />
    </Menu.SubTrigger>
  )
})

// ── Static rows ─────────────────────────────────────────────────────────────────
const MenubarLabel = /* @__PURE__ */ React.forwardRef<
  GuiElement,
  Omit<React.ComponentProps<typeof Menu.Label>, 'inset'> & { inset?: boolean }
>(function MenubarLabel({ inset, ...props }, ref) {
  return (
    <Menu.Label
      ref={ref}
      {...slot('menubar-label')}
      data-inset={inset}
      px={ROW_PX}
      py={4}
      pl={inset ? INSET_PL : ROW_PX}
      fontSize="$2"
      fontWeight="500"
      color="$ink"
      select="none"
      {...props}
    />
  )
})

const MenubarSeparator = /* @__PURE__ */ React.forwardRef<
  GuiElement,
  React.ComponentProps<typeof Menu.Separator>
>(function MenubarSeparator(props, ref) {
  return (
    <Menu.Separator
      ref={ref}
      {...slot('menubar-separator')}
      height={1}
      bg="$borderColor"
      mx={4}
      my={4}
      {...props}
    />
  )
})

/** Right-aligned shortcut hint. gui `Text`, not a raw `<span>`, so it renders on native. */
function MenubarShortcut(props: React.ComponentProps<typeof Text>) {
  return (
    <Text {...slot('menubar-shortcut')} ml="auto" fontSize="$1" letterSpacing={1} color="$quiet" {...props} />
  )
}

// ── Passthroughs — the gui part already IS the part ─────────────────────────────
const MenubarGroup: typeof Menu.Group = Menu.Group
const MenubarPortal: typeof Menu.Portal = Menu.Portal
const MenubarSub: typeof Menu.Sub = Menu.Sub
const MenubarRadioGroup: typeof Menu.RadioGroup = Menu.RadioGroup

export {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarCheckboxItem,
  MenubarRadioItem,
  MenubarLabel,
  MenubarSeparator,
  MenubarShortcut,
  MenubarGroup,
  MenubarPortal,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarRadioGroup,
}
