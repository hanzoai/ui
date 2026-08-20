/**
 * The Sentinel wire types, derived from the o11y plugin's OpenAPI document.
 *
 * Two rules run through the whole file.
 *
 * Requests are narrow, answers are wide. A value WE send is typed to the set the
 * face accepts, so a typo fails at compile time. A value the face SENDS BACK is
 * typed `string`, so a value it starts returning tomorrow is not a lie today.
 * The narrowing follows the document's own wording: a closed list ("unresolved,
 * resolved or ignored") becomes a union, an open one ("e.g. error, warning")
 * stays a string.
 *
 * Every answer field is optional, because the document marks none of them
 * required — an absent field is a shape the face is allowed to send.
 */

/** Period is the window to read, relative to now. */
export type Period = '1h' | '24h' | '7d' | '14d' | '30d'

/** Status is an issue's lifecycle state. */
export type Status = 'unresolved' | 'resolved' | 'ignored'

/** Scope names the project an operation reads. A project is the isolation unit,
 *  so an operation that can only answer within one asks for it by id. */
export interface Scope {
  project: string
}

/** Issue is a group of like errors, with the lifecycle carried on the group. */
export interface Issue {
  id?: string
  /** fingerprint is the grouping key that puts like errors in one issue. */
  fingerprint?: string
  /** culprit is the function or route blamed for the error. */
  culprit?: string
  /** type is the exception type, value its message. */
  type?: string
  value?: string
  /** level is the severity, e.g. error, warning, info. */
  level?: string
  /** platform is the reporting runtime, e.g. go, python, javascript. */
  platform?: string
  environment?: string
  serviceName?: string
  release?: string
  status?: string
  assignee?: string
  /** regressed marks an issue that reopened after being resolved. */
  regressed?: boolean
  /** count is how many occurrences have landed on the issue. */
  count?: number
  firstSeen?: string
  lastSeen?: string
  resolvedAt?: string
  createdAt?: string
  updatedAt?: string
}

/** Issues is one page of issues and how many matched the filter. */
export interface Issues {
  items?: Issue[]
  total?: number
  offset?: number
  limit?: number
}

/** IssueDetail is an issue and the most recent occurrence that landed on it. */
export interface IssueDetail {
  issue?: Issue
  latestEvent?: Occurrence
}

/** Occurrence is one sample of an issue, in the spelling the Sentry envelope
 *  carried it: a nested user, and frames named filename/lineno/colno. */
export interface Occurrence {
  eventId?: string
  fingerprint?: string
  culprit?: string
  type?: string
  value?: string
  level?: string
  platform?: string
  environment?: string
  serviceName?: string
  serverName?: string
  release?: string
  transaction?: string
  traceId?: string
  spanId?: string
  timestamp?: string
  tags?: Record<string, string>
  user?: User
  /** frames are the stack, innermost first. */
  frames?: OccurrenceFrame[]
}

/** OccurrenceFrame is one stack frame of an occurrence. */
export interface OccurrenceFrame {
  filename?: string
  absPath?: string
  module?: string
  function?: string
  lineno?: number
  colno?: number
  /** inApp marks a frame in the reporting application's own code. */
  inApp?: boolean
}

/** User is the affected end user, when the reporter attached one. */
export interface User {
  id?: string
  email?: string
  username?: string
  ipAddress?: string
}

/** Capture is one error as the events plane stores it — flattened, with the org
 *  and project it belongs to and when it arrived. It is the answer to `event`,
 *  `logs`, `issueEvents` and `trace`. */
export interface Capture {
  eventId?: string
  orgId?: string
  projectId?: string
  fingerprint?: string
  culprit?: string
  type?: string
  value?: string
  message?: string
  level?: string
  platform?: string
  environment?: string
  serviceName?: string
  serverName?: string
  release?: string
  transaction?: string
  traceId?: string
  spanId?: string
  /** handled says whether the application caught it. */
  handled?: boolean
  /** timestamp is when the error happened, receivedAt when it arrived here. */
  timestamp?: string
  receivedAt?: string
  tags?: Record<string, string>
  userId?: string
  userEmail?: string
  userIp?: string
  /** frames are the stack, innermost first. */
  frames?: Frame[]
}

/** Frame is one stack frame of a capture. */
export interface Frame {
  file?: string
  function?: string
  line?: number
  column?: number
  /** own marks a frame in the reporting application's own code rather than in a
   *  dependency. */
  own?: boolean
}

/** Captures are error events, newest first. */
export interface Captures {
  items?: Capture[]
}

/** Project is an ingest destination and the DSN that addresses it. */
export interface Project {
  id?: string
  name?: string
  slug?: string
  platform?: string
  /** status is the lifecycle state: active or disabled. */
  status?: string
  /** dsn is the project's freshly-derived ingest address. Hand it to
   *  @hanzo/event; it is the one place an ingest address is spelled. */
  dsn?: string
  createdAt?: string
  updatedAt?: string
}

/** Projects are the org's projects and how many it has. */
export interface Projects {
  items?: Project[]
  total?: number
}

/** Stat is one bucket of the event-rate timeseries. */
export interface Stat {
  /** time is the start of the bucket, value how many events fell in it. */
  time?: string
  value?: number
}

/** Stats are the buckets, oldest first. */
export interface Stats {
  items?: Stat[]
}

/** Trace is one trace a project's errors reference, and what landed on it. */
export interface Trace {
  traceId?: string
  count?: number
  firstSeen?: string
  lastSeen?: string
  /** message is the latest error message seen on the trace. */
  message?: string
}

/** Traces are the traces, most recent first. */
export interface Traces {
  items?: Trace[]
}

/** TraceDetail is a trace and every error event that carried its id. */
export interface TraceDetail {
  traceId?: string
  events?: Capture[]
}

/** Table is the answer to `discover`: the columns asked for, and rows as long as
 *  the columns. A cell holds whatever the aggregation produced, so it is
 *  `unknown` — narrow it where you read it. */
export interface Table {
  columns?: string[]
  rows?: unknown[][]
}

/** Filter narrows a `discover` scan to rows whose field tests true. */
export interface Filter {
  field: string
  /** op is how to test the field: eq, neq or like. */
  op: 'eq' | 'neq' | 'like'
  value: string
}

/** IssueQuery narrows and pages a list of issues. Every field is optional; the
 *  face defaults the window, the page and the sort. */
export interface IssueQuery {
  /** project narrows the org's issues to one project. Omit for all of them. */
  project?: string
  period?: Period
  status?: Status
  /** level is a severity, e.g. error, warning, info. */
  level?: string
  environment?: string
  serviceName?: string
  /** query narrows to issues whose text contains it. */
  query?: string
  /** sort orders the page, e.g. lastSeen, firstSeen, count. */
  sort?: string
  offset?: number
  limit?: number
}

/** IssueChange is a lifecycle move. Unset fields are left alone. */
export interface IssueChange {
  status?: Status
  assignee?: string
}

/** LogQuery reads a project's captures, newest first. */
export interface LogQuery extends Scope {
  /** query narrows to events whose message or exception text contains it. */
  query?: string
  period?: Period
  limit?: number
}

/** StatQuery reads a project's event rate. */
export interface StatQuery extends Scope {
  /** field is the dimension to count over. Omit to count all events. */
  field?: string
  period?: Period
}

/** TraceQuery lists the traces a project's errors reference. */
export interface TraceQuery extends Scope {
  period?: Period
  limit?: number
}

/** DiscoverQuery is an aggregation over a project's captures: filter, group,
 *  measure, order. */
export interface DiscoverQuery extends Scope {
  filters?: Filter[]
  groupBy?: string[]
  /** aggregations are the measures to compute per group. Omit for a count. */
  aggregations?: string[]
  orderBy?: string
  orderDir?: 'asc' | 'desc'
  period?: Period
  limit?: number
}

/** ProjectDraft is a new project. The org, id and key are the face's to assign;
 *  the slug is derived from the name when omitted. */
export interface ProjectDraft {
  name: string
  slug?: string
  platform?: string
}
