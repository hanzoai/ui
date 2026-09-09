/**
 * Shared cross-module types for @hanzo/dashboard.
 */
import type { ComponentType } from 'react'

/**
 * A lucide-style icon component — the shape the dashboard passes around for
 * consumer-supplied product/tile/action icons. Structural (not tied to a specific
 * icon package) so the config types stay pure and any `size`/`color` icon fits
 * (e.g. `@hanzogui/lucide-icons-2` or `lucide-react` icons).
 */
export type IconComponent = ComponentType<{ size?: number | string; color?: string; opacity?: number }>
