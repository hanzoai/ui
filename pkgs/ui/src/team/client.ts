/**
 * @hanzo/ui/team — TeamClient: the single typed client for IAM team/roles.
 *
 * Every call targets the canonical `/v1/iam/*` surface (nothing before /v1/),
 * carries the caller's session bearer token, and is org-scoped by the caller's
 * own org. IAM enforces app-scope, rank, and cross-org server-side; this client
 * never assumes it is trusted.
 */

import type { RoleKey, TeamApp } from './catalog'
import { appTiers, lookupRole } from './catalog'

/** A person on the team, resolved from IAM roles + user records. */
export interface TeamMember {
  /** IAM user id, "org/name". */
  id: string
  email: string
  name: string
  /** Highest managed role the member holds on this surface (incl. org:owner). */
  roleKey: RoleKey
  /** ISO timestamp the member was created (best-effort from the user record). */
  addedAt: string
}

export interface TeamClientOptions {
  /** Caller's org (from the session). All operations are scoped to it. */
  org: string
  /** API origin. Default '' → same-origin `/v1/iam/*`. Never include a path. */
  apiBase?: string
  /** Returns the caller's IAM access token (bearer). */
  getToken?: () => string | Promise<string> | undefined
  /** Injectable fetch for testing; defaults to global fetch. */
  fetchImpl?: typeof fetch
}

/** IAM Role wire shape (subset we use). */
interface IamRole {
  owner: string
  name: string
  users?: string[]
}

/** IAM User wire shape (subset we use). */
interface IamUser {
  owner: string
  name: string
  email?: string
  displayName?: string
  createdTime?: string
}

interface IamResponse<T> {
  status: string
  msg?: string
  data?: T
}

export class TeamError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message)
    this.name = 'TeamError'
  }
}

export class TeamClient {
  private readonly org: string
  private readonly base: string
  private readonly getToken: () => string | Promise<string> | undefined
  private readonly doFetch: typeof fetch

  constructor(opts: TeamClientOptions) {
    if (!opts.org) throw new TeamError('TeamClient requires an org')
    this.org = opts.org
    this.base = (opts.apiBase ?? '').replace(/\/$/, '')
    this.getToken = opts.getToken ?? (() => undefined)
    this.doFetch = opts.fetchImpl ?? globalThis.fetch?.bind(globalThis)
    if (!this.doFetch) throw new TeamError('no fetch implementation available')
  }

  // ---- HTTP ----------------------------------------------------------------

  private async authHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    const token = await this.getToken()
    if (token) headers.Authorization = `Bearer ${token}`
    return headers
  }

  private async get<T>(path: string, query: Record<string, string>): Promise<T> {
    const qs = new URLSearchParams(query).toString()
    const url = `${this.base}/v1/iam/${path}${qs ? `?${qs}` : ''}`
    const res = await this.doFetch(url, {
      method: 'GET',
      headers: await this.authHeaders(),
      credentials: 'include',
    })
    return this.unwrap<T>(res)
  }

  private async post<T>(path: string, body: unknown, query: Record<string, string> = {}): Promise<T> {
    const qs = new URLSearchParams(query).toString()
    const url = `${this.base}/v1/iam/${path}${qs ? `?${qs}` : ''}`
    const res = await this.doFetch(url, {
      method: 'POST',
      headers: await this.authHeaders(),
      credentials: 'include',
      body: JSON.stringify(body),
    })
    return this.unwrap<T>(res)
  }

  private async unwrap<T>(res: Response): Promise<T> {
    let json: IamResponse<T>
    try {
      json = (await res.json()) as IamResponse<T>
    } catch (e) {
      throw new TeamError(`IAM returned a non-JSON response (${res.status})`, e)
    }
    if (!res.ok || json.status === 'error') {
      // IAM masks authz failures as "Unauthorized operation" — surface it as-is.
      throw new TeamError(json.msg || `IAM request failed (${res.status})`)
    }
    return json.data as T
  }

  // ---- Reads ---------------------------------------------------------------

  private id(name: string): string {
    return `${this.org}/${name}`
  }

  /**
   * List the team for an app surface: everyone in the app's catalog roles, plus
   * org owners (who own everything), enriched with email/name from the org's
   * user records. Each member's displayed role is their highest managed role.
   */
  async listMembers(app: TeamApp): Promise<TeamMember[]> {
    const [roles, users] = await Promise.all([
      this.get<IamRole[]>('get-roles', { owner: this.org }),
      this.get<IamUser[]>('get-users', { owner: this.org }),
    ])

    const userById = new Map<string, IamUser>()
    for (const u of users ?? []) userById.set(`${u.owner}/${u.name}`, u)

    // Managed roles relevant to this surface: the app's tiers + org:owner.
    const relevant = new Set<string>([...appTiers(app).map((r) => r.key), 'org:owner'])

    // For each user, keep the highest-rank managed role they hold here.
    const best = new Map<string, RoleKey>()
    for (const role of roles ?? []) {
      if (role.owner !== this.org) continue
      if (!relevant.has(role.name)) continue
      const cat = lookupRole(role.name)
      if (!cat) continue
      for (const uid of role.users ?? []) {
        const cur = best.get(uid)
        if (!cur || (lookupRole(cur)?.rank ?? 0) < cat.rank) best.set(uid, cat.key as RoleKey)
      }
    }

    const members: TeamMember[] = []
    for (const [uid, roleKey] of best) {
      const u = userById.get(uid)
      members.push({
        id: uid,
        email: u?.email ?? '',
        name: u?.displayName || u?.name || uid.split('/')[1] || uid,
        roleKey,
        addedAt: u?.createdTime ?? '',
      })
    }
    // Stable order: highest rank first, then name.
    members.sort((a, b) => {
      const ra = lookupRole(b.roleKey)?.rank ?? 0
      const rb = lookupRole(a.roleKey)?.rank ?? 0
      return ra - rb || a.name.localeCompare(b.name)
    })
    return members
  }

  // ---- Mutations (all server-enforced) -------------------------------------

  /**
   * Invite a person by email to join the org at a given app-scoped role. Creates
   * an IAM invitation carrying the role key in signupGroup (applied on accept)
   * and sends it. The server guard rejects any role above the caller's rank or
   * outside their org/app.
   */
  async invite(app: TeamApp, email: string, roleKey: RoleKey): Promise<void> {
    const name = `invite-${app}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    await this.post<unknown>('add-invitation', {
      owner: this.org,
      name,
      email,
      application: app,
      signupGroup: roleKey,
      quota: 1,
      state: 'Active',
    })
    // Deliver the invitation email (best-effort; the invite already exists).
    try {
      await this.post<unknown>('send-invitation', [email], { id: this.id(name) })
    } catch {
      /* delivery is non-fatal; the invitation record stands */
    }
  }

  /**
   * Change a member's role on an app surface: remove them from every other
   * managed role for this app, then add them to the target role. Each write is a
   * guarded update-role; the server denies escalation above the caller's rank.
   */
  async changeRole(app: TeamApp, memberId: string, newRoleKey: RoleKey): Promise<void> {
    const target = lookupRole(newRoleKey)
    if (!target) throw new TeamError(`unknown role ${newRoleKey}`)

    // Remove from all app roles the member currently holds except the target.
    const appKeys = appTiers(app).map((r) => r.key)
    for (const key of appKeys) {
      if (key === newRoleKey) continue
      await this.removeFromRole(key, memberId)
    }
    // Add to the target role.
    await this.addToRole(newRoleKey, memberId)
  }

  /** Remove a member from every managed role for this app surface. */
  async remove(app: TeamApp, memberId: string): Promise<void> {
    for (const r of appTiers(app)) {
      await this.removeFromRole(r.key, memberId)
    }
  }

  private async addToRole(roleKey: RoleKey, memberId: string): Promise<void> {
    const role = await this.get<IamRole | null>('get-role', { id: this.id(roleKey) })
    const users = new Set(role?.users ?? [])
    if (users.has(memberId)) return
    users.add(memberId)
    await this.writeRole(roleKey, [...users])
  }

  private async removeFromRole(roleKey: RoleKey, memberId: string): Promise<void> {
    const role = await this.get<IamRole | null>('get-role', { id: this.id(roleKey) })
    if (!role?.users?.includes(memberId)) return
    const users = role.users.filter((u) => u !== memberId)
    await this.writeRole(roleKey, users)
  }

  private async writeRole(roleKey: RoleKey, users: string[]): Promise<void> {
    const cat = lookupRole(roleKey)!
    await this.post<unknown>(
      'update-role',
      {
        owner: this.org,
        name: roleKey,
        displayName: cat.displayName,
        description: cat.description,
        users,
        isEnabled: true,
      },
      { id: this.id(roleKey) },
    )
  }
}
