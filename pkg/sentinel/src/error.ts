/**
 * SentinelError is what a non-2xx answer becomes.
 *
 * A refusal arrives in one of two spellings. The face answers JSON —
 * `{"status":403,"code":"forbidden","error":"no validated principal"}` — and the
 * edge in front of it answers plain text, `404 page not found`. Both land here
 * as a throw, so a caller never receives `undefined` and reads it as an empty
 * answer.
 */
export class SentinelError extends Error {
  /** status is the HTTP status of the refusal. */
  readonly status: number
  /** code is the face's own word for the refusal — `forbidden`, `not_found` —
   *  or empty when the refusal did not carry one. Branch on this, not on the
   *  message. */
  readonly code: string
  /** body is what came back, parsed when it was JSON and the raw text when it
   *  was not. */
  readonly body: unknown

  constructor(status: number, code: string, message: string, body: unknown) {
    super(message)
    this.name = 'SentinelError'
    this.status = status
    this.code = code
    this.body = body
    // A consumer build that downlevels to ES5 loses the prototype chain of a
    // subclassed Error, and `instanceof SentinelError` silently goes false.
    Object.setPrototypeOf(this, SentinelError.prototype)
  }
}
