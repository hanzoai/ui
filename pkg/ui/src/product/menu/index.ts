// @hanzo/ui/product menu — Portal-theme-safe DropdownMenu (click) and ContextMenu
// (right-click) render the SAME item spec (items.tsx) at the same geometry (32px
// row, 8px gutter, 44px tap).
//
// They do NOT yet share a renderer: DropdownMenu builds its rows out of gui `Menu`
// compound parts (which need the Menu context), ContextMenu builds them out of
// `renderMenuItems` inside a bare `FloatingMenu` portal anchored at the cursor.
// Collapsing the two means giving the cursor-anchored case a Menu context; until
// that lands, the spec and the geometry constants are what keep them identical.

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
