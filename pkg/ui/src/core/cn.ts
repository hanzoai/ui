/**
 * `cn` — the one class-name composer.
 *
 * `clsx` resolves conditional/array/object class inputs. There is no Tailwind
 * conflict-resolution step because there are no Tailwind utilities to resolve:
 * components render on @hanzo/gui, which styles through props, not class names.
 */
import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs)
}
