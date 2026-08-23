import { SentinelError } from './error'
import type {
  Capture,
  Captures,
  DiscoverQuery,
  Issue,
  IssueChange,
  IssueDetail,
  IssueQuery,
  Issues,
  LogQuery,
  Project,
  ProjectDraft,
  Projects,
  Scope,
  StatQuery,
  Stats,
  Table,
  TraceDetail,
  TraceQuery,
  Traces,
} from './types'

/** HOST is where the face answers when the caller does not say. */
const HOST = 'https://api.hanzo.ai'

/** FACE is the one prefix every operation hangs off. */
const FACE = '/v1/sentinel'

export interface Config {
  /** host is where the face answers. Defaults to https://api.hanzo.ai. */
  host?: string
  /** token is the caller's session credential, sent as `Authorization: Bearer`.
   *  Omit it in a browser on a Hanzo origin and the session cookie carries the
   *  request instead. A publishable `pk-` key does not belong here: it can write
   *  to the ingest endpoint and read nothing, so the face refuses it. */
  token?: string
  /** fetch replaces the global one — a test stub, or a wrapper that adds a
   *  timeout or an abort signal. */
  fetch?: typeof globalThis.fetch
}

/** Sentinel is the error plane's read face: the fifteen operations under
 *  /v1/sentinel, one function each. */
export interface Sentinel {
  /** issues lists the org's grouped issues, newest activity first. */
  issues(query?: IssueQuery): Promise<Issues>
  /** issue returns one issue with its latest occurrence. */
  issue(id: string): Promise<IssueDetail>
  /** updateIssue resolves, ignores, reopens or assigns an issue. */
  updateIssue(id: string, change: IssueChange): Promise<Issue>
  /** issueEvents lists one issue's occurrences within a project. */
  issueEvents(id: string, query: Scope & { limit?: number }): Promise<Captures>
  /** event returns one captured error by its id. */
  event(id: string, query: Scope): Promise<Capture>

  /** projects lists the org's projects, each with its DSN. */
  projects(): Promise<Projects>
  /** createProject opens a project and returns it, DSN included. */
  createProject(draft: ProjectDraft): Promise<Project>
  /** project returns one project, DSN included. */
  project(id: string): Promise<Project>
  /** deleteProject closes a project. Its DSN stops resolving at once; retained
   *  events are untouched. */
  deleteProject(id: string): Promise<void>
  /** rotateKey mints the project a new DSN key and retires every older one. */
  rotateKey(id: string): Promise<Project>

  /** logs lists a project's captures, newest first. */
  logs(query: LogQuery): Promise<Captures>
  /** stats returns a project's event rate, one bucket per interval. */
  stats(query: StatQuery): Promise<Stats>
  /** traces lists the traces a project's errors reference. */
  traces(query: TraceQuery): Promise<Traces>
  /** trace returns every captured error that carried one trace id. */
  trace(id: string, query: Scope): Promise<TraceDetail>
  /** discover aggregates a project's captures into the table asked for. */
  discover(query: DiscoverQuery): Promise<Table>
}

/** createSentinel binds a credential and a host to the fifteen operations.
 *
 *     const sentinel = createSentinel({ token })
 *     const { items } = await sentinel.issues({ period: '24h', status: 'unresolved' })
 */
export function createSentinel(config: Config = {}): Sentinel {
  const at = (id: string) => encodeURIComponent(id)
  return {
    issues: (query) => call(config, 'GET', '/issues', query),
    issue: (id) => call(config, 'GET', `/issues/${at(id)}`),
    // The document asks for the id in the body as well as in the path, so it is
    // spelled once — here — and taken from the argument the caller already gave.
    updateIssue: (id, change) =>
      call(config, 'PUT', `/issues/${at(id)}`, undefined, { ...change, id }),
    issueEvents: (id, query) => call(config, 'GET', `/issues/${at(id)}/events`, query),
    event: (id, query) => call(config, 'GET', `/events/${at(id)}`, query),

    projects: () => call(config, 'GET', '/projects'),
    createProject: (draft) => call(config, 'POST', '/projects', undefined, draft),
    project: (id) => call(config, 'GET', `/projects/${at(id)}`),
    deleteProject: async (id) => {
      await send(config, 'DELETE', `/projects/${at(id)}`)
    },
    rotateKey: (id) => call(config, 'POST', `/projects/${at(id)}/keys/rotate`),

    logs: (query) => call(config, 'GET', '/logs', query),
    stats: (query) => call(config, 'GET', '/stats', query),
    traces: (query) => call(config, 'GET', '/traces', query),
    trace: (id, query) => call(config, 'GET', `/traces/${at(id)}`, query),
    discover: (query) => call(config, 'POST', '/discover', undefined, query),
  }
}

/** Envelope is how the face wraps every answer that has one. */
interface Envelope<T> {
  status?: string
  data: T
}

/** call sends the request and hands back what the envelope carried. Callers get
 *  the data, because the envelope's own `status` says nothing the HTTP status
 *  has not already said. */
async function call<T>(
  config: Config,
  method: string,
  path: string,
  query?: object,
  body?: unknown
): Promise<T> {
  const answer = await send(config, method, path, query, body)
  return ((await answer.json()) as Envelope<T>).data
}

/** send performs the request and turns a refusal into a throw. */
async function send(
  config: Config,
  method: string,
  path: string,
  query?: object,
  body?: unknown
): Promise<Response> {
  const headers: Record<string, string> = { accept: 'application/json' }
  if (config.token) headers.authorization = `Bearer ${config.token}`
  if (body !== undefined) headers['content-type'] = 'application/json'

  const answer = await (config.fetch ?? globalThis.fetch)(
    `${config.host ?? HOST}${FACE}${path}${search(query)}`,
    {
      method,
      headers,
      // The session cookie is the credential when no token is given, and the
      // browser withholds it cross-origin unless asked.
      credentials: 'include',
      body: body === undefined ? undefined : JSON.stringify(body),
    }
  )

  if (!answer.ok) throw await refusal(answer)
  return answer
}

/** search spells the query string. An undefined field is left out, so a caller
 *  can pass a partly-filled query object and get the face's own defaults. */
function search(query: object | undefined): string {
  if (!query) return ''
  const params = new URLSearchParams()
  for (const [name, value] of Object.entries(query as Record<string, unknown>)) {
    if (value !== undefined) params.set(name, String(value))
  }
  const spelled = params.toString()
  return spelled ? `?${spelled}` : ''
}

/** refusal reads a non-2xx answer into the error to throw. */
async function refusal(answer: Response): Promise<SentinelError> {
  const text = await answer.text().catch(() => '')
  const body = read(text)
  const named = body as { code?: string; error?: string } | null
  const code = typeof named?.code === 'string' ? named.code : ''
  const said = typeof named?.error === 'string' ? named.error : text.trim()
  return new SentinelError(
    answer.status,
    code,
    said || `${answer.status} ${answer.statusText}`,
    body
  )
}

/** read parses the body when it is JSON and keeps the text when it is not. */
function read(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}
