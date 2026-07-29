/**
 * `cn` — the one class-name composer.
 *
 * `clsx` resolves conditional/array/object class inputs. There is no Tailwind
 * conflict-resolution step because there are no Tailwind utilities to resolve:
 * styling lives in gui style props and the token scale, and class names are only
 * stable handles (`hanzo-button`, `hz-mono`) a host may select on.
 */
import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs)
}
