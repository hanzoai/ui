/**
 * `cn` — the one class-name composer, and the one flattener behind it.
 *
 * There is no Tailwind conflict-resolution step, because there are no Tailwind
 * utilities left to resolve: styling lives in gui style props and the token
 * scale, and a class name here is only a stable handle (`btn`, `hz-prose`) that
 * a host may select on.
 *
 * `flatten` lives here rather than in tw.ts because BOTH need it and there can
 * only be one of it. It was two — this called out to clsx while `tw` carried
 * its own copy of the same five lines, so the package depended on a library to
 * do a thing it was already doing beside it. One implementation, no dependency.
 */

/**
 * The shapes a caller may write a class list in.
 *
 * `bigint` and the full `boolean` are here because `cond && 'name'` is the
 * commonest form at a call site, and TypeScript infers the falsy half of that
 * as whatever the condition narrowed to — `0n` and `true` included. Narrowing
 * this to `false` alone rejects working code at the places it is written.
 */
export type ClassValue =
  | string | number | bigint | boolean | null | undefined
  | ClassValue[]
  | Record<string, unknown>

/**
 * Every class in the input, in order, as individual tokens.
 *
 * A record contributes the keys whose values are truthy — the conditional form
 * (`{ active: isActive }`) that every call site in this estate already writes.
 */
export function flatten(v: ClassValue, out: string[] = []): string[] {
  if (!v) return out
  if (typeof v === 'string') { for (const s of v.split(/\s+/)) if (s) out.push(s); return out }
  // A number is a legal class name; a boolean is not. `true` reaching here is
  // the truthy half of `cond && 'name'` in a position that produced no name,
  // and it must contribute nothing rather than the word "true".
  if (typeof v === 'boolean') return out
  if (typeof v === 'number' || typeof v === 'bigint') { out.push(String(v)); return out }
  if (Array.isArray(v)) { for (const x of v) flatten(x, out); return out }
  for (const k in v) if ((v as Record<string, unknown>)[k]) out.push(k)
  return out
}

export function cn(...inputs: ClassValue[]): string {
  return flatten(inputs).join(' ')
}
