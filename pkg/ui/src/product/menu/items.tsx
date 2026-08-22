'use client'

/**
 * The ONE menu-item spec — every menu across the fleet renders through these
 * presentational primitives, so DropdownMenu, ContextMenu, SelectMenu and ComboBox
 * are pixel-identical. Geometry is literal px on a strict 8-grid (never random);
 * colour is theme-adaptive tokens ($panel/$quiet/$ink/$borderColor) so light
 * and dark both work, over the design tokens `@hanzo/ui/theme.css` defines.
 *
 * Style props use the @hanzo/gui config shorthands (bg/items/justify/px/py/p/mx/my/
 * minW/maxH/rounded/select/shrink) — the config omits the longhand aliases.
 *
 * Panel   — bg $panel (#111 dark), hairline border, radius 12, inner pad 4, subtle
 *           border+ambient elevation.
 * Item    — height 32 (the DropdownMenu row), px 8, gap 8, radius 7; icon in a fixed 16px slot
 *           on the left; label 13px $ink; right affordance (shortcut / check /
 *           chevron) right-aligned. States: hover/active/focus → accent surface,
 *           focus visible; selected → check in primary; disabled → muted, no hover.
 * Separator — 1px hairline, 4px vertical margin.
 * Label     — 11px uppercase muted section header, px 8.
 */
import type { ReactNode, KeyboardEvent } from 'react'
import { Text, XStack, YStack } from '@hanzo/gui'
import { Check, ChevronRight } from '@hanzogui/lucide-icons-2'

import { touch } from '../../backends/gui/gesture'

// ── Geometry — literal px, 8-grid. ROW_H matches the gui backend's DropdownMenu
//    row exactly; two menu geometries would be two design systems. ──────────────
const ITEM_MIN_HEIGHT = 32
const TAP_MIN = 44
const ITEM_RADIUS = 7
const ITEM_PX = 8
const ITEM_GAP = 8
const ICON_SLOT = 16
export const PANEL_RADIUS = 12
export const PANEL_PAD = 4
const PANEL_GAP = 2
const SEP_MARGIN = 4
const FONT_LABEL = 13
const FONT_MUTED = 11
const FONT_SHORTCUT = 12

// ── Colour — the design tokens, which `@hanzo/ui/theme.css` ships, so a bare
//    Vite/Tauri host has them too. `--primary` and `--accent` are also the two
//    properties `product/accent.ts` writes for an org's chosen accent, so a menu
//    follows that opt-in without knowing it exists, and stays monochrome without
//    it. Everything else uses theme-adaptive Tamagui tokens. ───────────────────
const ACCENT = 'var(--primary, #fafafa)'
// A TINT of the accent, never the accent itself. @hanzo/design writes an org's
// chosen hue to `--primary` AND `--accent`, so using `--accent` raw paints the
// hover row a solid brand slab: #fafafa on #ff5c00 measures 2.97:1, under the
// 4.5 AA floor and under even the 3:1 large-text one. Composited at 16% it
// keeps the hue and reads at 16:1.
const ACCENT_SOFT = 'color-mix(in oklab, var(--accent, #262626) 16%, transparent)'
const DANGER = 'var(--destructive, #ef4444)'

// ── Declarative item model ──────────────────────────────────────────────────────
export type MenuItemSpec =
  | {
      type?: 'item'
      /** Stable key. */
      key: string
      label: string
      /** Leading Lucide icon (16px, unfilled) in the fixed left slot. */
      icon?: ReactNode
      /** Second muted line under the label (e.g. an id or hint). */
      description?: string
      /** Right-aligned shortcut / hint text (e.g. "⌘K"). */
      shortcut?: string
      /** Renders a right check + purple tint. */
      selected?: boolean
      disabled?: boolean
      /** Danger styling (red label/icon). */
      destructive?: boolean
      /** Renders a right chevron (submenu / drill-in affordance). */
      hasSubmenu?: boolean
      onSelect: () => void
      /** Keep the menu open after selecting (default: close). */
      closeOnSelect?: boolean
    }
  | { type: 'separator'; key?: string }
  | { type: 'label'; key?: string; label: string }

// ── Surface ───────────────────────────────────────────────────────────────────
export function MenuPanel({
  children,
  minWidth = 200,
  maxHeight = 360,
  onKeyDown,
  panelRef,
  ...rest
}: {
  children: ReactNode
  minWidth?: number
  maxHeight?: number
  onKeyDown?: (e: KeyboardEvent) => void
  /** Web DOM node of the panel (for measuring / edge-flip). */
  panelRef?: (node: HTMLElement | null) => void
  [key: string]: unknown
}) {
  return (
    <YStack
      // Web DOM ref; Gui forwards it to the underlying node. Cast (not @ts-expect-error)
      // so it is env-agnostic — the ref type is strict under the pkg build, loose here.
      ref={panelRef as never}
      role="menu"
      bg="$panel"
      borderColor="$borderColor"
      borderWidth={1}
      rounded={PANEL_RADIUS}
      p={PANEL_PAD}
      gap={PANEL_GAP}
      minW={minWidth}
      maxH={maxHeight}
      overflow="scroll"
      // Subtle border + ambient elevation, minimal shadow.
      shadowColor="rgba(0,0,0,0.45)"
      shadowRadius={20}
      shadowOffset={{ width: 0, height: 10 }}
      onKeyDown={onKeyDown as never}
      {...rest}
    >
      {children}
    </YStack>
  )
}

// ── Item — the ONE row ──────────────────────────────────────────────────────────
import { labelOf, useEmit } from '../instrument'

export function MenuItemView({
  icon,
  label,
  description,
  shortcut,
  selected = false,
  disabled = false,
  destructive = false,
  hasSubmenu = false,
  onSelect,
}: Omit<Extract<MenuItemSpec, { type?: 'item' }>, 'key' | 'type' | 'closeOnSelect'>) {
  const track = useEmit()
  const choose = () => {
    track({ component: 'MenuItem', action: 'select', id: labelOf(label), value: selected })
    onSelect()
  }
  const press = () => {
    if (!disabled) choose()
  }
  const onKeyDown = (e: KeyboardEvent) => {
    if (disabled) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      choose()
    }
  }
  const labelColor = destructive ? DANGER : '$ink'
  return (
    <XStack
      role="menuitem"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      items="center"
      gap={ITEM_GAP}
      px={ITEM_PX}
      minH={ITEM_MIN_HEIGHT}
      {...touch(ITEM_MIN_HEIGHT, TAP_MIN, 'y')}
      rounded={ITEM_RADIUS}
      cursor={disabled ? 'default' : 'pointer'}
      opacity={disabled ? 0.4 : 1}
      select="none"
      style={{ outline: 'none' }}
      hoverStyle={disabled ? {} : { bg: ACCENT_SOFT as never }}
      pressStyle={disabled ? {} : { bg: ACCENT_SOFT as never }}
      focusStyle={disabled ? {} : { bg: ACCENT_SOFT as never }}
      onPress={press}
      onKeyDown={onKeyDown as never}
    >
      <XStack width={ICON_SLOT} height={ICON_SLOT} items="center" justify="center" shrink={0}>
        {icon ? (
          <XStack items="center" justify="center" opacity={destructive ? 1 : 0.9} style={destructive ? { color: DANGER } : undefined}>
            {icon}
          </XStack>
        ) : null}
      </XStack>

      <YStack flex={1} minW={0}>
        <Text fontSize={FONT_LABEL} lineHeight={18} color={labelColor as never} numberOfLines={1}>
          {label}
        </Text>
        {description ? (
          <Text fontSize={FONT_MUTED} lineHeight={14} color="$quiet" numberOfLines={1}>
            {description}
          </Text>
        ) : null}
      </YStack>

      {shortcut ? (
        <Text fontSize={FONT_SHORTCUT} color="$quiet" shrink={0}>
          {shortcut}
        </Text>
      ) : null}
      {selected ? <Check size={14} color={ACCENT} /> : null}
      {hasSubmenu ? <ChevronRight size={14} color="var(--hanzo-muted, currentColor)" opacity={0.6} /> : null}
    </XStack>
  )
}

// ── Separator ───────────────────────────────────────────────────────────────────
export function MenuSeparatorView() {
  return <YStack height={1} bg="$borderColor" my={SEP_MARGIN} mx={SEP_MARGIN} role="separator" />
}

// ── Section label ────────────────────────────────────────────────────────────────
export function MenuLabelView({ children }: { children: ReactNode }) {
  return (
    <Text
      fontSize={FONT_MUTED}
      color="$quiet"
      px={ITEM_PX}
      py={SEP_MARGIN}
      textTransform="uppercase"
      letterSpacing={0.4}
      select="none"
    >
      {children}
    </Text>
  )
}

// ── The single render path shared by every menu ──────────────────────────────────
export function renderMenuItems(items: MenuItemSpec[], close?: () => void): ReactNode {
  return items.map((it, i) => {
    if (it.type === 'separator') return <MenuSeparatorView key={it.key ?? `sep-${i}`} />
    if (it.type === 'label') return <MenuLabelView key={it.key ?? `lbl-${i}`}>{it.label}</MenuLabelView>
    const { key, onSelect, closeOnSelect = true, ...rest } = it
    return (
      <MenuItemView
        key={key}
        {...rest}
        onSelect={() => {
          onSelect()
          if (closeOnSelect) close?.()
        }}
      />
    )
  })
}
