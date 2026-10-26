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

export type Effort = 'auto' | 'low' | 'medium' | 'high' | 'xhigh' | 'max'

/** Every effort, in order, in English and marked (`phrase`): `reasoning_effort` on a completion; a surface offers the ones it can send. */
export const EFFORTS: readonly Way<Effort>[] = [
  { id: 'auto', label: phrase('Auto'), note: phrase('Adaptive reasoning based on task complexity') },
  { id: 'low', label: phrase('Low'), note: phrase('A quick pass with minimal thinking') },
  { id: 'medium', label: phrase('Medium'), note: phrase('Thinks before answering') },
  { id: 'high', label: phrase('High'), note: phrase('Deep reasoning for complex problems') },
  { id: 'xhigh', label: phrase('XHigh'), note: phrase('Extended multi-step reasoning for hard tasks') },
  { id: 'max', label: phrase('Max'), note: phrase('Maximum compute and exhaustive verification') },
]
