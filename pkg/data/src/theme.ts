// Hanzo data-app tokens. Brand-neutral, dark-first — the zinc-on-black identity
// the Base/console surfaces use. Tag colors are muted fills with legible text,
// resolved once here so every tag (select, multiSelect, status) reads the same.
import type { TagColor } from './field/types'

export interface TagTone {
  bg: string
  fg: string
  border: string
}

/** TagColor → tone. Muted, dark-surface friendly. One source of truth. */
export const TAG_TONES: Record<TagColor, TagTone> = {
  gray:   { bg: '#27272a', fg: '#e4e4e7', border: '#3f3f46' },
  blue:   { bg: '#1e3a5f', fg: '#bfdbfe', border: '#1e40af' },
  green:  { bg: '#14432a', fg: '#bbf7d0', border: '#166534' },
  amber:  { bg: '#451a03', fg: '#fde68a', border: '#92400e' },
  red:    { bg: '#450a0a', fg: '#fecaca', border: '#991b1b' },
  purple: { bg: '#2e1065', fg: '#ddd6fe', border: '#6d28d9' },
  pink:   { bg: '#500724', fg: '#fbcfe8', border: '#9d174d' },
  teal:   { bg: '#042f2e', fg: '#99f6e4', border: '#0f766e' },
  orange: { bg: '#431407', fg: '#fed7aa', border: '#9a3412' },
}

export function tagTone(color: TagColor | undefined): TagTone {
  return TAG_TONES[color ?? 'gray']
}

/** Core surface tokens (raw hex so components are theme-config independent). */
export const tokens = {
  text: '#f4f4f5',
  textMuted: '#a1a1aa',
  textFaint: '#71717a',
  surface: '#09090b',
  surfaceRaised: '#0a0a0a',
  border: '#27272a',
  hover: '#18181b',
  accent: '#60a5fa',
  danger: '#fca5a5',
} as const
