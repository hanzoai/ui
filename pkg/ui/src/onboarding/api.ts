import { bearer } from '../auth/session'
import type { Accepted, Policy, Progress, Stored } from './state'

/** Where the IAM and billing routes answer from. api.hanzo.ai answers CORS for every Hanzo host. */
export const API = 'https://api.hanzo.ai'

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
  }
}

export async function call<T>(base: string, path: string, init: RequestInit = {}): Promise<T> {
  const token = bearer()
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init.headers as Record<string, string> | undefined) },
  })
  const text = await res.text()
  let body: unknown = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = null
  }
  if (!res.ok) {
    const b = body as { detail?: string; msg?: string; error?: string } | null
    throw new ApiError(b?.detail ?? b?.msg ?? b?.error ?? `Request failed (${res.status})`, res.status)
  }
  // IAM wraps answers as {status, data}; billing answers bare.
  const wrapped = body as { status?: string; data?: unknown } | null
  return (wrapped && wrapped.status === 'ok' && 'data' in wrapped ? wrapped.data : body) as T
}

/** POST /v1/iam/preferences: shallow-merged onto the stored blob; `{}` reads it. */
export const preferences = (base: string, patch: Record<string, unknown> = {}) => call<Stored>(base, '/v1/iam/preferences', { method: 'POST', body: JSON.stringify(patch) })

export const saveProgress = (base: string, patch: Progress) =>
  preferences(base).then((cur) => preferences(base, { onboarding: { ...(cur.onboarding ?? {}), ...patch } }))

export interface Account {
  owner?: string
  name?: string
  displayName?: string
  email?: string
  createdTime?: string
}

/** PUT /v1/iam/terms: IAM records that the signed-in caller accepted these versions, with the time and the method. */
export const acceptTerms = (base: string, policy: Policy) => call<Accepted>(base, '/v1/iam/terms', { method: 'PUT', body: JSON.stringify(policy) })

export const account = (base: string) => call<Account>(base, '/v1/iam/account')
export const rename = (base: string, displayName: string) => call<Account>(base, '/v1/iam/account', { method: 'PUT', body: JSON.stringify({ displayName }) })
