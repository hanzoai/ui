// Types for anon.js, which is hand-written ES5 rather than TypeScript because
// hz.js and the door's hosted tag inline it VERBATIM and neither has a compiler.
// The declarations are here so the bundled client still imports it typed.

/** Mints a time-ordered UUIDv7 (RFC 9562 §5.7) for `now` in epoch milliseconds. */
export declare function hzUuidv7(now?: number): string

/**
 * The stable anonymous id for this browser, or '' during SSR.
 *
 * cookie · localStorage `hz_anon_id` · localStorage `hz_id` · in-memory · mint —
 * every existing id is adopted, and only a browser holding none is given a new one.
 */
export declare function hzAnonId(): string
