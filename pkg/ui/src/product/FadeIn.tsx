/**
 * FadeIn — the ONE entrance animation for the console.
 *
 * A block that rises in with motion.css's `rise` (`data-motion="rise"`), plus an
 * optional stagger delay, so sections and cards rise in the way the hanzo.ai
 * marketing surface does. Framework-free (no animation driver, no JS observers)
 * so it works under static export and honors `prefers-reduced-motion` (handled
 * in the sheet). Pass `index` to stagger a list (delay = index * step), or
 * `delayMs` for an explicit delay. Anything else is the wrapper's own gui props
 * (`width="100%"`, `items="center"`), never a style object.
 */
import type { ComponentProps, ReactNode } from 'react'
import { View } from '@hanzo/gui'

export type FadeInProps = Omit<ComponentProps<typeof View>, 'children'> & {
  children: ReactNode
  /** Position in a list — staggers the entrance by `index * step` ms. */
  index?: number
  /** Per-index stagger in ms (default 50). */
  step?: number
  /** Explicit delay in ms; overrides the index-based stagger. */
  delayMs?: number
}

export function FadeIn({ children, index = 0, step = 50, delayMs, ...props }: FadeInProps) {
  const delay = delayMs ?? index * step
  return (
    <View data-motion="rise" display="block" $platform-web={{ animationDelay: `${delay}ms` }} {...props}>
      {children}
    </View>
  )
}
