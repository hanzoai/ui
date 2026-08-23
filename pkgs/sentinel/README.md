# @hanzo/sentinel

The client for **Sentinel**, Hanzo Cloud's error plane, at `/v1/sentinel`.

`@hanzo/event` is the write side: it reports errors to the ingest endpoint its
DSN names. This is the read side — the fifteen operations that list issues, resolve
them, read the captured errors behind them, manage the projects that receive
them, and query logs, rates, traces and aggregates. Neither package imports the
other.

```bash
pnpm add @hanzo/sentinel
```

```ts
import { createSentinel } from '@hanzo/sentinel'

const sentinel = createSentinel({ token })

const { items = [] } = await sentinel.issues({ period: '24h', status: 'unresolved' })
for (const issue of items) console.log(issue.count, issue.type, issue.value)

await sentinel.updateIssue(items[0].id!, { status: 'resolved' })
```

## The credential

Sentinel reads are session-authenticated. Pass a `token` and it rides as
`Authorization: Bearer`; omit it in a browser on a Hanzo origin and the session
cookie carries the request instead.

A publishable `pk-` key does not belong here. It can write to the ingest endpoint
and read nothing, so the face refuses it.

## Operations

| Call | Address |
| --- | --- |
| `issues(query?)` | `GET /v1/sentinel/issues` |
| `issue(id)` | `GET /v1/sentinel/issues/{id}` |
| `updateIssue(id, change)` | `PUT /v1/sentinel/issues/{id}` |
| `issueEvents(id, query)` | `GET /v1/sentinel/issues/{id}/events` |
| `event(id, query)` | `GET /v1/sentinel/events/{id}` |
| `projects()` | `GET /v1/sentinel/projects` |
| `createProject(draft)` | `POST /v1/sentinel/projects` |
| `project(id)` | `GET /v1/sentinel/projects/{id}` |
| `deleteProject(id)` | `DELETE /v1/sentinel/projects/{id}` |
| `rotateKey(id)` | `POST /v1/sentinel/projects/{id}/keys/rotate` |
| `logs(query)` | `GET /v1/sentinel/logs` |
| `stats(query)` | `GET /v1/sentinel/stats` |
| `traces(query)` | `GET /v1/sentinel/traces` |
| `trace(id, query)` | `GET /v1/sentinel/traces/{id}` |
| `discover(query)` | `POST /v1/sentinel/discover` |

Each returns what the answer envelope carried, not the envelope — the envelope's
own `status` says nothing the HTTP status has not already said.

## Refusals

A non-2xx answer is a **throw**, never an `undefined` that reads as an empty
result.

```ts
import { SentinelError } from '@hanzo/sentinel'

try {
  await sentinel.issues()
} catch (error) {
  if (error instanceof SentinelError && error.code === 'forbidden') signIn()
}
```

`status` is the HTTP status, `code` is the face's own word for the refusal
(`forbidden`, `not_found`) or empty when it did not give one, and `body` is what
came back — parsed when it was JSON, the raw text when the edge answered
`404 page not found` instead.

## Projects and DSNs

`projects()`, `createProject()` and `rotateKey()` each answer with the project's
freshly-derived `dsn`. Hand that string to `@hanzo/event`: the DSN is the one
place an ingest address is spelled.

```ts
const project = await sentinel.createProject({ name: 'hanzo-app', platform: 'javascript' })
project.dsn // https://<key>@api.hanzo.ai/v1/event/<projectId>
```

Rotating retires every key below the new one, so a surface still holding the old
DSN stops being able to report until it is redeployed with the new one.
