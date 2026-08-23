# Hanzo product analytics — the taxonomy

The canonical event vocabulary, property rules, identity semantics, and funnels
for **hanzo.ai**, **hanzo.app**, and **hanzo.chat**. One definition, three
surfaces.

## Why this document lives here

The taxonomy is **code**, not prose: `src/events.ts` (`EVENTS`), `src/funnels.ts`
(`FUNNELS`, `PRODUCTS`), `src/goals.ts` (`GOALS`, `COHORTS`). All three apps
already `import { EVENTS } from '@hanzo/event'`, so this package is the only
place a definition can live and be *used* rather than merely described.

It is deliberately **not** in `hanzo/insights`. Insights is the read lens — it
renders whatever arrives. A funnel defined there could name an event no surface
emits and nobody would find out; a funnel defined next to `EVENTS` cannot, because
`funnels.test.ts` fails the build. Docs that sit apart from the constants they
describe drift within a release. These do not.

```
@hanzo/event ── EVENTS ──┬── hanzo.ai   (product: 'site')
                FUNNELS  ├── hanzo.app  (product: 'app')
                GOALS    ├── hanzo.chat (product: 'chat')
                         └── insights.hanzo.ai  (reads; never defines)
```

---

## 1. The rules

### Naming

| Rule | Yes | No |
|---|---|---|
| `snake_case`, `<object>_<verb-past>` | `deploy_succeeded` | `DeploySuccess`, `deploy-ok` |
| Names are constants, never interpolated | `deploy_succeeded` + `{framework:'static'}` | `deploy_static_succeeded` |
| Dimensions are properties | `plan_clicked` + `{plan:'pro'}` | `pro_plan_clicked` |
| No product prefix — `product` is already on the wire | `chat_started` | `chat_app_chat_started` |
| `$` is reserved for the client | `$pageview` (emitted by `pageview()`) | any app-authored `$name` |
| One name per user-visible moment, shared by all surfaces | `signup_completed` everywhere | `signup_done` / `registered` |

Enforced by `funnels.test.ts` (`event vocabulary` block). Adding a name means
adding it to `EVENTS` — a raw string in `capture()` is a bug, and the string will
be invisible to every funnel.

### Properties

Every event already carries, with no app code: `messageId`, `type`, `timestamp`,
`distinctId`, `anonymousId`, `personId`, `sessionId`, `product`, `referrer`,
`utm.*`, `channel`, `refCode`, `signupWeek`, `library`, `libraryVersion`. **Never
re-send these** as properties.

App-supplied properties:

- **Low cardinality, enumerated.** `mode`, `framework`, `plan`, `source`,
  `endpoint`, `model`, `provider`, `status`, `reason`. A property whose value
  space is unbounded is a log line, not a dimension.
- **Never user content.** No prompt, message, project name, file path, URL,
  email, or org display name. The client is PII-free by construction; keep it so.
- **Booleans read as predicates**: `hasPrompt`, `hasImages`, `isUpdate`.
- **Durations are `durationMs`** (number, milliseconds). Outcome events own their
  duration, which is why there is no paired `*_started` for generations.
- **Money never goes in properties** — use the commerce fields on `capture()`:
  `capture(EVENTS.ORDER_COMPLETED, { kind: 'plan' }, { productId, revenue, currency, quantity })`.
- **Errors are events.** `captureError(err, { properties: { where: 'publish' } })`
  puts the exception in the sentry lens *on the same stream*, so a funnel drop
  joins to the exception that caused it. Always pass `where`.

### Identity — `identify` and `group`

Exactly one place per app, mounted where the session resolves. Never at a call
site.

```tsx
analytics.identify(user.id)   // the stable IAM subject (OIDC `sub`). NEVER email.
analytics.group(orgId)        // the org
```

- **`identify`** joins a person's pre- and post-login events, and joins them
  across surfaces (the same subject arrives from Cloud server-side). Traits, if
  any, must be non-PII (`plan`, `role`).
- **`group`** is what makes org-level questions answerable — *"which orgs stalled
  before their first deploy?"* Cloud already resolves the tenant server-side for
  billing and stamps it; `group()` is the analytics dimension, and without it no
  B2B funnel exists. It was missing everywhere before this revision.
- **`setCohort({ signupWeek })`** is stamped once, at account birth, so every
  later event carries the acquisition week and retention curves are free.
- **Never** send email, name, or phone. Not as a trait, not as a property.

### Cross-origin identity — the honest limit

hanzo.ai, hanzo.app, and hanzo.chat are **different origins**. A logged-out
visitor therefore has a **different `anonymousId` on each**; nothing joins them.
Only `personId` (post-login) spans surfaces.

So a funnel that crosses origins while logged out is declared
`join: 'aggregate'` in `FUNNELS` and read as step-over-step **counts**, never as
a per-person conversion rate. The join key is an explicit property: the hanzo.ai
composer appends `?hz_ref=site`, and hanzo.chat stamps `referrerProduct:'site'`
on its own `chat_started`. Measurable, without cross-domain tracking.

---

## 2. The funnels

Machine-readable in `src/funnels.ts`; `GOALS` reference them by id.

### hanzo.ai — land → signup → activation

```
$pageview ──▶ signup_viewed ──▶ signup_submitted ──▶ signup_completed ──▶ first_action
   (land)      (/signup)        (redirect to IAM)     (/auth/callback)     {action:'api_call'}
```

`FUNNELS.signup` + `FUNNELS.apiActivation`. IAM hosts the form, so `submitted` is
the redirect *into* IAM and `completed` is the return. `first_action{action:
'api_call'}` is emitted **server-side by Cloud** on an org's first successful
`/v1` request — a browser cannot observe it, and this is the only step that
proves the account was worth acquiring.

Secondary: `FUNNELS.upgrade` (`pricing_viewed → plan_clicked → checkout_started →
order_completed`) and `FUNNELS.siteToChat` (the composer handoff, aggregate).

### hanzo.app — describe → build → ship

```
$pageview ──▶ build_started ──▶ generation_completed ──▶ deploy_started ──▶ deploy_succeeded
   (land)      (composer)         (working build)          (publish)          (live URL)
```

`FUNNELS.appShip`. The product thesis in five steps. `deploy_succeeded` fires
only when a live URL is in hand — never inferred from "started and no error".
The first one also emits `first_action{action:'app_live'}`.

### hanzo.chat — visit → first message → answer

```
$pageview ──▶ chat_started ──▶ chat_message_sent ──▶ generation_completed
   (land)      (new convo)       (per message)          (answer, durationMs)
```

`FUNNELS.chatEngage`. `chat_started` carries `referrerProduct` when the visitor
came from the hanzo.ai composer. `model_switched` is the quality signal that
sits *beside* the funnel: a switch mid-conversation usually follows a bad answer,
and `fromModel`/`model` is what makes "which model gets abandoned" answerable.
Return/retention is a cohort question (`signupWeek` × `$pageview`), not an event.

---

## 3. Emit sites — what exists, what is missing

Verified against the trees at the time of writing. ✅ = emitting, ❌ = not emitted.

### hanzo.ai (`~/work/hanzo/hanzo.ai`, `product: 'site'`)

| Event | Where | State |
|---|---|---|
| `$pageview` | `app/providers.tsx` (`AnalyticsProvider` + `usePageview`) | ✅ |
| `identify` / `group` | `app/providers.tsx:72,75` (`Identity`) | ✅ **added** |
| `signup_viewed` | `app/(marketing)/signup/page.tsx:19` | ✅ |
| `referral_used` | `app/(marketing)/signup/page.tsx:21` | ✅ |
| `signup_submitted` | `app/(marketing)/signup/page.tsx:24` | ✅ |
| `signup_completed` | `app/(marketing)/auth/callback/page.tsx:39` | ✅ **added** |
| `login_completed` | `app/(marketing)/auth/callback/page.tsx:41` | ✅ **added** |
| `setCohort({signupWeek})` | `app/(marketing)/auth/callback/page.tsx:38` | ✅ **added** |
| auth-exchange failure | `app/(marketing)/auth/callback/page.tsx:49` | ✅ **added** |
| `chat_started` | `components/home/ChatHero.tsx:58,66`, `components/home/LandingNav.tsx:90` | ✅ |
| `feature_used` | `components/home/ChatHero.tsx:63` | ✅ |
| `pricing_viewed` | `app/(marketing)/pricing/page.tsx:34` | ✅ |
| `plan_clicked` | `components/pricing/PricingPlan.tsx:43` | ✅ |
| `waitlist_joined` / `_shared` | `app/(marketing)/research-access/page.tsx:95`, `components/referrals/ReferralLink.tsx:27,47` | ✅ |
| `referral_claimed` | `components/referrals/TryFreeCoupon.tsx:32` | ✅ |
| `checkout_started` | `app/(marketing)/account/billing-plans/page.tsx:90` (`checkout(planId)`) | ❌ **missing** |
| `order_completed` | — (server-side; commerce owns the truth) | ❌ **missing** |
| `api_key_created` | — (no key UI on this site; console.hanzo.ai owns it) | ❌ n/a here |
| `first_action{action:'api_call'}` | — (Cloud, on first successful `/v1` request) | ❌ **missing — server-side** |

### hanzo.app (`~/work/hanzo/app`, `product: 'app'`)

| Event | Where | State |
|---|---|---|
| `$pageview`, errors | `components/providers/analytics.tsx` (`AnalyticsRoot`) | ✅ |
| `identify` | `components/providers/analytics.tsx:47` | ✅ |
| `group` | `components/providers/analytics.tsx:55` | ✅ **added** |
| `build_started` | `components/build-composer/index.tsx:173` | ✅ **fixed** (was `app_created` — intent mislabelled as creation) |
| `chat_message_sent` | `components/chat-panel/index.tsx:242` | ✅ |
| `generation_completed` | `components/workspace/index.tsx:1051` | ✅ **added** |
| `generation_failed` | `components/workspace/index.tsx:1065,1092` | ✅ **added** |
| `project_created` | `components/project-manager/index.tsx:299` | ✅ |
| `deploy_started` | `components/editor/deploy-button/content.tsx:61` | ✅ |
| `deploy_succeeded` | `components/editor/deploy-button/content.tsx:156` | ✅ **added** |
| `first_action{action:'app_live'}` | `components/editor/deploy-button/content.tsx:164` | ✅ **added** |
| `deploy_failed` | `components/editor/deploy-button/content.tsx:95,183` | ✅ **added** |
| `pricing_viewed` / `plan_clicked` | `app/pricing/page.tsx:87,99` | ✅ |
| `signup_viewed` / `_submitted` | `app/signup/page.tsx:26,30` | ✅ |
| `signup_completed` | — (this app has no IAM callback route of its own) | ❌ **missing** |

### hanzo.chat (`~/work/hanzo/chat`, `product: 'chat'`)

| Event | Where | State |
|---|---|---|
| `$pageview` | `client/src/Providers/AnalyticsProvider.tsx` | ✅ |
| `identify` | `client/src/Providers/AnalyticsProvider.tsx` (`AnalyticsBridge`) | ✅ |
| `chat_started` (+ `referrerProduct`) | `client/src/hooks/Chat/useChatFunctions.ts:138` | ✅ **enriched** |
| `chat_message_sent` | `client/src/hooks/Chat/useChatFunctions.ts:144` | ✅ |
| `generation_completed` | `client/src/hooks/SSE/useSSE.ts:138` | ✅ **added** |
| `generation_failed` | `client/src/hooks/SSE/useSSE.ts:251` | ✅ **added** |
| `model_switched` | `client/src/components/Chat/Menus/Endpoints/ModelSelectorContext.tsx:233` | ✅ **added** |
| `group` | — (no org concept in the chat session today) | ❌ **missing** |
| `signup_completed` | — (IAM session-bridge, no callback route here) | ❌ **missing** |

---

## 4. Known gaps — ranked

1. **hanzo.app runs a second, parallel telemetry pipe.** `lib/telemetry/`
   (`config.ts`, `tracker.ts`, `events.ts`) POSTs its own vocabulary
   (`task_started`, `task_complete`, `task_fail`, `model_selected`, `pageview`,
   `heartbeat`) with its own visitor id and its own batching to
   `https://console.hanzo.ai/api/public/otel/v1/traces`. That is a **frontend
   host**, with an **`/api/` prefix**, and a vocabulary disjoint from this one —
   so nothing in that stream can be joined to a funnel in this one. Both fire
   today at `components/workspace/index.tsx` (`track('task_complete')` beside
   `capture(GENERATION_COMPLETED)`).
   *Fix:* reduce `lib/telemetry`'s `track()` to a thin adapter over the shared
   `@hanzo/event` client (name-map `task_complete → generation_completed`,
   `model_selected → model_switched`), delete `tracker.ts` + `config.ts`, and the
   duplicate queue/retry/heartbeat/visitor-id machinery goes with it.
2. **`first_action` is emitted by nobody on the API path.** Activation — the one
   metric that matters — needs Cloud to emit `first_action{action:'api_call'}`
   on an org's first successful `/v1` request. `FUNNELS.apiActivation` is
   specified and unmeasurable until it does. `hanzo.app` now covers its own
   variant (`action:'app_live'`).
3. **`checkout_started` / `order_completed` are unwired.** `hanzo.ai`'s
   `account/billing-plans/page.tsx:90` calls `checkout(planId)` and captures
   nothing, so `GOALS.sale` has no data and `FUNNELS.upgrade` truncates at
   `plan_clicked`.
4. **No org on hanzo.chat.** `group()` is absent because the chat session carries
   no org today; chat funnels are person-scoped only.
5. **Logged-out reach depends on a publishable key.** Anonymous events need
   `ingestKey` (`pk_…`, write-only) or they fail closed at the edge.
   `NEXT_PUBLIC_HANZO_INGEST_KEY` (hanzo.ai), `NEXT_PUBLIC_PUBLISHABLE_KEY`
   (hanzo.app), `VITE_HANZO_INGEST_KEY` (hanzo.chat) are read but must be
   provisioned per org via `POST /v1/ingest/keys`. Config, not code.

---

## 5. Adding an event

1. Add the constant to `EVENTS` in `src/events.ts` — with a comment saying which
   decision it informs. If you cannot name one, do not add it.
2. If it is a funnel step, add it to the funnel in `src/funnels.ts`. If it is a
   conversion, point a `GOALS` entry at that funnel id.
3. `pnpm test` — the drift guard will reject a step whose event does not exist.
4. Emit it from **one** place per app, with enumerated properties only.
5. Bump the patch version; the `hanzoai/ui` publish workflow ships it on merge to
   `main`, and apps pick it up on their next install.
