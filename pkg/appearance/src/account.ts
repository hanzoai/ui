/**
 * Where a preference lives when it belongs to a PERSON rather than to a browser.
 *
 * `state.ts` owns the device and the document. This owns the account, and the two
 * are separate because they answer different questions: localStorage answers
 * "what should this paint, right now, before anything has loaded", and the
 * account answers "what did this person choose". Only the second one crosses a
 * domain.
 *
 * That distinction is the whole reason this file exists. localStorage is
 * per-ORIGIN, so hanzo.ai, hanzo.chat, hanzo.app and console each held their own
 * copy of one person's setting: text set to 1.3 on hanzo.ai rendered 18.2px there
 * and 14px on the other three, same browser, same person. A setting that does not
 * travel reads as a setting that does not work.
 *
 * IAM keeps it in the account's `hanzo.preferences` blob, beside consent, under
 * `appearance`. The endpoint is SELF-SCOPED: the target is always the caller
 * resolved from its bearer, never a name in the body, so this cannot write
 * anyone else's preference and does not take a user id.
 *
 * The merge is IAM's, not ours: top-level keys are shallow-merged and the merged
 * object comes back, so two products writing different keys do not clobber each
 * other and neither has to read-modify-write.
 */
import type { Preference } from '@hanzo/design'

/** The member of the preferences blob this package owns. IAM names it the same. */
const MEMBER = 'appearance'

export interface Account {
  /** IAM's origin, e.g. `https://hanzo.id`. */
  base: string
  /**
   * A bearer, for a caller on another origin. Omit it on IAM's own host, where
   * the session is a first-party cookie and rides along on its own — that is how
   * the portal reads the account today, and requiring a token there would mean
   * inventing one to satisfy a signature.
   */
  token?: string
  signal?: AbortSignal
}

/**
 * What this PERSON chose, or nothing.
 *
 * Returns undefined rather than a default for every failure — signed out, offline,
 * a blob this version does not understand — because a default here would be
 * indistinguishable from a choice and would overwrite the device's own answer
 * with a neutral one. Absent means "ask the next layer", and that is what
 * `resolve()` expects.
 */
export async function load({ base, token, signal }: Account): Promise<Preference | undefined> {
  try {
    // An empty patch merges nothing and returns the stored object, so the write
    // endpoint is also the read. One route, one merge, one shape to keep in step.
    const res = await post(base, token, {}, signal)
    return res?.[MEMBER] as Preference | undefined
  } catch {
    return undefined
  }
}

/**
 * Record this person's choice, and answer whether it stuck.
 *
 * A caller that told someone "saved" needs to know, the same rule `write()` lives
 * by on the device side. A failure here is not fatal: the device copy still
 * carries the choice, so the person sees what they picked on this browser and it
 * reconciles the next time a write succeeds.
 */
export async function save(
  appearance: Preference,
  { base, token, signal }: Account
): Promise<boolean> {
  try {
    return !!(await post(base, token, { [MEMBER]: appearance }, signal))
  } catch {
    return false
  }
}

async function post(
  base: string,
  token: string | undefined,
  patch: Record<string, unknown>,
  signal?: AbortSignal
): Promise<Record<string, unknown> | undefined> {
  const res = await fetch(`${base.replace(/\/+$/, '')}/v1/iam/preferences`, {
    method: 'POST',
    // Sent either way: on IAM's own host this IS the session, and cross-origin it
    // is harmless next to the bearer. One request shape rather than two.
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(patch),
    signal,
  })
  if (!res.ok) return undefined
  return (await res.json()) as Record<string, unknown>
}
