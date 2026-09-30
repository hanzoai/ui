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

/** The plan onboarding shows next: a screen, or `done`. */
export type Step = 'use' | 'plans' | 'team' | 'seats' | 'enterprise' | 'done'

export function step(p: Progress): Step {
  if (!p.use) return 'use'
  if (p.use === 'personal') return p.plan ? 'done' : 'plans'
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

/** The stored blob's shape: `onboarding` is this, `train_opt_in` sits beside it. */
export interface Stored {
  onboarding?: Progress
  train_opt_in?: boolean
}
