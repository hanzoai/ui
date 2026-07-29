'use client'

/**
 * DropdownMenu — the ONE compound menu, native to @hanzo/gui.
 *
 * @hanzogui/menu already ships the whole compound surface (Root/Trigger/Portal/
 * Content/Group/Label/Item/CheckboxItem/RadioGroup/RadioItem/ItemIndicator/
 * Separator/Sub/SubTrigger/SubContent) with the a11y, roving focus, popper
 * placement and dismiss behaviour. This file only FLATTENS `Menu.X` into the 15
 * `DropdownMenuX` names and dresses them in the Hanzo tokens, so the shadcn
 * compound API and the gui API converge on a single component rather than two
 * shapes of the same idea.
 *
 * Cross-platform: gui style props only — no Tailwind class strings, no Radix, no
 * DOM APIs. Rows are 32px tall (the design density) with a 6px vertical `hitSlop`
 * so the real tap target is 44px on touch hosts.
 *
 * `DropdownMenuContent` mounts its OWN `Menu.Portal`, so callers never wrap it —
 * and re-applies the trigger's resolved theme inside the portal via `PortalTheme`
 * (gui portals re-root the subtree, so React theme context does not flow).
 */
import * as React from 'react'
import { Menu, Text, XStack } from '@hanzo/gui'
import { Check, ChevronRight, Circle } from '@hanzogui/lucide-icons-2'
import { PortalTheme, useThemeName } from '../../product/menu/portal-theme'

// ── Geometry — literal px on the 8-grid; 32px row + 6px hitSlop = 44px tap ──────
const ROW_H = 32
const TAP_MIN = 44
const HIT_SLOP = { top: (TAP_MIN - ROW_H) / 2, bottom: (TAP_MIN - ROW_H) / 2, left: 0, right: 0 }
const ROW_PX = 8
const INSET_PL = 32
const INDICATOR_SLOT = 14
const ICON = 16

const panel = {
  bg: '$color2',
  borderColor: '$borderColor',
  borderWidth: 1,
  rounded: '$4',
  p: 4,
  minW: 128,
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
  hitSlop: HIT_SLOP,
  hoverStyle: { bg: '$color5' },
  focusStyle: { bg: '$color5' },
  pressStyle: { bg: '$color6' },
} as const

/** Left indicator well shared by checkbox + radio rows (shadcn's `absolute left-2`). */
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

// ── Root — owns popper geometry ─────────────────────────────────────────────────
// gui puts `offset` on the Popper ROOT; the compound API puts `sideOffset` on
// Content. One value, one owner: the root holds it, Content publishes into it.
const OffsetContext = React.createContext<((n: number) => void) | null>(null)
const DEFAULT_OFFSET = 4

type RootProps = Omit<React.ComponentProps<typeof Menu>, 'offset'> & { offset?: number }

function DropdownMenu({ offset = DEFAULT_OFFSET, ...props }: RootProps) {
  const [current, setOffset] = React.useState(offset)
  React.useEffect(() => setOffset(offset), [offset])
  return (
    <OffsetContext.Provider value={setOffset}>
      <Menu offset={current} {...props} />
    </OffsetContext.Provider>
  )
}

// ── Passthroughs — the gui part already IS the part ─────────────────────────────
const DropdownMenuTrigger = Menu.Trigger
const DropdownMenuGroup = Menu.Group
const DropdownMenuPortal = Menu.Portal
const DropdownMenuSub = Menu.Sub
const DropdownMenuRadioGroup = Menu.RadioGroup

// ── Content — self-portalling, theme-forwarded ──────────────────────────────────
type ContentProps = React.ComponentProps<typeof Menu.Content> & { sideOffset?: number }

const DropdownMenuContent = React.forwardRef<
  React.ComponentRef<typeof Menu.Content>,
  ContentProps
>(({ sideOffset = DEFAULT_OFFSET, children, ...props }, ref) => {
  const themeName = useThemeName()
  const setOffset = React.useContext(OffsetContext)
  React.useEffect(() => setOffset?.(sideOffset), [setOffset, sideOffset])
  return (
    <Menu.Portal>
      <PortalTheme name={themeName}>
        <Menu.Content ref={ref} data-slot="dropdown-menu-content" {...panel} {...props}>
          {children}
        </Menu.Content>
      </PortalTheme>
    </Menu.Portal>
  )
})
DropdownMenuContent.displayName = 'DropdownMenuContent'

const DropdownMenuSubContent = React.forwardRef<
  React.ComponentRef<typeof Menu.SubContent>,
  React.ComponentProps<typeof Menu.SubContent>
>((props, ref) => (
  <Menu.SubContent ref={ref} data-slot="dropdown-menu-sub-content" {...panel} {...props} />
))
DropdownMenuSubContent.displayName = 'DropdownMenuSubContent'

// ── Rows ────────────────────────────────────────────────────────────────────────
type ItemProps = Omit<React.ComponentProps<typeof Menu.Item>, 'variant'> & {
  inset?: boolean
  variant?: 'default' | 'destructive'
}

const DropdownMenuItem = React.forwardRef<React.ComponentRef<typeof Menu.Item>, ItemProps>(
  ({ inset, variant = 'default', disabled, ...props }, ref) => (
    <Menu.Item
      ref={ref}
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      disabled={disabled}
      {...row}
      pl={inset ? INSET_PL : ROW_PX}
      theme={variant === 'destructive' ? 'red' : undefined}
      opacity={disabled ? 0.5 : 1}
      cursor={disabled ? 'default' : 'pointer'}
      {...props}
    />
  ),
)
DropdownMenuItem.displayName = 'DropdownMenuItem'

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ComponentRef<typeof Menu.CheckboxItem>,
  React.ComponentProps<typeof Menu.CheckboxItem>
>(({ children, checked, ...props }, ref) => (
  <Menu.CheckboxItem ref={ref} data-slot="dropdown-menu-checkbox-item" checked={checked} {...row} pl={INSET_PL} {...props}>
    <Indicator>
      <Check size={ICON} />
    </Indicator>
    {children}
  </Menu.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName = 'DropdownMenuCheckboxItem'

const DropdownMenuRadioItem = React.forwardRef<
  React.ComponentRef<typeof Menu.RadioItem>,
  React.ComponentProps<typeof Menu.RadioItem>
>(({ children, ...props }, ref) => (
  <Menu.RadioItem ref={ref} data-slot="dropdown-menu-radio-item" {...row} pl={INSET_PL} {...props}>
    <Indicator>
      <Circle size={8} fill="currentColor" />
    </Indicator>
    {children}
  </Menu.RadioItem>
))
DropdownMenuRadioItem.displayName = 'DropdownMenuRadioItem'

const DropdownMenuSubTrigger = React.forwardRef<
  React.ComponentRef<typeof Menu.SubTrigger>,
  React.ComponentProps<typeof Menu.SubTrigger> & { inset?: boolean }
>(({ inset, children, ...props }, ref) => (
  <Menu.SubTrigger
    ref={ref}
    data-slot="dropdown-menu-sub-trigger"
    data-inset={inset}
    {...row}
    pl={inset ? INSET_PL : ROW_PX}
    {...props}
  >
    {children}
    <ChevronRight size={ICON} ml="auto" opacity={0.6} />
  </Menu.SubTrigger>
))
DropdownMenuSubTrigger.displayName = 'DropdownMenuSubTrigger'

// ── Static rows ─────────────────────────────────────────────────────────────────
const DropdownMenuLabel = React.forwardRef<
  React.ComponentRef<typeof Menu.Label>,
  React.ComponentProps<typeof Menu.Label> & { inset?: boolean }
>(({ inset, ...props }, ref) => (
  <Menu.Label
    ref={ref}
    data-slot="dropdown-menu-label"
    data-inset={inset}
    px={ROW_PX}
    py={4}
    pl={inset ? INSET_PL : ROW_PX}
    fontSize="$2"
    fontWeight="500"
    color="$color12"
    select="none"
    {...props}
  />
))
DropdownMenuLabel.displayName = 'DropdownMenuLabel'

const DropdownMenuSeparator = React.forwardRef<
  React.ComponentRef<typeof Menu.Separator>,
  React.ComponentProps<typeof Menu.Separator>
>((props, ref) => (
  <Menu.Separator ref={ref} data-slot="dropdown-menu-separator" height={1} bg="$borderColor" mx={4} my={4} {...props} />
))
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator'

/** Right-aligned shortcut hint. gui `Text`, not a raw `<span>`, so it renders on native. */
function DropdownMenuShortcut(props: React.ComponentProps<typeof Text>) {
  return (
    <Text
      data-slot="dropdown-menu-shortcut"
      ml="auto"
      fontSize="$1"
      letterSpacing={1}
      color="$color11"
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}
