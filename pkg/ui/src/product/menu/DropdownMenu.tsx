'use client'

/**
 * DropdownMenu — a portal-theme-safe dropdown on the @hanzo/gui Popover (the proven
 * console idiom, same shell as SelectMenu/ComboBox). Declarative `items`; renders the
 * ONE shared menu-item spec so it is pixel-identical to every other menu. Opens under
 * a nested `<Theme>` correctly because the portaled content re-applies the captured
 * theme (see PortalTheme).
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
import { Popover, useControllableState } from '@hanzo/gui'
import { MenuPanel, renderMenuItems, type MenuItemSpec } from './items'
import { PortalTheme, useThemeName } from './portal-theme'
import { menuKeyDown } from './roving'

export type DropdownMenuProps = {
  /** The clickable element. Cloned as the Popover trigger (`asChild`). */
  trigger: ReactElement
  items: MenuItemSpec[]
  /** Controlled open state. Omit for uncontrolled. */
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Popover placement (default `bottom-start`). */
  placement?: React.ComponentProps<typeof Popover>['placement']
  minWidth?: number
  maxHeight?: number
}

export function DropdownMenu({
  trigger,
  items,
  open,
  defaultOpen = false,
  onOpenChange,
  placement = 'bottom-start',
  minWidth = 200,
  maxHeight,
}: DropdownMenuProps) {
  const [isOpen, setOpen] = useControllableState({
    prop: open,
    defaultProp: defaultOpen,
    onChange: onOpenChange,
  })
  // Capture the resolved theme HERE, where theme context is still available; the
  // Popover.Content portals out of it and re-applies it via <PortalTheme>.
  const themeName = useThemeName()

  return (
    <Popover open={isOpen} onOpenChange={setOpen} placement={placement} allowFlip>
      <Popover.Trigger asChild>{trigger}</Popover.Trigger>
      <Popover.Content
        // The visible surface is our MenuPanel — keep Content a transparent shell.
        bg="transparent"
        borderWidth={0}
        p={0}
        elevation={0}
      >
        <PortalTheme name={themeName}>
          <MenuPanel minWidth={minWidth} maxHeight={maxHeight} onKeyDown={(e) => menuKeyDown(e, () => setOpen(false))}>
            {renderMenuItems(items, () => setOpen(false))}
          </MenuPanel>
        </PortalTheme>
      </Popover.Content>
    </Popover>
  )
}
