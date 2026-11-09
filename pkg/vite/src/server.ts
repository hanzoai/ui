/**
 * Loaded first by the server halves. Node 25 defines a `localStorage` global
 * whose methods are missing unless it runs with --localstorage-file, so a
 * library that asks `typeof localStorage` before `typeof window` (next-themes
 * among them) calls a method that is not there while a page renders. Rendering
 * is not a browser; the global goes.
 */
if (typeof window === 'undefined' && 'localStorage' in globalThis) {
  delete (globalThis as { localStorage?: unknown }).localStorage
}

export {}
