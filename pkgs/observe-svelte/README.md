# @hanzo/observe-svelte

Svelte adaptor for [`@hanzo/observe`](../observe). Same engine, same semantic
capture, same ONE front door (`POST /v1/event` via [`@hanzo/event`](../event)) —
bound to Svelte idioms: a bootstrap, an action, and a store.

## Bootstrap

Start capture once, in a root layout, with a `@hanzo/event` client:

```svelte
<!-- +layout.svelte -->
<script>
  import { onMount } from 'svelte'
  import { createAnalytics } from '@hanzo/event'
  import { createObserver } from '@hanzo/observe-svelte'

  onMount(() => createObserver(createAnalytics({ product: 'app' })))
</script>

<slot />
```

Every click, input, navigation, and (opt-in) visibility across the app is now
captured, annotated with its semantic hierarchy, and emitted through the client.
`createObserver` is idempotent and SSR-safe.

## The `observe` action

Svelte components have no stable runtime name, so stamp one — the engine then
labels every interaction inside the node with it:

```svelte
<script>
  import { observe } from '@hanzo/observe-svelte'
</script>

<section use:observe={{ name: 'UserCard' }}>
  <button>Save</button>   <!-- captured as UserCard/button[Save] -->
</section>

<div use:observe={{ private: true }}>…</div>   <!-- excluded from capture -->
<div use:observe={{ view: true }}>…</div>       <!-- $view when it scrolls in -->
```

## Session playback

`stream` is a Svelte-readable store over the live capture stream — a rolling
window for a playback timeline:

```svelte
<script>
  import { stream } from '@hanzo/observe-svelte'
  const events = stream({ limit: 200 })
</script>

<ol>
  {#each $events as e}
    <li>{e.name} → {e.semantic.label}</li>
  {/each}
</ol>
```

## Privacy

Inherited from `@hanzo/observe`: input values are withheld by default, sensitive
fields are always redacted, and `data-hz-private` (or `use:observe={{ private:
true }}`) excludes a subtree. Everything is fail-soft.

## License

MIT © Hanzo AI — see [LICENSE.md](../../LICENSE.md). HIP-0137 (`hanzoai/hips`).
