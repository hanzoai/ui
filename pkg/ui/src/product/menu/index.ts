// @hanzo/ui/product menu — ONE menu system. Portal-theme-safe DropdownMenu (click)
// and ContextMenu (right-click) both render the SAME item spec, so every menu across
// the fleet is pixel-identical. See items.tsx for the shared spec.

// The ONE DropdownMenu lives in the gui BACKEND (it is a component-API member,
// not a product-layer piece). It grew the declarative `trigger`/`items` form that
// used to be a second, separate component here, so there is one name, one API and
// one rendering — reachable from `@hanzo/ui` and from `@hanzo/ui/product` alike.
export { DropdownMenu, type DropdownMenuProps } from '../../backends/gui/dropdown-menu'
export { ContextMenu, type ContextMenuProps } from './ContextMenu'
export { FloatingMenu, type RectLike } from './FloatingMenu'
export {
  MenuPanel,
  MenuItemView,
  MenuSeparatorView,
  MenuLabelView,
  renderMenuItems,
  type MenuItemSpec,
} from './items'
export { PortalTheme } from './portal-theme'
