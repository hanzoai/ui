
/**
 * Glass — the ONE frosted material, for FLOATING chrome only (menus, dialogs,
 * popovers, docked toolbars). macOS/iOS vibrancy: a translucent ground the
 * backdrop blurs through, sealed with a hairline border.
 *
 * It is a surface, not a layout: it composes AROUND content and adds nothing
 * but the material. The component itself is a solid raised panel; the
 * translucency + blur live in glass.css under `@supports (backdrop-filter)`,
 * keyed by [data-slot="glass"] — so a platform that cannot blur (older engines,
 * native without a blur view) keeps the solid panel and content never becomes
 * illegible over a busy backdrop. One material, declared once.
 *
 * The look comes from `glass(level)` in `@hanzo/ui/glass`, not from a `styled`
 * of its own. It used to be both, and they disagreed: the frame's stand-in
 * ground was `$panel` while the material is 72% of `--background`, so a
 * browser that could blur and one that could not showed two different colours
 * of menu. A component and a recipe describing the same material in two places
 * is how they end up describing two materials. This is the component FORM of
 * that value — it exists so a surface built from scratch does not have to reach
 * for an `XStack` and remember to spread. Every surface the library already
 * names (dialog, popover, select, dropdown, tooltip) is glass by slot and needs
 * neither.
 *
 * Page sections never wear glass; they sit on the surface ladder ($panel/3).
 */
import { YStack } from '@hanzo/gui'
import type { ComponentProps } from 'react'

import { type Lift, glass } from '../../glass'
import { slot } from './slot'

export type GlassProps = ComponentProps<typeof YStack> & {
  /** 2 is anchored — a menu, a toast, a bar. 3 floats free over the page. */
  level?: Lift
}

/**
 * The border WIDTH is geometry and belongs to the component, not to the
 * material — a sticky bar cut from the same glass wants one edge, not four —
 * so the recipe states only the colour and this states the default width.
 */
const Glass = ({ level = 2, ...props }: GlassProps) => (
  <YStack {...slot('glass')} borderWidth={1} {...glass(level)} {...props} />
)

export { Glass }
