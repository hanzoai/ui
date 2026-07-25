'use client'

/**
 * The ONE menu-item spec — every menu across the fleet renders through these
 * presentational primitives, so DropdownMenu, ContextMenu, SelectMenu and ComboBox
 * are pixel-identical. Geometry is literal px on a strict 8-grid (never random);
 * colour is theme-adaptive tokens ($color2/$color11/$color12/$borderColor) so light
 * and dark both work, with the single purple accent supplied by the brand CSS vars.
 *
 * Panel   — bg $color2 (#111 dark), hairline border, radius 12, inner pad 4, subtle
 *           border+ambient elevation.
 * Item    — height 30 (28–32 band), px 8, gap 8, radius 7; icon in a fixed 16px slot
 *           on the left; label 13px $color12; right affordance (shortcut / check /
 *           chevron) right-aligned. States: hover/active/focus → accent-soft, focus
 *           visible; selected → check + purple; disabled → muted, no hover.
 * Separator — 1px hairline, 4px vertical margin.
 * Label     — 11px uppercase muted section header, px 8.
 */
import type { ReactNode, KeyboardEvent } from 'react'
import { Text, XStack, YStack } from '@hanzo/gui'
import { Check, ChevronRight } from '@hanzogui/lucide-icons-2'

// ── Geometry — literal px, 8-grid ──────────────────────────────────────────────
const ITEM_MIN_HEIGHT = 30
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

// ── Colour — brand purple accent via CSS vars (fallbacks keep it correct even when
//    @hanzo/brand is not loaded, e.g. a bare Vite/Tauri host); everything else uses
//    theme-adaptive Tamagui tokens. ──────────────────────────────────────────────
const ACCENT = 'var(--hanzo-accent, #8b5cf6)'
const ACCENT_SOFT = 'var(--hanzo-accent-soft, rgba(139,92,246,0.16))'
const DANGER = 'var(--hanzo-danger, #ef4444)'

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
      backgroundColor="$color2"
      borderColor="$borderColor"
      borderWidth={1}
      borderRadius={PANEL_RADIUS}
      padding={PANEL_PAD}
      gap={PANEL_GAP}
      minWidth={minWidth}
      maxHeight={maxHeight}
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
  const press = () => {
    if (!disabled) onSelect()
  }
  const onKeyDown = (e: KeyboardEvent) => {
    if (disabled) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect()
    }
  }
  const labelColor = destructive ? DANGER : '$color12'
  return (
    <XStack
      role="menuitem"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      alignItems="center"
      gap={ITEM_GAP}
      paddingHorizontal={ITEM_PX}
      minHeight={ITEM_MIN_HEIGHT}
      borderRadius={ITEM_RADIUS}
      cursor={disabled ? 'default' : 'pointer'}
      opacity={disabled ? 0.4 : 1}
      userSelect="none"
      outlineWidth={0}
      hoverStyle={disabled ? {} : { backgroundColor: ACCENT_SOFT as never }}
      pressStyle={disabled ? {} : { backgroundColor: ACCENT_SOFT as never }}
      focusStyle={disabled ? {} : { backgroundColor: ACCENT_SOFT as never }}
      onPress={press}
      onKeyDown={onKeyDown as never}
    >
      <XStack width={ICON_SLOT} height={ICON_SLOT} alignItems="center" justifyContent="center" flexShrink={0}>
        {icon ? (
          <XStack alignItems="center" justifyContent="center" opacity={destructive ? 1 : 0.9} {...(destructive ? { style: { color: DANGER } } : {})}>
            {icon}
          </XStack>
        ) : null}
      </XStack>

      <YStack flex={1} minWidth={0}>
        <Text fontSize={FONT_LABEL} lineHeight={18} color={labelColor as never} numberOfLines={1}>
          {label}
        </Text>
        {description ? (
          <Text fontSize={FONT_MUTED} lineHeight={14} color="$color11" numberOfLines={1}>
            {description}
          </Text>
        ) : null}
      </YStack>

      {shortcut ? (
        <Text fontSize={FONT_SHORTCUT} color="$color11" flexShrink={0}>
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
  return (
    <YStack
      height={1}
      backgroundColor="$borderColor"
      marginVertical={SEP_MARGIN}
      marginHorizontal={SEP_MARGIN}
      role="separator"
    />
  )
}

// ── Section label ────────────────────────────────────────────────────────────────
export function MenuLabelView({ children }: { children: ReactNode }) {
  return (
    <Text
      fontSize={FONT_MUTED}
      color="$color11"
      paddingHorizontal={ITEM_PX}
      paddingVertical={SEP_MARGIN}
      textTransform="uppercase"
      letterSpacing={0.4}
      userSelect="none"
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
