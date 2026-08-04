'use client'

/**
 * Glass — the ONE frosted material, for FLOATING chrome only (menus, dialogs,
 * popovers, docked toolbars). macOS/iOS vibrancy: a translucent ground the
 * backdrop blurs through, sealed with a hairline border.
 *
 * It is a surface, not a layout: it composes AROUND content and adds nothing
 * but the material. The component itself is a solid raised panel; the
 * translucency + blur live in theme.css under `@supports (backdrop-filter)`,
 * keyed by [data-slot="glass"] — so a platform that cannot blur (older
 * engines, native without a blur view) keeps the solid panel and content
 * never becomes illegible over a busy backdrop. One material, declared once.
 *
 * Page sections never wear glass; they sit on the surface ladder ($color2/3).
 */
import { YStack, styled } from '@hanzo/gui'
import type { ComponentProps } from 'react'
import { slot } from './slot'

const GlassFrame = styled(YStack, {
  name: 'Glass',
  borderWidth: 1,
  borderColor: '$borderColor',
  // The stand-in ground; theme.css swaps it for the blurred material where
  // backdrop-filter is real.
  bg: '$color2',
})

export type GlassProps = ComponentProps<typeof GlassFrame>

const Glass = (props: GlassProps) => <GlassFrame {...slot('glass')} {...props} />

export { Glass }
