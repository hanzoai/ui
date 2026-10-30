# @hanzo/replay

Browser session replay. rrweb records the DOM; this package decides what may leave
the device and where it goes.

```ts
const { record } = await import('@hanzo/replay')
const replay = record({ ingestKey: 'pk-…' })
// …later
replay.stop()
```

Nothing runs at module scope, so importing this package records nothing — lazy-load
it behind whatever consent or sampling gate the app already has.

## Not a replacement for `@hanzo/observe`

They answer different questions and both ship.

| | `@hanzo/observe` | `@hanzo/replay` |
|---|---|---|
| Captures | what the user **did** | what the user **saw** |
| Produces | a readable semantic hierarchy | a DOM movie |
| Endpoint | `POST /v1/event` | `POST /v1/event/replay` |

The player is rrweb-native, which is why this package is rrweb-native: raw
`eventWithTime` events go on the wire, so playback needs no translation layer.

## Privacy

An rrweb recording captures everything on screen by default. Everything below
happens **at capture time, in the browser, before any byte leaves the device** —
there is no "scrub it server-side later".

There is one redaction policy at Hanzo: `@hanzo/observe`'s `RedactionPolicy`, with
`isPrivate()` for subtree exclusion and `sensitiveKey()` for field identity. This
package does not define a second one; it translates that one onto rrweb's hooks.

**Inputs are masked by default.** Every input type is opted into masking, so the
per-field decision is always ours to make. An ordinary field keeps its length and
loses its characters; a field that is sensitive by type (`password`, `hidden`,
`email`, `tel`), sensitive by identity (`sensitiveKey()` over
name/id/autocomplete/placeholder/aria-label), or inside a private subtree loses its
length too — a 4-digit CVV must not be told apart from a 16-digit PAN by counting
stars.

**Marked subtrees are excluded.** `[data-hz-private]`, `[data-observe="off"]` and
`[data-private]` are blocked outright — rrweb replaces them with a sized
placeholder and never serializes what is inside. A custom `policy.privateAttribute`
is honored both in the selector and, when the name is not a legal CSS identifier,
at node level through `isPrivate()`.

**Password and payment fields are blocked, not masked.** `input[type=password]` and
the `cc-*` / `one-time-code` autocomplete family never reach the serializer, so
there is no value to get the masking decision wrong about.

**Content is judged on the one path where a raw value is allowed out.** With
`policy.maskInput === false` a provably-safe field records its real value — and
that value still goes through `@hanzo/event`'s `redactSecrets`, because a card
number pasted into a search box is a card number.

**Credential-bearing URLs are redacted.** rrweb's `Meta` event carries the page
`href`, and snapshots and mutations carry `<a href>`, `<img src>`, `<form action>`.
Every one of those goes through `redactSecrets`, which redacts credential query
parameters **by name** (`code`, `state`, `token`, `secret`, `api_key`, …). That is
the only signal that exists for an opaque OAuth code — it has no shape to match.

**Credential routes are never recorded at all.** `record()` refuses to start on
`/callback` and `/login/oauth/device` (matched as a whole path segment, so
`/auth/callback` counts and `/oauth-callback` does not), and stops if the app
routes onto one while recording — the event that would carry the new page is
dropped, not buffered. `hanzoai/id` refuses to emit on exactly these paths for the
same reason: a recording of an OAuth callback *is* the authorization code.

**Pixel capture is off.** `recordCanvas` and `inlineImages` stay false: a canvas is
user content in the one form no text rule can mask.

The `rrweb` escape hatch is applied *under* these options, so it can tune sampling
or plugins but cannot widen the gate.

## The wire

```
POST {endpoint}/v1/event/replay
Authorization: Bearer pk-…
Content-Type: application/json

{
  "sessionId":  "019fd31b-…",
  "windowId":   "019fd31b-…",
  "distinctId": "019fd31b-…",
  "consent":    "analytics",
  "events":     [ /* raw rrweb eventWithTime */ ]
}
```

That is the body cloud reads (`hanzo-inc/cloud` `apps/event/replay.go`): `sessionId`
1–70 ASCII letters, digits or `-` (it is the partition key), at least one event,
and `consent` the choice the batch was recorded under — cloud keeps a recording
only under Analytics. The answer is `{accepted: 1}`, or `{withheld: 1}` for a
batch recorded without the grant.

Attributed by a **publishable** `pk-` key, like every other Hanzo write. A batch
flushes when it gets long (`batchSize`, default 50), before it would pass
`maxBytes`, on the interval (`flushIntervalMs`, default 5000), and when the page
goes away (`visibilitychange` → hidden, and `pagehide`).

**A batch is at most 512 KiB, counted in UTF-8 with its envelope**, because that
is the most the ingest accepts (`MAX_BATCH_BYTES`; over it cloud answers 413).
`maxBytes` can lower it, never raise it.

**Large events go compressed, in the encoding the player reads** (`compress.ts`).
A full snapshot always, and a mutation or style rule once its JSON passes 4 KiB
(`COMPRESS_FROM`), are gzipped and carried as a latin-1 string under
`cv: "2024-10"`; type, timestamp and every other field stay as they were, so the
ingester still reads the clicks and page metadata it summarises a session from.
The insights player opens exactly these parts (`common/replay-shared`
`decompressEvent`). Measured 2026-10-30 with rrweb 2.1.1: the hanzo.ai landing's
full snapshot is 1.32 MB raw (refused before) and 314 KB on the wire; /pricing
541 KB raw and 167 KB on the wire. An event still over the bound once compressed
is reported through `onError` and dropped, and a recording without its full
snapshot does not play.

The unload flush uses `navigator.sendBeacon`, which cannot set headers, so the key
rides `?ingest_key=` on that path only — and only if it is publishable. A secret
key falls back to `fetch(keepalive)` rather than being written into a URL. Both
carry at most 64 KiB (`KEEPALIVE_BYTES`, the Fetch standard's keepalive quota); a
larger tail goes as an ordinary `fetch`, and every other flush is an ordinary
`fetch` too, since a keepalive request over the quota is refused by the browser
before it is sent.

The ids are read from the storage `@hanzo/event` already owns (`hz_session`,
`hz_anon_id`, legacy `hz_id`) and minted into those same keys when a page has none,
so a replay and its event stream land on one session and one visitor.

## API

```ts
function record(config: ReplayConfig): ReplayHandle

interface ReplayConfig {
  ingestKey: string              // publishable pk- key (required)
  endpoint?: string              // default 'https://api.hanzo.ai'
  policy?: RedactionPolicy       // @hanzo/observe's policy; default masks everything
  sessionId?: string             // default: the shared browser session
  windowId?: string              // default: this tab
  distinctId?: string            // default: the shared anonymous id
  batchSize?: number             // default 50
  maxBytes?: number              // default and ceiling 512 * 1024
  flushIntervalMs?: number       // default 5000
  blockSelector?: string         // extra app selectors, never captured
  maskTextSelector?: string      // extra app selectors, captured as asterisks
  refuse?: (pathname: string) => boolean   // extra route refusal
  rrweb?: Partial<recordOptions<eventWithTime>>  // applied UNDER the gate
  recorder?: Recorder            // bring your own rrweb
  transport?: ReplayTransport    // seam
  onError?: (err: unknown) => void
  debug?: boolean
}

interface ReplayHandle {
  readonly sessionId: string
  readonly windowId: string
  readonly distinctId: string
  readonly recording: boolean    // false once stopped, or if it refused to start
  flush(): void
  stop(): void                   // stops and flushes; idempotent
}
```

`record()` always returns a handle — on a credential route, without a key, or if
rrweb itself throws, it returns an inert one and reports through `onError`. Losing
a recording never throws into the app.

Also exported, for apps that need the pieces: `isCredentialRoute`,
`CREDENTIAL_ROUTES`, `privateSelector`, `maskInput`, `maskText`, `fieldIdentity`,
`recorderOptions`, `CREDENTIAL_SELECTOR`, `scrubEvent`, `encodeBatch`, `replayUrl`,
`publishable`, `REPLAY_PATH`, `MAX_BATCH_BYTES`, `KEEPALIVE_BYTES`,
`DEFAULT_ENDPOINT`, `sessionId`, `windowId`, `distinctId`.

## Install

`rrweb` is a peer dependency — it is large, and an app that already bundles a
player must not end up with two copies.

```sh
pnpm add @hanzo/replay rrweb
```
