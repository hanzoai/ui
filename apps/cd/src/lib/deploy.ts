/**
 * The typed client for cloud's native CD plane (`/v1/deploy`). Same-origin: the
 * cd.hanzo.ai ingress peels `/v1/deploy/*` off to the cloud binary, so the SPA
 * calls it with `credentials: 'include'` and the first-party `hanzo_iam_token`
 * cookie (set by the PKCE login) rides — cloud validates it (SuperAdmin gate). A
 * 401/403 surfaces as an `ApiError` so the app can send the user back to sign in.
 *
 * Responses are mapped INTO the shared `@hanzo/gitops` view-models by `./adapt`.
 */
import type { LogLine, ManagedResource, ResourceTree } from "@hanzo/gitops"

import { parseApplications, toLogLines, toManagedResource, toResourceTree, type DeployApp } from "./adapt"

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

/** True when the error means "not signed in / not authorized" (→ sign-in screen). */
export const isAuthError = (e: unknown): boolean => e instanceof ApiError && (e.status === 401 || e.status === 403)

const url = (path: string): string => `/v1/deploy/${path.replace(/^\/+/, "")}`

async function request<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(url(path), {
      method,
      credentials: "include",
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (e) {
    throw new ApiError(e instanceof Error ? e.message : "network error", 0)
  }
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`
    try {
      const j = (await res.json()) as { error?: string; message?: string }
      msg = j.error || j.message || msg
    } catch {
      /* non-JSON body */
    }
    throw new ApiError(msg, res.status)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export const DeployApi = {
  /** The fleet: every operator App CR (`GET /v1/deploy/applications`). */
  applications: async (): Promise<DeployApp[]> => parseApplications(await request<unknown>("GET", "applications")),

  /**
   * One application's owned-resource tree
   * (`GET /v1/deploy/applications/:name/resource-tree`).
   *
   * The wired route lives under `applications/` — the shorter `:name/tree` form
   * belongs to an unregistered handler, so it 404s against the live plane.
   */
  tree: async (name: string): Promise<ResourceTree> =>
    toResourceTree(await request<unknown>("GET", `applications/${encodeURIComponent(name)}/resource-tree`)),

  /** One tree node's live manifest + desired-vs-live (`GET /v1/deploy/:name/resource/:ref`). */
  resource: async (name: string, ref: string): Promise<ManagedResource> =>
    toManagedResource(await request<unknown>("GET", `${encodeURIComponent(name)}/resource/${encodeURIComponent(ref)}`)),

  /** The newest pod's logs (`GET /v1/deploy/:name/logs`). */
  logs: async (name: string, tail = 300): Promise<LogLine[]> =>
    toLogLines(await request<unknown>("GET", `${encodeURIComponent(name)}/logs?tail=${tail}`)),

  /** Pin the CR image to a prior clean-semver release (`POST /v1/deploy/:name/rollback`). */
  rollback: async (name: string, tag: string): Promise<void> => {
    await request<unknown>("POST", `${encodeURIComponent(name)}/rollback`, { tag })
  },

  /** Request an operator reconcile now (`POST /v1/deploy/:name/sync`). */
  sync: async (name: string): Promise<void> => {
    await request<unknown>("POST", `${encodeURIComponent(name)}/sync`, {})
  },
}

/** Read the `hanzo_iam_token` cookie the PKCE login sets (non-httpOnly by design). */
export function hasSession(): boolean {
  return document.cookie.split(";").some((c) => c.trim().startsWith("hanzo_iam_token="))
}
