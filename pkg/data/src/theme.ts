// Hanzo data-app colours.
//
// The components draw with @hanzo/ui's theme rungs and its data palette, so they
// follow the theme they are mounted in. What remains here is for a host that
// paints its own element in a data colour: `TAG_TONES` names each hue's tag pair
// as the palette's custom properties (`--data-<hue>-<step>`: fill step 3, text
// step 11, edge step 6), which resolve in either theme wherever @hanzo/ui's
// stylesheet is mounted. `tokens` is the fixed dark palette the views drew with
// before the record kit; the field renderers, the table and the record views no
// longer read it, and it stays for callers that do.
import type { TagColor } from './field/types'

export interface TagTone {
  bg: string
  fg: string
  border: string
}

const HUES: TagColor[] = [
  'red', 'ruby', 'crimson', 'tomato', 'orange', 'amber', 'yellow', 'lime', 'grass', 'green', 'jade', 'mint', 'teal',
  'cyan', 'sky', 'blue', 'iris', 'violet', 'purple', 'plum', 'pink', 'bronze', 'gold', 'brown', 'gray',
  'mauve', 'olive', 'sage', 'sand', 'slate',
]

const tone = (hue: TagColor): TagTone => ({
  bg: `var(--data-${hue}-3)`,
  fg: `var(--data-${hue}-11)`,
  border: `var(--data-${hue}-6)`,
})

/** TagColor → its tag pair and edge, as the data palette's custom properties. One source of truth: @hanzo/tokens. */
export const TAG_TONES: Record<TagColor, TagTone> = Object.fromEntries(HUES.map((h) => [h, tone(h)])) as Record<TagColor, TagTone>

export function tagTone(color: TagColor | undefined): TagTone {
  return TAG_TONES[color ?? 'gray'] ?? TAG_TONES.gray
}

/** The fixed dark palette the views drew with before the record kit (dark only, theme-blind). */
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
