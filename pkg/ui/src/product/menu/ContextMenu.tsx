'use client'

/**
 * ContextMenu — a right-click menu that renders the SAME shared item spec as DropdownMenu,
 * so every menu in the fleet is identical. Built on FloatingMenu (gui Portal), anchored to
 * the cursor point. Web/desktop right-click (`onContextMenu`); on native — which has no
 * right-click — the wrapped child renders untouched.
 *
 *   <ContextMenu items={[{ key:'copy', label:'Copy', icon:<Copy size={16}/>, onSelect:copy }]}>
 *     <YStack>right-click me</YStack>
 *   </ContextMenu>
 */
import type { ReactElement, MouseEvent } from 'react'
import { cloneElement, useCallback, useState } from 'react'
import { renderMenuItems, type MenuItemSpec } from './items'
import { FloatingMenu } from './FloatingMenu'

export type ContextMenuProps = {
  /** The right-clickable target. Its `onContextMenu` is composed, not replaced. */
  children: ReactElement
  items: MenuItemSpec[]
  disabled?: boolean
  minWidth?: number
  maxHeight?: number
}

export function ContextMenu({ children, items, disabled, minWidth = 200, maxHeight }: ContextMenuProps) {
  const [state, setState] = useState<{ open: boolean; x: number; y: number }>({ open: false, x: 0, y: 0 })
  const close = useCallback(() => setState((s) => (s.open ? { ...s, open: false } : s)), [])
  // A zero-size rect at the cursor; FloatingMenu opens the panel at that point (gap 0).
  const anchorRect = useCallback(
    () => ({ left: state.x, top: state.y, right: state.x, bottom: state.y, width: 0, height: 0 }),
    [state.x, state.y],
  )

  const childOnContextMenu = (children.props as { onContextMenu?: (e: MouseEvent) => void }).onContextMenu
  const target = cloneElement(children, {
    onContextMenu: (e: MouseEvent) => {
      childOnContextMenu?.(e)
      if (disabled) return
      e.preventDefault()
      e.stopPropagation()
      setState({ open: true, x: e.clientX, y: e.clientY })
    },
  } as Partial<typeof children.props>)

  return (
    <>
      {target}
      <FloatingMenu open={state.open} onClose={close} anchorRect={anchorRect} gap={0} minWidth={minWidth} maxHeight={maxHeight}>
        {renderMenuItems(items, close)}
      </FloatingMenu>
    </>
  )
}
