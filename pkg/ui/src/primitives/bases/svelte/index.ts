// @hanzo/ui/primitives/bases/svelte — Svelte adapter (placeholder).
//
// Status: NOT YET IMPLEMENTED. The Svelte port lives outside this
// repo today (e.g., the upstream temporal/ui SvelteKit reference at
// ~/work/temporal/ui). When a Svelte port of @hanzogui/admin is
// authored, it lands at ~/work/hanzo/gui/code/ui-admin-svelte/ (or
// equivalent) and this file re-exports it.
//
// Importing from this subpath today throws at build time so callers
// get a clear signal rather than silent missing components.

throw new Error(
  '@hanzo/ui/primitives/bases/svelte is not yet implemented. ' +
    'Use @hanzo/ui/primitives/bases/admin (Tamagui v7) or @hanzo/ui/primitives/bases/gui (hanzogui umbrella) ' +
    'until the Svelte port lands.',
)

export {}
