/**
 * Substitute a CSS value's `var()` references — the step jsdom does not take.
 *
 * The theme rungs read a token and carry the literal behind it:
 *
 *     borderColor: 'var(--border, rgb(255 255 255 / .10))'
 *
 * A browser resolves that: `--border` if a stylesheet declares it, the literal
 * otherwise. jsdom resolves nothing — `getComputedStyle(el).borderColor` hands
 * back the `var(...)` text verbatim — so every consumer that tried to assert the
 * contrast of a border in a unit test compared a colour to a function call and
 * either asserted the wrong thing or gave up and asserted nothing.
 *
 * Neither half of that is worth fixing by weakening the rung. The `var()` first
 * is what lets a host that mounts @hanzo/design's sheet follow the live cascade
 * and invert with it; the literal behind it is what keeps a host that mounts
 * neither on the value the WCAG audit measured. So the value stays, and the TEST
 * gets the resolver:
 *
 *     import { substitute } from '@hanzo/ui/css'
 *
 *     const border = substitute(getComputedStyle(el).borderColor)
 *     expect(contrast(border, bg)).toBeGreaterThan(3)
 *
 * With no `vars` map that is exactly right, and not an approximation: jsdom
 * mounts no design stylesheet, so nothing declares `--border`, so the fallback
 * IS the value a browser would compute under the same conditions. Pass a map to
 * model a host that declares its own tokens.
 *
 * Pure, dependency-free and DOM-free, so it loads under any runner — which is
 * why it is `@hanzo/ui/css` and not part of `@hanzo/ui/core`. That subpath is
 * ESM-only on purpose (@hanzo/design, which its tokens come from, publishes no
 * `require` condition), and a jest consumer is exactly the caller that needs
 * this one. Importing nothing is what lets it ship both.
 */

/** A value that references a custom property nothing declares is invalid at
 *  computed-value time: CSS drops the WHOLE declaration, not just the `var()`.
 *  Carried as a sentinel so the outer call can return '' for the whole value. */
const INVALID = Symbol('invalid')

/** Index of the `)` closing the `(` at `open`, or -1 if unbalanced. */
function close(value: string, open: number): number {
  let depth = 0
  for (let i = open; i < value.length; i++) {
    if (value[i] === '(') depth++
    else if (value[i] === ')' && --depth === 0) return i
  }
  return -1
}

/** Index of the first comma at depth 0, or -1. `var()` takes at most one
 *  fallback and the fallback may itself contain commas — `rgb(255 255 255 / .1)`
 *  does not, but `var(--a, var(--b, red))` does — so only the FIRST counts. */
function comma(inner: string): number {
  let depth = 0
  for (let i = 0; i < inner.length; i++) {
    if (inner[i] === '(') depth++
    else if (inner[i] === ')') depth--
    else if (inner[i] === ',' && depth === 0) return i
  }
  return -1
}

function expand(value: string, vars: Record<string, string>, seen: Set<string>): string | typeof INVALID {
  const start = value.indexOf('var(')
  if (start === -1) return value

  const end = close(value, start + 3)
  if (end === -1) return value // unbalanced — not a value we can reason about

  const inner = value.slice(start + 4, end)
  const split = comma(inner)
  const name = (split === -1 ? inner : inner.slice(0, split)).trim()
  const fallback = split === -1 ? undefined : inner.slice(split + 1).trim()

  let resolved: string | typeof INVALID
  if (seen.has(name)) {
    // A cycle (`--a: var(--b)`, `--b: var(--a)`) is invalid at computed-value
    // time too, and left unguarded it is an infinite recursion.
    resolved = INVALID
  } else if (name in vars) {
    resolved = expand(vars[name] as string, vars, new Set(seen).add(name))
  } else if (fallback !== undefined) {
    resolved = expand(fallback, vars, seen)
  } else {
    resolved = INVALID
  }
  if (resolved === INVALID) return INVALID

  const rest = expand(value.slice(end + 1), vars, seen)
  if (rest === INVALID) return INVALID

  return value.slice(0, start) + resolved + rest
}

/**
 * `value` with every `var()` reference replaced by what it resolves to.
 *
 * `vars` maps custom-property names (with the leading `--`) to their declared
 * values and defaults to none, which is the jsdom case. Returns '' when the
 * value references something undeclared with no fallback, or references itself
 * — both are invalid at computed-value time, and a browser drops the whole
 * declaration rather than part of it.
 */
export function substitute(value: string, vars: Record<string, string> = {}): string {
  const out = expand(value, vars, new Set())
  return out === INVALID ? '' : out
}
