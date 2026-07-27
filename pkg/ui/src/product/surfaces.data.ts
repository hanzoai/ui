// Re-export shim. The launcher surface DATA now lives ONCE in `@hanzo/products`
// (`SURFACES` — the collapse of this list and `@hanzogui/shell`'s `HANZO_APPS`).
// This file preserves the legacy `Surface` / `SurfaceId` / `SURFACES` /
// `otherSurfaces` shape byte-for-byte, so existing importers (the `AppHeader`
// app-switcher) need no change; it only sources the values from the canonical
// registry. Add or reorder a surface in `@hanzo/products`, not here.
//
// `id` is the stable key AND the icon key: `AppHeader` maps each to a lucide glyph,
// so the DATA stays glyph-free.
import { surfaceById } from '@hanzo/products'

/** The seven surfaces this shell's app switcher offers. */
export type SurfaceId = 'ai' | 'console' | 'app' | 'chat' | 'bot' | 'team' | 'billing'

/** One Hanzo surface the app switcher offers. */
export type Surface = {
  /** Stable id; also the per-surface icon key. */
  id: SurfaceId
  /** Menu label. */
  label: string
  /** Absolute product URL (opened in a new tab). */
  href: string
  /** The domain, shown as the tile subtitle. */
  hint: string
}

/** Display order for this shell (the canonical registry may hold more surfaces). */
const ORDER: SurfaceId[] = ['ai', 'console', 'app', 'chat', 'bot', 'team', 'billing']

/** The seven Hanzo surfaces (`console` opens the cloud AI console). */
export const SURFACES: Surface[] = ORDER.map((id) => {
  const s = surfaceById(id)!
  return { id, label: s.label, href: s.href, hint: s.domain }
})

/** Every surface except `current` — a launcher never links to itself. */
export function otherSurfaces(current?: SurfaceId): Surface[] {
  return current ? SURFACES.filter((s) => s.id !== current) : SURFACES
}
