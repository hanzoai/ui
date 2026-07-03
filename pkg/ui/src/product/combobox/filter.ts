/**
 * Combobox option filtering — pure, unit-tested.
 *
 * The ONE matcher the ComboBox uses to narrow a live option list against typed
 * text. Matching is a LITERAL, case-insensitive substring over the option's
 * value + label + hint — NEVER a compiled RegExp of user input (that would be a
 * ReDoS / injection surface; the whole codebase filters with literal `includes`,
 * e.g. marketplace/logic + filterOrgs). Kept dependency-free so it lifts into
 * `@hanzo/ui` alongside the ComboBox.
 */

/** One option in a combobox list. `value` is what gets committed; label/hint are display. */
export type ComboOption = {
  /** The value committed to the field when this option is chosen. */
  value: string
  /** Display label (defaults to `value`). */
  label?: string
  /** Optional secondary text (e.g. a provider, a description) — also searched. */
  hint?: string
}

/** The searchable haystack for one option (value + label + hint), lowercased. */
const hay = (o: ComboOption): string => `${o.value} ${o.label ?? ''} ${o.hint ?? ''}`.toLowerCase()

/**
 * Filter `options` by `query` — a literal, case-insensitive substring over
 * value/label/hint. An empty/whitespace query returns every option (no filter).
 * PURE. The input is treated as a plain string, never a pattern.
 */
export function filterOptions(options: ComboOption[], query: string): ComboOption[] {
  const q = query.trim().toLowerCase()
  if (!q) return options
  return options.filter((o) => hay(o).includes(q))
}

/** True iff `value` exactly matches an option's `value` (case-sensitive). */
export function isKnownOption(options: ComboOption[], value: string): boolean {
  return options.some((o) => o.value === value)
}
