/**
 * `cn` — the one class-name composer.
 *
 * `clsx` resolves conditional/array/object class inputs; `tailwind-merge` then
 * collapses conflicting Tailwind utilities so the LAST wins (e.g. a caller's
 * `bg-background` overrides a component's default `bg-popover`). Every component
 * in every backend that emits Tailwind classes merges through this single
 * function — one way, everywhere.
 */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
