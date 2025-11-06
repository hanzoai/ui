/**
 * Svelte utilities
 *
 * @note Utility functions for Svelte components
 */

export const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ')
}
