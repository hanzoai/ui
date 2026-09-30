// The data every analytics view reads, from ONE place: analytics.hanzo.ai's
// /v1/websites API, called with the viewer's IAM bearer. A website is a cloud
// project, so the standalone app and a project page in the platform read the same
// numbers for the same site.

export type Range = '24h' | '7d' | '30d'
export const RANGES: readonly Range[] = ['24h', '7d', '30d']

/** The window a view reads, in the reporting zone (HIP-1190 §6.1). */
export const ZONE = 'America/Los_Angeles'

export interface Stats {
  pageviews: number
  visitors: number
  visits: number
  bounces: number
  totaltime: number
  comparison?: Omit<Stats, 'comparison'>
}

export interface Point {
  x: string
  y: number
}

export interface Series {
  pageviews: Point[]
  sessions: Point[]
}

/** A top-list dimension, named as the API names it. */
export type Dimension =
  | 'path'
  | 'referrer'
  | 'country'
  | 'browser'
  | 'os'
  | 'device'
  | 'event'
  | 'hostname'
  | 'title'

export interface Step {
  type: 'path' | 'event'
  value: string
}

export interface FunnelStep extends Step {
  visitors: number
  previous: number
  dropped: number
  dropoff: number
  remaining: number
}

/** A project's website: its id in analytics and the project it projects. */
export interface Website {
  websiteId: string
  org: string
  slug: string
  name: string
  liveUrl: string
  pixel: string | null
}

export interface Source {
  stats(website: string, range: Range): Promise<Stats>
  series(website: string, range: Range): Promise<Series>
  top(website: string, dimension: Dimension, range: Range, limit?: number): Promise<Point[]>
  funnel(website: string, steps: Step[], range: Range): Promise<FunnelStep[]>
  /** The viewer's projects, each with its website (analytics syncs them from cloud). */
  websites(): Promise<Website[]>
}

export class SourceError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}

/** The window a range names: start and end in ms, and the bucket its series uses. */
export function windowOf(range: Range, now = Date.now()) {
  const hour = 3_600_000
  const span = range === '24h' ? 24 * hour : range === '7d' ? 7 * 24 * hour : 30 * 24 * hour
  return { startAt: now - span, endAt: now, unit: range === '24h' ? 'hour' : 'day' }
}

/**
 * The source over analytics.hanzo.ai. `base` is its origin ('' on the app itself)
 * and `token` answers the viewer's IAM access token at call time.
 */
export function analyticsSource({ base = 'https://analytics.hanzo.ai', token }: { base?: string; token: () => string | null }): Source {
  const call = async <T>(path: string, init?: RequestInit): Promise<T> => {
    const bearer = token()
    const res = await fetch(`${base}/v1${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
      },
    })
    if (!res.ok) {
      throw new SourceError(res.status === 401 ? 'Sign in to see this project’s analytics.' : `analytics answered ${res.status}`, res.status)
    }
    return (await res.json()) as T
  }
  const query = (range: Range, extra: Record<string, string | number> = {}) => {
    const w = windowOf(range)
    const q = new URLSearchParams({ startAt: String(w.startAt), endAt: String(w.endAt), unit: w.unit, timezone: ZONE })
    for (const [k, v] of Object.entries(extra)) q.set(k, String(v))
    return q.toString()
  }
  return {
    stats: (website, range) => call<Stats>(`/websites/${website}/stats?${query(range)}`),
    series: (website, range) => call<Series>(`/websites/${website}/pageviews?${query(range)}`),
    top: (website, dimension, range, limit = 10) =>
      call<Point[]>(`/websites/${website}/metrics?${query(range, { type: dimension, limit })}`),
    funnel: (website, steps, range) => {
      const w = windowOf(range)
      return call<FunnelStep[]>('/reports/funnel', {
        method: 'POST',
        body: JSON.stringify({
          websiteId: website,
          type: 'funnel',
          filters: {},
          parameters: {
            startDate: new Date(w.startAt).toISOString(),
            endDate: new Date(w.endAt).toISOString(),
            window: 60 * 24 * 7,
            steps,
          },
        }),
      })
    },
    websites: () => call<Website[]>('/projects'),
  }
}
