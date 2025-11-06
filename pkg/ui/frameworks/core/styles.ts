/**
 * Core framework styles
 *
 * @note These are minimal shared styles. Most styling is handled via
 * Tailwind CSS classes in component implementations.
 */

export const baseStyles = {
  button: 'inline-flex items-center justify-center',
  input: 'flex w-full rounded-md border',
  card: 'rounded-lg border bg-card text-card-foreground shadow-sm'
} as const
