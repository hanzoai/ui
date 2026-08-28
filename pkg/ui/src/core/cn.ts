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

/** First letter up, rest untouched — a label from a machine-readable name. */
export function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
}

/**
 * A variant table, as a function from a selection to its classes.
 *
 *   const chip = variants('inline-flex rounded', {
 *     variants: { tone: { warn: 'bg-amber-500', calm: 'bg-slate-500' } },
 *     defaultVariants: { tone: 'calm' },
 *   })
 *   chip({ tone: 'warn' })      // 'inline-flex rounded bg-amber-500'
 *
 * A lookup and a join. It reads exactly like `cva`, whose shape every component
 * in this estate is already written against, so adopting it is a rename — but it
 * is fifteen lines beside `cn` rather than a dependency, and one of the two
 * class-name libraries this package used to carry to do what it already did.
 */
export type Variants = Record<string, Record<string, ClassValue>>

/** The selection: for each axis, one of the keys that axis offers. */
export type Choice<V extends Variants> = { [K in keyof V]?: keyof V[K] }

/** The props a component accepts, read back off its own table. */
export type VariantProps<F> = F extends (choice?: infer C) => string
  ? Omit<NonNullable<C>, 'class' | 'className'>
  : never

export function variants<V extends Variants>(
  base?: ClassValue,
  config?: { variants?: V; defaultVariants?: Choice<V> },
) {
  const table = config?.variants ?? ({} as V)
  const fallback = config?.defaultVariants ?? ({} as Choice<V>)
  return (choice?: Choice<V> & { class?: ClassValue; className?: ClassValue }): string => {
    const picked: ClassValue[] = [base]
    for (const axis in table) {
      // An explicit `undefined` means "not chosen" and falls back, which is what
      // `<Button size={undefined}>` means at a call site.
      const key = choice?.[axis] ?? fallback[axis]
      if (key != null) picked.push(table[axis][key as string])
    }
    return cn(...picked, choice?.class, choice?.className)
  }
}
