/**
 * What a status string MEANS, and how a monochrome ladder says it.
 *
 * Provisioned things report free-form lifecycle strings — a cluster is
 * `provisioning`, an invoice is `past_due`, a deploy is `succeeded` — and every
 * list that renders them invented its own vocabulary. This is the one mapping.
 *
 * There are four tones and they are named for the STATE, not for a colour,
 * because this system has no colour to spend: the pills are rungs of the grey
 * ladder. `settled` is the steady state, `moving` is in flight, `stopped` will
 * not proceed without you, `quiet` has nothing to report.
 *
 * `stopped` is set apart by an EDGE rather than a heavier fill, which is the
 * same choice `Fieldset` makes for its destructive register: with hue
 * unavailable, an outline is what distinguishes "this one" from its neighbours.
 * Every tone therefore carries a border — transparent on three of them — so
 * turning one on shifts no layout in a table of fifty rows.
 *
 * Pure data and one pure function: `@hanzo/ui/product/pure` exports both, so a
 * billing surface can assert that `past_due` reads as an alarm without mounting
 * a pill.
 */

/** The register a status reports in. */
export type Tone = 'settled' | 'moving' | 'stopped' | 'quiet'

/** The gui tokens each tone paints with. `as const` keeps the literal types the
 *  `bg`/`color`/`borderColor` unions require. */
export const TONE = {
  settled: { bg: '$color5', color: '$color12', borderColor: 'transparent' },
  moving: { bg: '$color4', color: '$color12', borderColor: 'transparent' },
  stopped: { bg: '$color4', color: '$color12', borderColor: '$color9' },
  quiet: { bg: '$color3', color: '$color11', borderColor: 'transparent' },
} as const

/** `Past Due`, `past-due` and `PAST_DUE` are the same status. Fold the shapes a
 *  dozen backends spell it in down to one key before looking it up. */
const key = (status: string): string => status.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')

const OF: Record<string, Tone> = {
  // Platform health verdicts arrive as the traffic-light words themselves (the
  // apps inventory reports green/yellow/red directly), so they are inputs here
  // even though nothing downstream is coloured.
  green: 'settled',
  yellow: 'moving',
  red: 'stopped',

  // Resources and deploys — reached a steady state.
  ready: 'settled',
  active: 'settled',
  running: 'settled',
  available: 'settled',
  ok: 'settled',
  live: 'settled',
  succeeded: 'settled',
  connected: 'settled',
  synced: 'settled',
  imported: 'settled',

  // Resources and deploys — in flight.
  creating: 'moving',
  provisioning: 'moving',
  pending: 'moving',
  updating: 'moving',
  attaching: 'moving',
  building: 'moving',
  deploying: 'moving',
  queued: 'moving',
  importing: 'moving',

  // Resources and deploys — stopped.
  error: 'stopped',
  failed: 'stopped',
  degraded: 'stopped',
  down: 'stopped',
  canceled: 'stopped',
  conflict: 'stopped',

  // Money. An invoice, a charge or a subscription reports its own lifecycle and
  // every billing surface in the fleet re-derived it: `paid` is done, `open` is
  // waiting on the customer, `past_due` is waiting on someone to act, and a
  // `draft` or a `void` invoice is a record of something that never happened.
  paid: 'settled',
  settled: 'settled',
  complete: 'settled',
  completed: 'settled',
  fulfilled: 'settled',
  trialing: 'settled',

  open: 'moving',
  processing: 'moving',
  scheduled: 'moving',
  incomplete: 'moving',
  authorized: 'moving',

  past_due: 'stopped',
  overdue: 'stopped',
  unpaid: 'stopped',
  uncollectible: 'stopped',
  disputed: 'stopped',
  chargeback: 'stopped',
  declined: 'stopped',
  expired: 'stopped',

  draft: 'quiet',
  void: 'quiet',
  voided: 'quiet',
  refunded: 'quiet',
  paused: 'quiet',
  archived: 'quiet',
}

/** The tone a status reports in. Anything unrecognised is `quiet` — a status
 *  this table has never seen is not an alarm, it is an unknown. */
export const tone = (status: string): Tone => OF[key(status)] ?? 'quiet'
