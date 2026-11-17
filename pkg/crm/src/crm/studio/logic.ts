/**
 * The studio's pure decisions, apart from React so they are tested alone: what one
 * person's walk of a sequence says, a sequence's tally, how a step's delay reads, and
 * the send time a form names.
 */

import type { Enrollment, SequenceStep } from '../../lib/crm'

/**
 * One person's state as the cloud reports it. A walk is `active` while a step is
 * due; `completed` once its last step was taken — whether that send went out, was
 * suppressed or failed is recorded by the cloud but not reported to the org, so
 * the word is "taken", never "delivered".
 */
export function walkState(e: Pick<Enrollment, 'status' | 'nextRunAt'>, now: number): string {
  if (e.status === 'canceled') return 'canceled'
  if (e.status === 'completed') return 'taken'
  if (e.nextRunAt > now) return `due ${new Date(e.nextRunAt * 1000).toLocaleString()}`
  return 'sending'
}

/** How many a sequence enrolled, how many are still due, taken, or canceled. */
export function tally(es: Pick<Enrollment, 'status'>[]): { enrolled: number; due: number; taken: number; canceled: number } {
  return {
    enrolled: es.length,
    due: es.filter((e) => e.status === 'active').length,
    taken: es.filter((e) => e.status === 'completed').length,
    canceled: es.filter((e) => e.status === 'canceled').length,
  }
}

/** A step's delay in words: the first counts from enrollment, the rest from the step before. */
export function delayText(step: Pick<SequenceStep, 'idx' | 'delaySeconds'>): string {
  const after = step.idx === 0 ? 'enrollment' : 'the previous step'
  const s = step.delaySeconds
  if (s <= 0) return `at ${after}`
  if (s % 86400 === 0) return `${s / 86400} d after ${after}`
  if (s % 3600 === 0) return `${s / 3600} h after ${after}`
  if (s % 60 === 0) return `${s / 60} min after ${after}`
  return `${s} s after ${after}`
}

/**
 * The send time a `datetime-local` value names, in unix seconds; null for now (an
 * empty value), and an error for a time that is not valid or not ahead.
 */
export function sendAt(value: string, now: number): { at: number | null } | { error: string } {
  if (!value) return { at: null }
  const ms = new Date(value).getTime()
  if (!Number.isFinite(ms)) return { error: 'That send time is not a date.' }
  const at = Math.floor(ms / 1000)
  if (at <= now) return { error: 'The send time has to be in the future.' }
  return { at }
}
