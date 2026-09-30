# @hanzo/sentinel

The client for **Sentinel**, Hanzo Cloud's error plane, at `/v1/sentinel`.

`@hanzo/event` is the write side: it reports each error to `/v1/event`. This is the read side — the fourteen operations that list issues, resolve
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

## Projects

`projects()`, `createProject()` and `project()` answer with the org's error projects, one
per site. Errors arrive on `/v1/event` as `type:'error'` under the site's `pk-` key; a
project has no DSN and no key of its own to rotate.
