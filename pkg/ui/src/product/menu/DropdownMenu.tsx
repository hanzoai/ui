'use client'

/**
 * DropdownMenu — a portal-theme-safe click menu. Declarative `items` rendered through the
 * ONE shared menu-item spec, so it is pixel-identical to ContextMenu/SelectMenu/ComboBox.
 * Built on FloatingMenu (gui Portal), NOT the gui Popover — so it mounts without the
 * Sheet re-root that loses theme context on gui-native hosts (react-native-web-lite).
 *
 *   <DropdownMenu
 *     trigger={<Button>Actions</Button>}
 *     items={[
 *       { key: 'rename', label: 'Rename', icon: <Pencil size={16} />, onSelect: rename },
 *       { type: 'separator' },
 *       { key: 'del', label: 'Delete', destructive: true, onSelect: del },
 *     ]}
 *   />
 */
import type { ReactElement } from 'react'
import { useCallback, useRef } from 'react'
import { XStack, useControllableState } from '@hanzo/gui'
import { renderMenuItems, type MenuItemSpec } from './items'
import { FloatingMenu } from './FloatingMenu'

export type DropdownMenuProps = {
  /** The clickable element. Wrapped so any element opens the menu on press. */
  trigger: ReactElement
  items: MenuItemSpec[]
  /** Controlled open state. Omit for uncontrolled. */
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  minWidth?: number
  maxHeight?: number
}

export function DropdownMenu({
  trigger,
  items,
  open,
  defaultOpen = false,
  onOpenChange,
  minWidth = 200,
  maxHeight,
}: DropdownMenuProps) {
  const [isOpen, setOpen] = useControllableState({
    prop: open,
    defaultProp: defaultOpen,
    onChange: onOpenChange,
  })
  const anchorRef = useRef<HTMLElement | null>(null)
  const anchorRect = useCallback(() => anchorRef.current?.getBoundingClientRect() ?? null, [])
  const anchorEl = useCallback(() => anchorRef.current, [])

  return (
    <>
      <XStack ref={anchorRef as never} self="flex-start" cursor="pointer" onPress={() => setOpen(!isOpen)}>
        {trigger}
      </XStack>
      <FloatingMenu
        open={isOpen}
        onClose={() => setOpen(false)}
        anchorRect={anchorRect}
        anchorEl={anchorEl}
        minWidth={minWidth}
        maxHeight={maxHeight}
      >
        {renderMenuItems(items, () => setOpen(false))}
      </FloatingMenu>
    </>
  )
}
