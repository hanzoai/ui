/**
 * The one status map for feedback: what a status means, and the colour it is
 * drawn in. Banner, Alert (the callout) and the toast read it; Status's semantic
 * aliases (success, warning, error, info) are meant to read it too.
 *
 * After twenty-ui's FeedbackStatusColors (MIT, NOTICE): neutral is gray, info is
 * blue, success green, warning orange, error red. The chrome stays Hanzo's, so
 * the colour a strip, an icon or a solid fill takes is a STATE token wherever
 * one exists — `--state-error`, `--state-warning`, `--state-success` — and info,
 * which this system has no hue for, is the accent (`--primary`, monochrome until
 * an org picks one). The data palette appears only where a callout needs the
 * faint ground and edge of its colour (steps 1 and 6), which the states do not
 * carry.
 *
 * Pure data, no gui import, so a server module can read it.
 */

/** What a feedback surface reports. */
export type FeedbackStatus = 'neutral' | 'info' | 'success' | 'warning' | 'error'

/** The five colours a feedback surface can be drawn in. */
export type FeedbackColor = 'gray' | 'blue' | 'green' | 'orange' | 'red'

/** Each status's colour. */
export const STATUS_COLOR: Readonly<Record<FeedbackStatus, FeedbackColor>> = {
  neutral: 'gray',
  info: 'blue',
  success: 'green',
  warning: 'orange',
  error: 'red',
}

/**
 * The tokens a colour paints with, by role:
 *
 *   ink    the colour itself as text or an icon (a soft strip's message, a toast's icon)
 *   fill   a solid strip's ground
 *   on     the text on that solid ground (chosen for contrast, not by theme)
 *   tint   a soft strip's ground, the countdown fill of a toast
 *   ground a callout's ground (data step 1)
 *   edge   a callout's border (data step 6)
 */
export type FeedbackPaint = {
  ink: string
  fill: string
  on: string
  tint: string
  ground: string
  edge: string
}

export const STATUS_PAINT: Readonly<Record<FeedbackColor, FeedbackPaint>> = {
  gray: {
    ink: '$ink',
    fill: '$raised',
    on: '$ink',
    tint: '$hover',
    ground: 'var(--data-gray-1)',
    edge: 'var(--data-gray-6)',
  },
  blue: {
    ink: 'var(--primary)',
    fill: 'var(--primary)',
    on: 'var(--primary-foreground)',
    tint: 'var(--glass-strong)',
    ground: 'var(--data-blue-1)',
    edge: 'var(--data-blue-6)',
  },
  green: {
    ink: 'var(--state-success)',
    fill: 'var(--state-success)',
    // A light hue in both themes: dark ink reads on it, white does not (2.3:1).
    on: 'var(--neutral-950)',
    tint: 'var(--state-success-bg)',
    ground: 'var(--data-green-1)',
    edge: 'var(--data-green-6)',
  },
  orange: {
    ink: 'var(--state-warning)',
    fill: 'var(--state-warning)',
    on: 'var(--neutral-950)',
    tint: 'var(--state-warning-bg)',
    ground: 'var(--data-orange-1)',
    edge: 'var(--data-orange-6)',
  },
  red: {
    ink: 'var(--state-error)',
    // design's destructive FILL, cut for its foreground at 4.6:1; the error hue
    // itself (#ef4444) carries white at only 3.8:1.
    fill: 'var(--destructive)',
    on: 'var(--destructive-foreground)',
    tint: 'var(--state-error-bg)',
    ground: 'var(--data-red-1)',
    edge: 'var(--data-red-6)',
  },
}

/** The colour a surface draws in: its own `color` if it names one, else its status's. */
export const colorOf = (status: FeedbackStatus | null | undefined, color?: FeedbackColor | null): FeedbackColor =>
  color ?? STATUS_COLOR[status ?? 'neutral']

/** A colour's paint. */
export const paint = (status: FeedbackStatus | null | undefined, color?: FeedbackColor | null): FeedbackPaint =>
  STATUS_PAINT[colorOf(status, color)]
