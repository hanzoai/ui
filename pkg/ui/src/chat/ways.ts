/**
 * The short lists a composer offers — the effort, the mode — as plain data.
 * Their words are English and marked (`phrase`): the composer draws each one
 * through the reader's `t`. No React and no DOM, so a surface that only names
 * an effort (a settings page, a spec) loads it without the composer.
 */
import { phrase } from '@hanzo/i18n'

/** A choice in a short list: its name and a line saying what it does, both marked English. */
export interface Way<T extends string = string> {
  id: T
  label: string
  note: string
  off?: boolean
}

export type Effort = 'auto' | 'off' | 'minimal' | 'instant' | 'low' | 'medium' | 'high' | 'xhigh' | 'max'

/**
 * Every reasoning effort level supported across tracked models, in order, in
 * English and marked (`phrase`): `reasoning_effort` on a completion; a surface
 * offers the ones it can send. Auto leaves the depth to the router; the ladder
 * spans Off → Minimal → Low → Medium → High → Extra High → Max.
 */
export const EFFORTS: readonly Way<Effort>[] = [
  { id: 'auto', label: phrase('Auto'), note: phrase('Adaptive reasoning based on task complexity') },
  { id: 'off', label: phrase('Off'), note: phrase('Answers directly without extended thinking') },
  { id: 'minimal', label: phrase('Minimal'), note: phrase('Very brief reasoning for fast responses') },
  { id: 'low', label: phrase('Low'), note: phrase('A quick pass with light thinking') },
  { id: 'medium', label: phrase('Medium'), note: phrase('Balanced thinking before answering') },
  { id: 'high', label: phrase('High'), note: phrase('Deep reasoning for complex problems') },
  { id: 'xhigh', label: phrase('Extra High'), note: phrase('Extended multi-step reasoning and checks') },
  { id: 'max', label: phrase('Max'), note: phrase('Maximum compute and exhaustive verification') },
]
