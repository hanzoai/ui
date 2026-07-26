'use client'

/**
 * FloatingMenu — the ONE floating-panel mechanism for every menu. Renders the shared
 * MenuPanel through the @hanzo/gui Portal, positioned at an anchor (a trigger rect or a
 * cursor point), theme-forwarded via PortalTheme, edge-flipped, dismiss-wired and
 * keyboard-navigable.
 *
 * Why Portal, not gui Popover: gui's Popover pulls in a SheetController that re-roots the
 * trigger subtree and reads the theme from React context — on gui-native hosts
 * (react-native-web-lite, theme in context, no CSS-class fallback) that throws
 * "Missing theme" AT MOUNT. The raw Portal does not re-root, so DropdownMenu, ContextMenu,
 * SelectMenu and ComboBox all ride this ONE working path.
 */
import type { ReactNode, KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Portal } from '@hanzo/gui'
import { MenuPanel } from './items'
import { PortalTheme, useThemeName } from './portal-theme'
import { menuKeyDown } from './roving'

const EDGE = 8

export type RectLike = { left: number; top: number; right: number; bottom: number; width: number; height: number }

export function FloatingMenu({
  open,
  onClose,
  anchorRect,
  anchorEl,
  gap = 4,
  minWidth = 200,
  maxHeight,
  autoFocus = true,
  children,
}: {
  open: boolean
  onClose: () => void
  /** Anchor in viewport coords — a trigger's rect, or a zero-size rect at a cursor point. */
  anchorRect: () => RectLike | null | undefined
  /** Element excluded from outside-dismiss (the trigger / input row). */
  anchorEl?: () => HTMLElement | null | undefined
  /** Space between the anchor's bottom and the panel (0 for a cursor menu). */
  gap?: number
  minWidth?: number
  maxHeight?: number
  /** Focus the panel on open (for roving keys). ComboBox keeps focus in its input. */
  autoFocus?: boolean
  children: ReactNode
}) {
  const themeName = useThemeName()
  const panelRef = useRef<HTMLElement | null>(null)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)

  const setPanel = useCallback((n: HTMLElement | null) => {
    panelRef.current = n
  }, [])

  const place = useCallback(() => {
    if (typeof window === 'undefined') return
    const a = anchorRect()
    if (!a) return
    const node = panelRef.current
    const w = node?.offsetWidth || minWidth
    const h = node?.offsetHeight || 0
    let left = a.left
    let top = a.bottom + gap
    if (left + w > window.innerWidth - EDGE) left = Math.max(EDGE, window.innerWidth - w - EDGE)
    if (h && top + h > window.innerHeight - EDGE) {
      const above = a.top - gap - h
      top = above >= EDGE ? above : Math.max(EDGE, window.innerHeight - h - EDGE)
    }
    setPos({ left, top })
  }, [anchorRect, gap, minWidth])

  // Measure + position before paint; focus the panel for keyboard nav.
  useLayoutEffect(() => {
    if (!open) {
      setPos(null)
      return
    }
    place()
    if (autoFocus) panelRef.current?.focus?.()
  }, [open, place, autoFocus])

  // Dismiss on outside pointer (excluding the anchor), Escape, scroll, resize, blur.
  useEffect(() => {
    if (!open || typeof document === 'undefined') return
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (panelRef.current?.contains(t)) return
      const anchor = anchorEl?.()
      if (anchor && anchor.contains(t)) return
      onClose()
    }
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKey, true)
    window.addEventListener('scroll', onClose, true)
    window.addEventListener('resize', onClose)
    window.addEventListener('blur', onClose)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKey, true)
      window.removeEventListener('scroll', onClose, true)
      window.removeEventListener('resize', onClose)
      window.removeEventListener('blur', onClose)
    }
  }, [open, onClose, anchorEl])

  if (!open) return null
  return (
    <Portal>
      <PortalTheme name={themeName}>
        <MenuPanel
          panelRef={setPanel}
          minWidth={minWidth}
          maxHeight={maxHeight}
          tabIndex={-1}
          onKeyDown={(e: ReactKeyboardEvent) => menuKeyDown(e, onClose)}
          style={{
            position: 'fixed',
            left: pos?.left ?? 0,
            top: pos?.top ?? 0,
            zIndex: 100000,
            visibility: pos ? 'visible' : 'hidden',
          }}
        >
          {children}
        </MenuPanel>
      </PortalTheme>
    </Portal>
  )
}
