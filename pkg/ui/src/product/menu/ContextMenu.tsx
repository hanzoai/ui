'use client'

/**
 * ContextMenu — a right-click menu that renders the SAME shared item spec as
 * DropdownMenu, so every menu in the fleet is identical. Built on the @hanzo/gui
 * Portal with the SAME portal-theme fix as the dropdown: the menu is portaled to the
 * root, escaping any nested `<Theme>`, so it re-applies the captured theme via
 * <PortalTheme>. Web/desktop right-click (`onContextMenu`); on native — which has no
 * right-click — the wrapped child renders untouched.
 *
 *   <ContextMenu items={[{ key:'copy', label:'Copy', icon:<Copy size={16}/>, onSelect:copy }]}>
 *     <YStack>right-click me</YStack>
 *   </ContextMenu>
 */
import type { ReactElement, MouseEvent } from 'react'
import { cloneElement, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Portal } from '@hanzo/gui'
import { MenuPanel, renderMenuItems, type MenuItemSpec } from './items'
import { PortalTheme, useThemeName } from './portal-theme'
import { menuKeyDown } from './roving'

const EDGE = 8 // keep this far from the viewport edge

export type ContextMenuProps = {
  /** The right-clickable target. Its `onContextMenu` is composed, not replaced. */
  children: ReactElement
  items: MenuItemSpec[]
  disabled?: boolean
  minWidth?: number
  maxHeight?: number
}

export function ContextMenu({ children, items, disabled, minWidth = 200, maxHeight }: ContextMenuProps) {
  const themeName = useThemeName()
  const [state, setState] = useState<{ open: boolean; x: number; y: number }>({ open: false, x: 0, y: 0 })
  const panelRef = useRef<HTMLElement | null>(null)

  const close = useCallback(() => setState((s) => (s.open ? { ...s, open: false } : s)), [])

  const openAt = (e: MouseEvent) => {
    if (disabled) return
    e.preventDefault()
    e.stopPropagation()
    setState({ open: true, x: e.clientX, y: e.clientY })
  }

  // Edge-flip before paint: clamp so the panel stays fully in the viewport.
  useLayoutEffect(() => {
    if (!state.open || typeof window === 'undefined') return
    const node = panelRef.current
    if (!node) return
    const r = node.getBoundingClientRect()
    let x = state.x
    let y = state.y
    if (x + r.width > window.innerWidth - EDGE) x = Math.max(EDGE, window.innerWidth - r.width - EDGE)
    if (y + r.height > window.innerHeight - EDGE) y = Math.max(EDGE, window.innerHeight - r.height - EDGE)
    if (x !== state.x || y !== state.y) setState((s) => ({ ...s, x, y }))
    // Focus the panel so keyboard nav works immediately.
    node.focus?.()
  }, [state.open, state.x, state.y])

  // Dismiss on outside pointer, Escape, scroll, resize, blur.
  useEffect(() => {
    if (!state.open || typeof document === 'undefined') return
    const onPointerDown = (e: PointerEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) close()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKey, true)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    window.addEventListener('blur', close)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKey, true)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
      window.removeEventListener('blur', close)
    }
  }, [state.open, close])

  const childOnContextMenu = (children.props as { onContextMenu?: (e: MouseEvent) => void }).onContextMenu
  const target = cloneElement(children, {
    onContextMenu: (e: MouseEvent) => {
      childOnContextMenu?.(e)
      openAt(e)
    },
  } as Partial<typeof children.props>)

  return (
    <>
      {target}
      {state.open ? (
        <Portal>
          <PortalTheme name={themeName}>
            <MenuPanel
              panelRef={(n) => (panelRef.current = n)}
              minWidth={minWidth}
              maxHeight={maxHeight}
              tabIndex={-1}
              onKeyDown={(e) => menuKeyDown(e, close)}
              style={{ position: 'fixed', left: state.x, top: state.y, zIndex: 100000 }}
            >
              {renderMenuItems(items, close)}
            </MenuPanel>
          </PortalTheme>
        </Portal>
      ) : null}
    </>
  )
}
