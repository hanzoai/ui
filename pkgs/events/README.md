# @hanzo/events

**Use [`@hanzo/event`](https://www.npmjs.com/package/@hanzo/event).** Singular.

```sh
npm i @hanzo/event
```

This package is the plural spelling. It re-exports the real one unchanged, so
code that guessed wrong keeps working — but every example, every doc and every
new import should say `@hanzo/event`.

## Why it exists

The package is singular because one call sends one event:

```ts
import { analytics, EVENTS } from '@hanzo/event'

analytics.capture(EVENTS.PROJECT_CREATED)
```

Plural is the natural guess, though, and a guess that resolves to nothing is a
dead end for whoever made it. So the name resolves here, and here points home.

## What it deliberately does not do

It defines nothing. No event names, no schemas, no client — those live in
`@hanzo/event`, and a second definition of what an event is, in a package one
letter away from the first, is how the two come to disagree.

Every signal — pageview, product event, identify, error — goes to one door,
`POST /v1/event` on api.hanzo.ai, and is lensed server-side into web analytics,
product insights and error tracking.
