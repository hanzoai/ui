/**
 * Local `cn` handle for the shadcn backend.
 *
 * Every component in this backend merges classes through the ONE composer in the
 * shared core; re-exporting it here keeps each component's import local
 * (`./utils`) and the merge logic single-sourced.
 */
export { cn } from '../../core/cn'
