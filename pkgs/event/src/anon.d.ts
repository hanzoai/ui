// Types for anon.js, which is hand-written ES5 rather than TypeScript because
// The door's hosted tag inlines it VERBATIM and has no compiler.
// The declarations are here so the bundled client still imports it typed.

/** Mints a time-ordered UUIDv7 (RFC 9562 §5.7) for `now` in epoch milliseconds. */
export declare function hzUuidv7(now?: number): string

/**
 * The stable anonymous id for this browser, or '' during SSR.
 *
 * cookie · localStorage `iam-anon-id` · adopted keys · in-memory · mint —
 * every existing id is adopted, and only a browser holding none is given a new one.
 */
export declare function hzAnonId(): string
