'use client'

/**
 * Honest backend states for `/v1`-backed modules — ONE place that maps a thrown
 * HTTP error to a truthful explanation.
 *
 * A 503 means the runtime/keys aren't wired on this deployment yet, a 404/405
 * means the route isn't mounted here, 401/403 means the session can't read it,
 * 402 means the org has no funded balance. Nothing is fabricated — on failure the
 * caller shows this card instead of placeholder rows/charts.
 *
 * Classification is duck-typed on `status`, so any client's error class works
 * (console's `ApiError`, commerce's `CommerceError`, …) without this layer
 * depending on one. Effects come from `useHost()`.
 */
import type { ReactNode } from 'react'
import { Button, Card, Text, XStack } from '@hanzo/gui'
import { TriangleAlert, CreditCard } from '@hanzogui/lucide-icons-2'

import { useHost } from './host'

export type BackendStateKind =
  | 'not-initialized'
  | 'unavailable'
  | 'not-implemented'
  | 'access'
  | 'signin'
  | 'billing'
  | 'error'

export type BackendState = { kind: BackendStateKind; message: string }

/**
 * Classify a thrown `/v1` error into an honest kind + raw message.
 *
 * 401 and 403 are DISTINCT for a signed-in user: 401 = the session is expired /
 * not recognized (re-auth fixes it → `signin`), 403 = the account IS signed in
 * but this surface isn't authorized/enabled for its org (`access`). A signed-in
 * user is NEVER told to "sign in" for a 403 — that would be a false instruction.
 */
export function classifyBackend(e: unknown): BackendState {
  const status = typeof (e as { status?: unknown })?.status === 'number' ? (e as { status: number }).status : 0
  const message = e instanceof Error ? e.message : String(e)
  if (status === 503) return { kind: 'not-initialized', message }
  if (status === 404 || status === 405) return { kind: 'unavailable', message }
  // 501 — the route EXISTS and answers honestly that its body ships later (the
  // Cloudflare R2/KV/D1 Phase-2 seams). Distinct from 404 (not mounted here): the
  // capability is real and planned, so say that rather than "not available yet".
  if (status === 501) return { kind: 'not-implemented', message }
  if (status === 402) return { kind: 'billing', message }
  if (status === 401) return { kind: 'signin', message }
  if (status === 403) return { kind: 'access', message }
  return { kind: 'error', message }
}

/**
 * Classify a READ (GET/list) failure. Identical to `classifyBackend` EXCEPT a 402
 * is NOT a wall: listing/reading a resource is never credit-gated, so a 402 on a
 * read means "nothing is provisioned yet" — the caller shows its honest EMPTY
 * state (e.g. "No buckets yet · Create one"), never an "add credits" paywall
 * (that belongs only on a paid WRITE). Returns `null` for a 402 → treat as empty.
 */
export function classifyRead(e: unknown): BackendState | null {
  const s = classifyBackend(e)
  return s.kind === 'billing' ? null : s
}

const TITLES: Record<BackendStateKind, string> = {
  'not-initialized': 'Backend not initialized',
  unavailable: 'Not available on this deployment yet',
  'not-implemented': 'Not yet available',
  access: 'Not enabled for your account',
  signin: 'Your session expired',
  billing: 'Add credits to continue',
  error: 'Could not reach the backend',
}

const BODIES: Record<BackendStateKind, string> = {
  'not-initialized':
    'The /v1 route is mounted but its runtime (or the console API key it proxies to) is not configured on this deployment yet. Real data appears here once it is — no placeholder data is shown.',
  unavailable:
    'This endpoint is not mounted at the gateway on this host yet. The view lights up automatically once the route is live.',
  // 501 — a real, planned capability whose body ships in a later phase.
  'not-implemented':
    'This capability is planned but not wired yet. The backend answers honestly rather than pretending it worked — nothing here is fabricated, and the view lights up automatically once it ships.',
  // 403 for a SIGNED-IN user — never "sign in".
  access:
    "You're signed in, but this isn't enabled for your organization on this deployment, or it's an admin-only surface. It appears here automatically once your account has access — nothing is fabricated.",
  // 401 — the session itself lapsed; re-auth returns to this exact page.
  signin: 'Your session has expired or isn’t recognized here. Sign in again to continue where you left off.',
  // Empty → the card shows the backend's own message (the honest "Insufficient
  // balance. Please add credits…" from the gateway billing gate).
  billing: '',
  error: '',
}

/** A truthful state card for a `/v1` load failure, with an optional retry + hint. */
export function BackendStateCard({
  state,
  onRetry,
  hint,
}: {
  state: BackendState
  onRetry?: () => void
  hint?: ReactNode
}) {
  const { signIn, addCredits } = useHost()
  return (
    <Card borderWidth={1} borderColor="$borderColor" p="$4" gap="$2" maxWidth={640}>
      <XStack gap="$2" items="center">
        <TriangleAlert size={16} />
        <Text fontSize="$4" fontWeight="700">
          {TITLES[state.kind]}
        </Text>
      </XStack>
      <Text fontSize="$3" color="$color11">
        {BODIES[state.kind] || state.message}
      </Text>
      {hint ? (
        <Text fontSize="$2" color="$color10">
          {hint}
        </Text>
      ) : null}
      {state.kind === 'signin' && signIn ? (
        <Button size="$2" theme="light" self="flex-start" onPress={signIn}>
          Sign in again
        </Button>
      ) : state.kind === 'billing' && addCredits ? (
        // 402 — the org has no funded balance. Offer a top-up CTA (and keep Retry so
        // a returning, funded caller can reload in place).
        <XStack gap="$2" items="center" flexWrap="wrap">
          <Button size="$2" theme="light" self="flex-start" icon={<CreditCard size={14} />} onPress={addCredits}>
            Add credits
          </Button>
          {onRetry ? (
            <Button size="$2" self="flex-start" onPress={onRetry}>
              Retry
            </Button>
          ) : null}
        </XStack>
      ) : onRetry ? (
        <Button size="$2" self="flex-start" onPress={onRetry}>
          Retry
        </Button>
      ) : null}
    </Card>
  )
}
