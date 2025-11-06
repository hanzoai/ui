/**
 * Vue utilities
 *
 * @note Utility functions for Vue components
 */

export const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ')
}
