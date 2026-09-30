import type { PlanId } from './plans'

/**
 * Where a person is in onboarding, kept on the IAM user (`onboarding` in
 * POST /v1/iam/preferences) so a returning person never repeats a finished
 * step and an interrupted one resumes where it stopped.
 */

export type Use = 'personal' | 'team' | 'enterprise'

export interface Progress {
  use?: Use
  /** A plan chosen and paid for, or `free` when skipped on the personal path. */
  plan?: PlanId
  /** The IAM org this person's team lives in. */
  team?: string
  /** Enterprise: the contact form was sent. */
  sales?: boolean
  /** The chat notice was accepted. */
  notice?: boolean
  /** A display name is set (IAM's displayName). */
  named?: boolean
  role?: string
}

/** The screen onboarding shows next, or `done`. `plans` and `use` are reached from `pro`, never first. */
export type Step = 'pro' | 'plans' | 'use' | 'team' | 'seats' | 'enterprise' | 'done'

export function step(p: Progress): Step {
  if (!p.use) return p.plan ? 'done' : 'pro'
  if (p.use === 'personal') return p.plan ? 'done' : 'pro'
  if (p.use === 'team') {
    if (!p.team) return 'team'
    return p.plan ? 'done' : 'seats'
  }
  return p.sales ? 'done' : 'enterprise'
}

/** Before a first chat: the notice, then a name, then a role. */
export type ChatStep = 'notice' | 'name' | 'role' | 'done'

export function chatStep(p: Progress, hasName: boolean): ChatStep {
  if (!p.notice) return 'notice'
  if (!hasName && !p.named) return 'name'
  if (!p.role) return 'role'
  return 'done'
}

/** The document versions a person agreed to. One constant per host names them; the legal pages print the same ones. */
export interface Policy {
  terms: string
  aup: string
}

/** What IAM keeps of an acceptance: the versions, when, and how (`email-code`, `signed-in`). */
export interface Accepted extends Policy {
  time: string
  method: string
}

/** An account this young, that has accepted nothing, was made by the sign-in that just finished. */
export const NEW_WITHIN = 60 * 60 * 1000

/**
 * Whether the "Let's create your account" page is owed: the person has no
 * acceptance on record and the account was made a moment ago (a provider's first
 * sign-in). An older account is a returning one and is never asked.
 */
export function owesTerms(accepted: Accepted | undefined, createdTime: string | undefined, now: number = Date.now()): boolean {
  if (accepted?.terms && accepted.aup) return false
  const made = createdTime ? Date.parse(createdTime) : Number.NaN
  return Number.isFinite(made) && now - made <= NEW_WITHIN
}

/** The stored blob's shape: `onboarding` is this, `train_opt_in` sits beside it, `terms` is IAM's own record. */
export interface Stored {
  onboarding?: Progress
  train_opt_in?: boolean
  terms?: Accepted
}
