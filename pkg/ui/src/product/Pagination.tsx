'use client'

/**
 * Pagination — page N of M, and the way to the others.
 *
 * Four implementations across the fleet (chat, the console's observability
 * pager, and billing twice — in two spellings, in one repo), each with its own
 * rule for what happens when there are eighty pages. `pages` is that rule,
 * written once and testable without a browser: a fixed-width run of page numbers
 * around the current one, with ellipses standing in for what was skipped and the
 * first and last page always reachable.
 *
 * Fixed width is the requirement. A control that grows with the page count
 * reflows the row it sits in every time you page, which is how a "next" button
 * ends up under the cursor that was pressing "previous".
 */
import { Button, Text, XStack } from '@hanzo/gui'
import { ChevronLeft, ChevronRight } from '@hanzogui/lucide-icons-2'

import { useEmit } from './instrument'

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

export type PaginationProps = {
  /** Current page, 1-based. */
  page: number
  /** Total pages. 1 or 0 renders nothing — there is nowhere to go. */
  count: number
  onChange: (page: number) => void
  /** Neighbours flanking the current page. Default 1. */
  around?: number
}

export function Pagination({ page, count, onChange, around = 1 }: PaginationProps) {
  const track = useEmit()
  if (count <= 1) return null

  const go = (to: number) => {
    if (to === page || to < 1 || to > count) return
    track({ component: 'Pagination', action: 'select', value: to })
    onChange(to)
  }

  return (
    <XStack items="center" justify="center" gap="$1" flexWrap="wrap">
      <Button
        size="$2"
        chromeless
        icon={<ChevronLeft size={15} />}
        onPress={() => go(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      />
      {pages(page, count, around).map((slot, i) =>
        slot === GAP ? (
          <Text key={`gap-${i}`} px="$1.5" fontSize="$2" color="$color10" aria-hidden>
            {GAP}
          </Text>
        ) : (
          <Button
            key={slot}
            size="$2"
            chromeless={slot !== page}
            onPress={() => go(slot)}
            aria-label={`Page ${slot}`}
            aria-current={slot === page ? 'page' : undefined}
            bg={slot === page ? '$color4' : undefined}
          >
            {String(slot)}
          </Button>
        ),
      )}
      <Button
        size="$2"
        chromeless
        icon={<ChevronRight size={15} />}
        onPress={() => go(page + 1)}
        disabled={page >= count}
        aria-label="Next page"
      />
    </XStack>
  )
}
