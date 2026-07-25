// @hanzo/ui/product menu — ONE menu system. Portal-theme-safe DropdownMenu (click)
// and ContextMenu (right-click) both render the SAME item spec, so every menu across
// the fleet is pixel-identical. See items.tsx for the shared spec.

export { DropdownMenu, type DropdownMenuProps } from './DropdownMenu'
export { ContextMenu, type ContextMenuProps } from './ContextMenu'
export {
  MenuPanel,
  MenuItemView,
  MenuSeparatorView,
  MenuLabelView,
  renderMenuItems,
  type MenuItemSpec,
} from './items'
export { PortalTheme } from './portal-theme'
