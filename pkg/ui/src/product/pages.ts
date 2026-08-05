/**
 * The page run — which page numbers a pager shows, and where the gaps fall.
 *
 * Four implementations across the fleet (chat, the console's observability
 * pager, and billing twice — in two spellings, in one repo), each with its own
 * rule for what happens when there are eighty pages. This is that rule, written
 * once: a fixed-width run of page numbers around the current one, with ellipses
 * standing in for what was skipped and the first and last page always reachable.
 *
 * Fixed width is the requirement. A control that grows with the page count
 * reflows the row it sits in every time you page, which is how a "next" button
 * ends up under the cursor that was pressing "previous".
 *
 * It lives here rather than in `Pagination.tsx` because it needs no DOM and no
 * gui runtime, and a consumer must be able to check the rule its pager depends
 * on without mounting one. `@hanzo/ui/product/pure` is that door.
 */

/** A gap in the run. Rendered as an ellipsis; never selectable. */
export const GAP = '…' as const

/**
 * The page numbers to show for `page` of `count`, 1-based.
 *
 * `around` is how many neighbours flank the current page (default 1 → at most
 * 7 slots: first, gap, p-1, p, p+1, gap, last). Returns every page when they
 * all fit, so a short list never grows an ellipsis it does not need.
 */
export function pages(page: number, count: number, around = 1): (number | typeof GAP)[] {
  if (count <= 0) return []
  const width = around * 2 + 5 // first + gap + run + gap + last
  if (count <= width) return Array.from({ length: count }, (_, i) => i + 1)

  const current = Math.min(Math.max(page, 1), count)
  // First and last are always present, so the middle carries `width - 2` slots
  // and each end that needs no ellipsis spends that slot on another page
  // instead. Solving for the run that way is what keeps the total constant;
  // clamping the run with Math.max/min alone lets it shrink near the edges, and
  // then the control changes width as you page.
  const middle = width - 2
  const nearStart = current <= around + 2
  const nearEnd = current >= count - around - 1

  const start = nearStart ? 2 : nearEnd ? count - middle + 1 : current - around
  const end = nearStart ? middle : nearEnd ? count - 1 : current + around

  const out: (number | typeof GAP)[] = [1]
  if (!nearStart) out.push(GAP)
  for (let p = start; p <= end; p++) out.push(p)
  if (!nearEnd) out.push(GAP)
  out.push(count)
  return out
}
