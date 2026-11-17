# @hanzo/crm

Hanzo CRM: the org's people, companies, sales pipeline, fundraising, tasks, lists,
candidates and sequences, kept in the org's own Base (hanzoai/base module `crm`).

It is one CRM drawn by every app that has one:

- Hanzo Cloud's console, at `console.<brand>/crm`, and as Hanzo CRM on `crm.<brand>`
- Hanzo Team, at `hanzo.team/crm`

Every app reads and writes the same records, because the records are the org's
Base and nothing else. What differs between apps is only what each one knows about
itself, and the app supplies that through `configureCrm`.

## Use

```tsx
import { configureCrm, CrmModule } from '@hanzo/crm'

configureCrm({
  // Plain-JSON REST over the signed-in account's credential, in the org.
  // A refusal rejects with an Error carrying the HTTP `status` (and `body`).
  v1Url: (path) => `https://api.hanzo.ai/v1/${path}`,
  get: (url) => rest('GET', url),
  post: (url, body) => rest('POST', url, body),
  del: (url) => rest('DELETE', url),
  // The org's Base (/v1/base), signed the same way.
  base: () => myBaseClient,
  org: () => currentOrg,
  leaveOrg: () => switchToOwnOrg(),
  brand: () => ({ brandName: 'Hanzo', websiteUrl: 'https://hanzo.ai' }),
  // True on the crm face: the org's `crm` enablement is read first, and an org
  // without it is shown how to join the beta.
  gated: false,
  // React hooks over the app's own session, router and address.
  useSession: () => ({ account, signOut }),
  useRouter: () => ({ push, replace }),
  useSearchParams: () => searchParams,
})

// Where the CRM goes: /crm/:tab and /crm/:tab/:id.
<CrmModule params={{ tab, id }} />
```

`OBJECTS` and `TABS` list the objects in order, for an app's own navigation, and
`objectOf` / `movedView` say where an older address lands.

The CRM writes console-style addresses (`/crm`, `/crm/companies`,
`/crm/deals/<id>`, `?view=`). An app whose CRM lives somewhere else maps them in its
`useRouter`.

## Requests

| What | Route |
| --- | --- |
| Records, schemas | `GET/POST/PATCH/DELETE /v1/base/collections/:name[/records[/:id]]` (through `base`) |
| Grow the org's CRM | `POST /v1/base/modules/crm` |
| The beta | `GET /v1/entitlement/orgs/:org` |
| Mail | `POST /v1/email`, `POST /v1/email/verify`, `POST /v1/marketing/mail` |
| Sequences | `/v1/marketing/sequences[/:id[/steps,/status,/enroll,/enrollments]]` |
| Audiences, suppressions | `/v1/marketing/audiences`, `/v1/marketing/suppressions[/check]` |

## Develop

```sh
pnpm --filter @hanzo/crm typecheck
pnpm --filter @hanzo/crm test
pnpm --filter @hanzo/crm build
```

The suites are the CRM's logic in plain Node (Base field and value mapping, view
queries, CSV and import plans, the objects and their views, mail and suppression
reads over a host's REST).
