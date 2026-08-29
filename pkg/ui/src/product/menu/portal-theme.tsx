
/**
 * PortalTheme — the ONE fix for "themed content escapes its theme through a portal".
 *
 * @hanzo/gui's `Popover.Content` and `Portal` render their children in a SEPARATE
 * React subtree (a Gorhom-style portal host mounted at the app root), NOT via
 * `ReactDOM.createPortal`. React context therefore does NOT flow from the trigger's
 * location to the host. Under a nested `<Theme name="dark">` the portaled content
 * lands OUTSIDE that theme context and Tamagui throws "Missing theme" (or renders
 * unthemed).
 *
 * The fix is two-part and must stay two-part:
 *   1. At the TRIGGER site (theme context still available) capture the resolved
 *      theme name with `useThemeName()`.
 *   2. INSIDE the portaled content re-apply it: `<PortalTheme name={captured}>`.
 *
 * Every portal-backed menu in this package (DropdownMenu, ContextMenu, SelectMenu,
 * ComboBox) uses this so a menu renders identically whether it is opened under the
 * root theme or under any nested `<Theme>`, light or dark.
 */
import type { ReactNode } from 'react'
import { Theme, useThemeName } from '@hanzo/gui'

/** Capture the current resolved theme name at the trigger site. Re-exported so the
 *  capture + re-apply pair reads from one module. */
export { useThemeName }

export function PortalTheme({ name, children }: { name: string; children: ReactNode }) {
  // `name` is the resolved theme name (e.g. "dark", or a compound "dark_purple").
  // Tamagui's `Theme` accepts the resolved name and reconstructs the context.
  return <Theme name={name as never}>{children}</Theme>
}
