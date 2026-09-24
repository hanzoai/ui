/**
 * log — the console dock's lines and its one dimension.
 *
 * Ported from build-v2 `components/editor/console/{log,dock}.ts` (MIT, derived
 * from OSW Studio and DeepSite — see NOTICE). v2 kept the buffer at module
 * scope inside the app; here the buffer is the HOST's (a run's events, a
 * page's forwarded console) and this module keeps only the decisions every
 * host would otherwise make differently: how a block of output becomes lines,
 * how many are kept, and what a drag or a key does to the dock's height.
 *
 * Pure and importless.
 */

export type Level = 'log' | 'info' | 'warn' | 'error' | 'debug'

/** One console line. `source` says who spoke — the page, the run, you. */
export interface Line {
  id: string | number
  level: Level
  text: string
  source?: string
}

const LEVELS: readonly Level[] = ['log', 'info', 'warn', 'error', 'debug']

/** A level from the wire, or `log` for anything unrecognised. */
export const level = (raw: unknown): Level =>
  typeof raw === 'string' && (LEVELS as readonly string[]).includes(raw) ? (raw as Level) : 'log'

/**
 * A block of output as one line per line, trailing blank lines dropped. A
 * build's output arrives as a paragraph; a console shows it as the lines it is,
 * so each can be read, copied and counted.
 */
export function split(text: string): string[] {
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  while (lines.length > 0 && lines[lines.length - 1]!.trim() === '') lines.pop()
  return lines
}

/** Enough to read a build, bounded so a runaway loop cannot eat memory. */
export const LIMIT = 500

/** The newest `limit` lines. */
export const cap = <T>(lines: T[], limit = LIMIT): T[] =>
  lines.length > limit ? lines.slice(lines.length - limit) : lines

/** How many lines of each level — what a collapsed dock's badge says. */
export function count(lines: Line[]): Record<Level, number> {
  const out: Record<Level, number> = { log: 0, info: 0, warn: 0, error: 0, debug: 0 }
  for (const l of lines) out[l.level] += 1
  return out
}

/**
 * The dock's ONE dimension: its height in px. An open dock IS a dock taller
 * than its header (`open = height > HEAD`), so a dragged size and a toggled
 * state can never disagree — there is deliberately no second boolean.
 */
export const HEAD = 36
/** The smallest body worth showing: a dock is never dragged into a sliver. */
export const BODY = 96
export const MIN_OPEN = HEAD + BODY
/** Where a first open lands before anything was dragged. */
export const OPEN = 260
/** Arrow-key increment; Shift moves four. */
export const STEP = 24
/** Dragged below this, the dock closes instead of leaving a sliver. */
export const SHUT = MIN_OPEN - STEP

/** The dock never eats the workspace: at most 70% of the viewport. */
export const ceiling = (viewport: number): number => Math.max(MIN_OPEN, Math.round(viewport * 0.7))

/** An OPEN height clamped into range. */
export function clamp(raw: number, viewport: number): number {
  if (!Number.isFinite(raw)) return MIN_OPEN
  return Math.min(Math.max(raw, MIN_OPEN), ceiling(viewport))
}

/** Every gesture funnels through here: at or below `SHUT` is closed, anything else a clamped open height. */
export const resolve = (raw: number, viewport: number): number => (raw <= SHUT ? HEAD : clamp(raw, viewport))

/** Whether a height is an open dock. */
export const opened = (height: number): boolean => height > HEAD
