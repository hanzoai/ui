import { bearer, currentOrg } from '../auth/session'
import type { Accepted, Policy, Progress, Stored } from './state'

/** Where the IAM and billing routes answer from. api.hanzo.ai answers CORS for every Hanzo host. */
export const API = 'https://api.hanzo.ai'

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
  }
}

export function parseErrorMessage(body: unknown, status: number): string {
  if (!body) return `Request failed (${status})`
  if (typeof body === 'string') return body
  if (typeof body === 'object') {
    const b = body as Record<string, unknown>
    if (typeof b.detail === 'string' && b.detail) return b.detail
    if (typeof b.message === 'string' && b.message) return b.message
    if (typeof b.msg === 'string' && b.msg) return b.msg
    if (typeof b.error === 'string' && b.error) return b.error
    if (typeof b.error === 'object' && b.error !== null) {
      const errObj = b.error as Record<string, unknown>
      if (typeof errObj.message === 'string' && errObj.message) return errObj.message
      if (typeof errObj.detail === 'string' && errObj.detail) return errObj.detail
      if (typeof errObj.msg === 'string' && errObj.msg) return errObj.msg
    }
  }
  return `Request failed (${status})`
}

export async function call<T>(base: string, path: string, init: RequestInit = {}, explicitToken?: string): Promise<T> {
  const token = explicitToken || bearer()
  const activeOrg = currentOrg()
  const customHeaders = (init.headers as Record<string, string> | undefined) ?? {}
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(activeOrg && !customHeaders['X-Org-Id'] ? { 'X-Org-Id': activeOrg } : {}),
      ...customHeaders,
    },
  })
  const text = await res.text()
  let body: unknown = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = null
  }
  if (!res.ok) {
    throw new ApiError(parseErrorMessage(body, res.status), res.status)
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
