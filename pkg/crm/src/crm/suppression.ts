/**
 * The suppression list's two pure decisions, kept apart from the components so they
 * are tested without React: who may change the list, and what a refusal says.
 */

import type { Account } from '../lib/host'
import type { SuppressionCheck } from '../lib/crm'

/** Whether this account may change the org's suppression list: an admin of the org or a SuperAdmin, as the cloud requires. */
export function managesSuppressions(account: Account | null | undefined, org: string): boolean {
  return account?.superAdmin === true || (account?.adminOrgs ?? []).includes(org)
}

const SCOPE: Record<'address' | 'domain' | 'platform', string> = {
  address: 'this address is on the suppression list',
  domain: "their company's domain is on the suppression list",
  platform: 'the address is on the platform blocklist',
}

/** Why an address may not be written to, in one line; null when the gate says it may or did not answer. */
export function unmailable(check: SuppressionCheck | null): string | null {
  if (check?.state !== 'suppressed') return null
  return `Not mailable: ${SCOPE[check.scope ?? 'address']}${check.reason ? ` (${check.reason})` : ''}.`
}
