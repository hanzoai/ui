/**
 * THE HOST — what the app that draws the CRM supplies, once, before it draws it.
 *
 * The CRM is one product drawn by more than one app: Hanzo Cloud's console (at
 * /crm, and as Hanzo CRM on crm.<brand>) and Hanzo Team (at /crm). What it keeps
 * is the org's own Base (hanzoai/base module `crm`) and the cloud's mail and
 * drip, so every app reads the same records. What it cannot know is how this app
 * signs a request, which org it works in, who is signed in, how it changes the
 * address and what brand it wears. The host says, through `configureCrm`:
 *
 *   configureCrm({
 *     v1Url, get, post, del,  // plain-JSON REST over the account's credential
 *     base,                   // the org's Base, as a records client
 *     org, leaveOrg,          // the org in scope, and the way out of it
 *     brand,                  // the brand's name and site
 *     gated,                  // whether this is the crm face, opened behind its beta
 *     useSession, useRouter, useSearchParams,  // React hooks over the app's own
 *   })
 *
 * The CRM's modules were written against names the console gave these (`currentOrg`,
 * `useRouter`, `restGet`, …); the same names are exported here, bound to the host,
 * so what was moved out of the console reads exactly as it did there.
 */
import type { BaseClient } from './base-data/api'

/** The signed-in account, as much of it as the CRM reads. */
export interface CrmAccount {
  name?: string
  email?: string
  /** A SuperAdmin acts in every org. */
  superAdmin?: boolean
  /** The orgs this account administers. */
  adminOrgs?: string[]
}

/** The session the CRM reads: who is signed in, and the way to sign out. */
export interface CrmSession {
  account: CrmAccount | null
  signOut: () => void | Promise<void>
}

/**
 * How the CRM changes the address. It writes the console's own addresses
 * (`/crm`, `/crm/companies`, `/crm/deals/:id`, `?view=`); a host whose CRM lives
 * elsewhere (crm.<brand> at its root) maps them.
 */
export interface CrmRouter {
  push: (href: string) => void
  replace: (href: string) => void
}

/** The query of the address the CRM is on. */
export interface CrmSearchParams {
  get: (name: string) => string | null
}

/** The brand the CRM wears. */
export interface CrmBrand {
  /** "Hanzo Cloud", "Hanzo"; a trailing " Cloud" is dropped where the CRM names itself. */
  brandName: string
  /** The brand's site, where its beta is applied for (`<websiteUrl>/beta`). */
  websiteUrl: string
}

export interface CrmHost {
  /** The absolute address of an API path: `v1Url('marketing/sequences')`. */
  v1Url: (path: string) => string
  /**
   * Plain-JSON REST on a full URL, signed as the account in the org. A refusal
   * rejects with an Error carrying the HTTP `status` (and the parsed `body`).
   */
  get: <T>(url: string) => Promise<T>
  post: <T>(url: string, body?: unknown) => Promise<T>
  del: <T>(url: string) => Promise<T>
  /** The org's Base (`/v1/base`), signed the same way. */
  base: () => BaseClient
  /** The org the CRM works in. */
  org: () => string
  /** Leave the org for the account's own: the way out of an org whose CRM this account's role does not reach. */
  leaveOrg: () => void
  brand: () => CrmBrand
  /**
   * Whether the CRM is a product opened behind its beta here (the crm face): the
   * org's `crm` enablement is read before any CRM call, and an org without it is
   * shown how to join. False where the CRM is one module among others.
   */
  gated: boolean
  /** React hooks, called on every render of the CRM's screens. */
  useSession: () => CrmSession
  useRouter: () => CrmRouter
  useSearchParams: () => CrmSearchParams | null
}

let current: CrmHost | null = null

/** Say what the CRM needs of this app. Call once, before the CRM is drawn. */
export function configureCrm(host: CrmHost): void {
  current = host
}

/** The host this app configured. */
export function host(): CrmHost {
  if (!current) throw new Error('@hanzo/crm: call configureCrm(host) before drawing the CRM.')
  return current
}

/**
 * A refusal from the API: an Error carrying its HTTP `status`, and the parsed body
 * when the caller reads more than the reason (a 422's per-recipient detail).
 *
 * The host's transport throws its OWN error type. What makes one an API error is
 * its shape, not its class, so `instanceof ApiError` holds for any Error with a
 * numeric `status`: the host's and this one alike.
 */
export class ApiError extends Error {
  readonly status: number
  readonly body?: unknown
  constructor(message: string, status = 0, body?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
  static [Symbol.hasInstance](x: unknown): boolean {
    return x instanceof Error && typeof (x as { status?: unknown }).status === 'number'
  }
}

/** The account type the CRM's modules name. */
export type Account = CrmAccount

export const v1Url = (path: string): string => host().v1Url(path)
export const restGet = <T>(url: string): Promise<T> => host().get<T>(url)
export const restPost = <T>(url: string, body?: unknown): Promise<T> => host().post<T>(url, body)
export const restDelete = <T = void>(url: string): Promise<T> => host().del<T>(url)
export const currentOrg = (): string => host().org()
export const leaveOrg = (): void => host().leaveOrg()
export const getBrand = (): CrmBrand => host().brand()
export const useSession = (): CrmSession => host().useSession()
export const useRouter = (): CrmRouter => host().useRouter()
export const useSearchParams = (): CrmSearchParams | null => host().useSearchParams()
