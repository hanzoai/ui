# @hanzo/events

The canonical Hanzo event schema: **which events exist, what each one means, and
what it carries.**

```ts
import { EVENTS, SCHEMA, isKnown, specFor } from '@hanzo/events'

SCHEMA['first_action']
// { summary: 'Activation: the first moment of real value…',
//   props: { action: { type:'string', values:['api_call','app_live','chat_reply'] } } }

isKnown('deploy_succeeded')  // true
isKnown('deploy_static_ok')  // false — flagged on ingest, not refused
```

To **send** an event, use [`@hanzo/event`](https://www.npmjs.com/package/@hanzo/event).
Plural is the catalog, singular is the client: many events are defined here, one
event is sent by a call there. The client depends on this package and re-exports
`EVENTS`, so either import works and there is still one definition.

## The rules this file keeps

**A dimension is a property, never part of the name.** `deploy_succeeded` with
`{framework:'static'}`, never `deploy_static_succeeded`. That is what makes a
funnel line up across console, chat, app, site and admin — and it is the reason
a catalog like this can exist at all.

**A property is listed only where there is evidence for it** — a docstring in
the vocabulary or a live `capture()` call in a surface. An invented property is
worse than an absent one: it teaches a wrong shape to the next reader and to
anything trained on the corpus.

**Every event is open.** `props` is what an event is known to carry, never the
exhaustive set. A property absent here is undocumented, not forbidden.

## For readers that are not TypeScript

`catalog.json` ships in the package — the same catalog as data. The ingest
endpoint is Go and cannot import TypeScript, so it reads that. One source, two readers.

```
@hanzo/events/catalog.json
  { version, names[], reserved[], schema{} }
```

## Unknown events are recorded, not refused

The ingest endpoint records an event whose name is not in this catalog and flags
it.
Refusing would mean a surface that ships a new event before the catalog does
loses the data outright — and the data is the part you cannot recover. A flag
you can act on later.
