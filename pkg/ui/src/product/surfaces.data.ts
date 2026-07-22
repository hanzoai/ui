// The ONE canonical list of Hanzo product surfaces the cross-surface app switcher
// offers — consumed by EVERY surface's launcher so the set never diverges.
//
// Framework-agnostic (plain TS, zero imports): React consumers (the @hanzo/ui
// `AppHeader`, the console `AppLauncher`) import it directly; a surface that
// cannot resolve THIS package — the Svelte Huly-fork `team` (whose own `@hanzo/ui`
// is the workbench UI framework, a name clash) and the shadcn-aliased `app` — keeps
// a byte-identical MIRROR that points back here. Add or reorder a surface HERE and
// every launcher moves together (mirrors are updated in the same change).
//
// `id` is the stable key AND the icon key: each framework maps it to its own glyph
// (React → lucide, Svelte → SurfaceIcon), so the DATA itself stays glyph-free.

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

/** The seven Hanzo surfaces (`console` opens the cloud AI console). */
export const SURFACES: Surface[] = [
  { id: 'ai', label: 'Hanzo AI', href: 'https://hanzo.ai', hint: 'hanzo.ai' },
  { id: 'console', label: 'Console', href: 'https://console.hanzo.ai', hint: 'console.hanzo.ai' },
  { id: 'app', label: 'App', href: 'https://hanzo.app', hint: 'hanzo.app' },
  { id: 'chat', label: 'Chat', href: 'https://hanzo.chat', hint: 'hanzo.chat' },
  { id: 'bot', label: 'Bot', href: 'https://hanzo.bot', hint: 'hanzo.bot' },
  { id: 'team', label: 'Team', href: 'https://hanzo.team', hint: 'hanzo.team' },
  { id: 'billing', label: 'Billing', href: 'https://billing.hanzo.ai', hint: 'billing.hanzo.ai' },
]

/** Every surface except `current` — a launcher never links to itself. */
export function otherSurfaces(current?: SurfaceId): Surface[] {
  return current ? SURFACES.filter((s) => s.id !== current) : SURFACES
}
