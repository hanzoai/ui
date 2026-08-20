// The library version, stamped on every event (`libraryVersion`) and on the
// Sentry `sdk` block. It lives alone so `sentry.ts` can read it without importing
// `core.ts` — core imports sentry, so the reverse would be an import cycle.
export const VERSION = '0.3.30'
