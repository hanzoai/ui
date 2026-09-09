// @hanzo/observe-svelte — the Svelte adaptor for @hanzo/observe.
//
//   // +layout.svelte
//   import { createAnalytics } from '@hanzo/event'
//   import { createObserver } from '@hanzo/observe-svelte'
//   import { onMount } from 'svelte'
//   onMount(() => createObserver(createAnalytics({ product: 'app' })))
//
//   // any component
//   <section use:observe={{ name: 'UserCard' }}>…</section>
//
//   // a playback timeline
//   import { stream } from '@hanzo/observe-svelte'
//   const events = stream({ limit: 200 })
//   {#each $events as e}<li>{e.name} → {e.semantic.label}</li>{/each}

export { createObserver, stopObserver, activeObserver } from './observer'
export type { SvelteObserveOptions } from './observer'
export { observe } from './action'
export type { ObserveAction, ObserveParams } from './action'
export { stream } from './store'
export type { InteractionStore } from './store'
export type { Interaction, RedactionPolicy, Semantic, SemanticNode } from '@hanzo/observe'
