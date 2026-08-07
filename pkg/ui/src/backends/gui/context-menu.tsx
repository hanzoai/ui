'use client'

/**
 * ContextMenu — the right-click menu, native to @hanzo/gui.
 *
 * `@hanzogui/context-menu` already ships the whole compound surface (Root/Trigger/
 * Portal/Content/Group/Label/Item/CheckboxItem/RadioGroup/RadioItem/ItemIndicator/
 * Separator/Sub/SubTrigger/SubContent) with the a11y (`role="menu"`,
 * `menuitem`/`menuitemcheckbox`/`menuitemradio` + `aria-checked`, `aria-expanded`
 * on a SubTrigger), the roving arrow-key focus, the typeahead, the cursor
 * anchoring and the dismiss behaviour. It IS `Menu` with an `onContextMenu` (and
 * a 700ms long-press on touch) trigger instead of a click one. This file only
 * FLATTENS `ContextMenu.X` into the 15 `ContextMenuX` names and dresses them in
 * the Hanzo tokens, so there is one menu design rather than two shapes of it.
 *
 * NO RENAMES. The API is @radix-ui/react-context-menu's, prop for prop — a
 * consumer migrates by changing the import and nothing else. The `side`/`align`/
 * `sideOffset` hoist that Popover and HoverCard need does not arise here: a
 * context menu is anchored at the cursor, so Radix never put those on its
 * Content either (gui `Omit`s them for the same reason).
 *
 * Cross-platform: gui style props only — no Tailwind class strings, no Radix, no
 * DOM APIs. Rows are 32px tall (the design density) and `touch()` lifts the real
 * tap target to 44px — on web and Tauri as well as native.
 *
 * `ContextMenuContent` mounts its OWN `ContextMenu.Portal`, so callers never wrap
 * it — and re-applies the trigger's resolved theme inside the portal via
 * `PortalTheme` (gui portals re-root the subtree, so React theme context does not
 * flow).
 *
 * The geometry below is the SAME 32px row, 8px gutter, 44px tap and panel
 * treatment as `dropdown-menu.tsx` — two menu geometries would be two design
 * systems. It is restated rather than imported only because those constants are
 * module-private there; hoist both onto one module when the barrel is wired.
 */
import * as React from 'react'
import { ContextMenu as GuiContextMenu, Text, XStack, type GuiElement } from '@hanzo/gui'
import { Check, ChevronRight, Circle } from '@hanzogui/lucide-icons-2'

import { touch } from './gesture'
import { ink } from './ink'
import { slot } from './slot'
import { PortalTheme, useThemeName } from '../../product/menu/portal-theme'

// ── Geometry — literal px on the 8-grid; a 32px row expands to a 44px tap ──────
const ROW_H = 32
const TAP_MIN = 44
const ROW_PX = 8
/** The one menu width floor — shared with DropdownMenu. */
const MIN_W = 200
const INSET_PL = 32
const INDICATOR_SLOT = 14
const ICON = 16

const panel = {
  bg: '$color2',
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
  hoverStyle: { bg: '$color5' },
  focusStyle: { bg: '$color5' },
  pressStyle: { bg: '$color6' },
} as const

/** Row text style — free-form children go through `ink()` so a bare string renders on native. */
const label = { size: '$2', color: '$color12' } as const

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
    <GuiContextMenu.ItemIndicator>{children}</GuiContextMenu.ItemIndicator>
  </XStack>
)

// ── Passthroughs — the gui part already IS the part ─────────────────────────────
const ContextMenu: typeof GuiContextMenu = GuiContextMenu
const ContextMenuTrigger: typeof GuiContextMenu.Trigger = GuiContextMenu.Trigger
const ContextMenuGroup: typeof GuiContextMenu.Group = GuiContextMenu.Group
const ContextMenuPortal: typeof GuiContextMenu.Portal = GuiContextMenu.Portal
const ContextMenuSub: typeof GuiContextMenu.Sub = GuiContextMenu.Sub
const ContextMenuRadioGroup: typeof GuiContextMenu.RadioGroup = GuiContextMenu.RadioGroup

// ── Content — self-portalling, theme-forwarded ──────────────────────────────────
export type ContextMenuContentProps = React.ComponentProps<typeof GuiContextMenu.Content>
export type ContextMenuSubContentProps = React.ComponentProps<typeof GuiContextMenu.SubContent>

/**
 * Both Content forwardRefs carry an EXPLICIT type. `tsc --noEmit` is happy without
 * one; the build is not (TS2742). Declaration emit has to name the inferred type,
 * and gui's context-menu types resolve through `@hanzogui/context-menu`'s own
 * `createNonNativeContextMenu` plus `react-native` — paths reachable from gui but
 * not from this package's `dist/`, so the emitted `.d.ts` referenced files a
 * consumer does not have. Naming the props type (which is exported, hence
 * portable) is what keeps the declaration self-contained. Only these two hit it:
 * the row components are declared through `ContextMenuItemProps`, which is already
 * a named export.
 */
const ContextMenuContent: React.ForwardRefExoticComponent<
  ContextMenuContentProps & React.RefAttributes<GuiElement>
> = /* @__PURE__ */ React.forwardRef<GuiElement, ContextMenuContentProps>(
  function ContextMenuContent({ children, ...props }, ref) {
    const themeName = useThemeName()
    return (
      <GuiContextMenu.Portal>
        <PortalTheme name={themeName}>
          <GuiContextMenu.Content ref={ref} {...slot('context-menu-content')} {...panel} {...props}>
            {children}
          </GuiContextMenu.Content>
        </PortalTheme>
      </GuiContextMenu.Portal>
    )
  },
)

const ContextMenuSubContent: React.ForwardRefExoticComponent<
  ContextMenuSubContentProps & React.RefAttributes<GuiElement>
> = /* @__PURE__ */ React.forwardRef<GuiElement, ContextMenuSubContentProps>(
  function ContextMenuSubContent(props, ref) {
    return (
      <GuiContextMenu.SubContent
        ref={ref}
        {...slot('context-menu-sub-content')}
        {...panel}
        {...props}
      />
    )
  },
)

// ── Rows ────────────────────────────────────────────────────────────────────────
/**
 * `inset` and `variant` are Radix's, and both are ALSO gui style props (`inset` is
 * the CSS shorthand, `variant` a styled-component variant). Omitting them first is
 * what makes `inset` a boolean flag again rather than an intersection with gui's
 * type, under which the literal `true` does not typecheck.
 */
export type ContextMenuItemProps = Omit<
  React.ComponentProps<typeof GuiContextMenu.Item>,
  'inset' | 'variant'
> & {
  inset?: boolean
  variant?: 'default' | 'destructive'
}

const ContextMenuItem = /* @__PURE__ */ React.forwardRef<GuiElement, ContextMenuItemProps>(
  function ContextMenuItem({ inset, variant = 'default', disabled, children, ...props }, ref) {
    return (
      <GuiContextMenu.Item
        ref={ref}
        {...slot('context-menu-item')}
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
      </GuiContextMenu.Item>
    )
  },
)

const ContextMenuCheckboxItem = /* @__PURE__ */ React.forwardRef<
  GuiElement,
  React.ComponentProps<typeof GuiContextMenu.CheckboxItem>
>(function ContextMenuCheckboxItem({ children, checked, ...props }, ref) {
  return (
    <GuiContextMenu.CheckboxItem
      ref={ref}
      {...slot('context-menu-checkbox-item')}
      checked={checked}
      {...row}
      pl={INSET_PL}
      {...props}
    >
      <Indicator>
        <Check size={ICON} />
      </Indicator>
      {ink(children, undefined, label)}
    </GuiContextMenu.CheckboxItem>
  )
})

const ContextMenuRadioItem = /* @__PURE__ */ React.forwardRef<
  GuiElement,
  React.ComponentProps<typeof GuiContextMenu.RadioItem>
>(function ContextMenuRadioItem({ children, value, ...props }, ref) {
  return (
    <GuiContextMenu.RadioItem
      ref={ref}
      {...slot('context-menu-radio-item')}
      // Named rather than left to the spread: gui's native-menu wrapper types the
      // part as a UNION of prop shapes, and a rest spread cannot prove the
      // required `value` survived it.
      value={value}
      {...row}
      pl={INSET_PL}
      {...props}
    >
      <Indicator>
        <Circle size={8} fill="currentColor" />
      </Indicator>
      {ink(children, undefined, label)}
    </GuiContextMenu.RadioItem>
  )
})

/**
 * gui casts `SubTrigger` to a bare `React.FC` ("to avoid TS error", its words),
 * which drops `ref` from the type while the runtime still forwards it. One cast,
 * in one place, so the part keeps the ref every other row in this file has.
 */
const SubTriggerBase = GuiContextMenu.SubTrigger as React.FC<
  React.ComponentProps<typeof GuiContextMenu.SubTrigger> & React.RefAttributes<GuiElement>
>

const ContextMenuSubTrigger = /* @__PURE__ */ React.forwardRef<
  GuiElement,
  Omit<React.ComponentProps<typeof GuiContextMenu.SubTrigger>, 'inset'> & { inset?: boolean }
>(function ContextMenuSubTrigger({ inset, children, ...props }, ref) {
  return (
    <SubTriggerBase
      ref={ref}
      {...slot('context-menu-sub-trigger')}
      data-inset={inset}
      {...row}
      pl={inset ? INSET_PL : ROW_PX}
      {...props}
    >
      {ink(children, undefined, label)}
      <ChevronRight size={ICON} ml="auto" opacity={0.6} />
    </SubTriggerBase>
  )
})

// ── Static rows ─────────────────────────────────────────────────────────────────
const ContextMenuLabel = /* @__PURE__ */ React.forwardRef<
  GuiElement,
  Omit<React.ComponentProps<typeof GuiContextMenu.Label>, 'inset'> & { inset?: boolean }
>(function ContextMenuLabel({ inset, ...props }, ref) {
  return (
    <GuiContextMenu.Label
      ref={ref}
      {...slot('context-menu-label')}
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
  )
})

const ContextMenuSeparator = /* @__PURE__ */ React.forwardRef<
  GuiElement,
  React.ComponentProps<typeof GuiContextMenu.Separator>
>(function ContextMenuSeparator(props, ref) {
  return (
    <GuiContextMenu.Separator
      ref={ref}
      {...slot('context-menu-separator')}
      height={1}
      bg="$borderColor"
      mx={4}
      my={4}
      {...props}
    />
  )
})

/** Right-aligned shortcut hint. gui `Text`, not a raw `<span>`, so it renders on native. */
function ContextMenuShortcut(props: React.ComponentProps<typeof Text>) {
  return (
    <Text
      {...slot('context-menu-shortcut')}
      ml="auto"
      fontSize="$1"
      letterSpacing={1}
      color="$color11"
      {...props}
    />
  )
}

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
}
