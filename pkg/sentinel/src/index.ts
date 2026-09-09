// @hanzo/sentinel — the client for Sentinel, Hanzo Cloud's error plane, at
// /v1/sentinel.
//
//   import { createSentinel } from '@hanzo/sentinel'
//
//   const sentinel = createSentinel({ token })                 // or a cookie, on a Hanzo origin
//   const { items } = await sentinel.issues({ period: '24h', status: 'unresolved' })
//   await sentinel.updateIssue(items![0].id!, { status: 'resolved' })
//
// This is the READ side. Reporting an error is @hanzo/event's job, at the ingest
// endpoint its DSN names. Neither package imports the other.

export { createSentinel } from './sentinel'
export { SentinelError } from './error'
export type { Config, Sentinel } from './sentinel'
export type {
  Capture,
  Captures,
  DiscoverQuery,
  Filter,
  Frame,
  Issue,
  IssueChange,
  IssueDetail,
  IssueQuery,
  Issues,
  LogQuery,
  Occurrence,
  OccurrenceFrame,
  Period,
  Project,
  ProjectDraft,
  Projects,
  Scope,
  Stat,
  StatQuery,
  Stats,
  Status,
  Table,
  Trace,
  TraceDetail,
  TraceQuery,
  Traces,
  User,
} from './types'
