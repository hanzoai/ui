'use client'

/**
 * Pagination — page N of M, and the way to the others.
 *
 * The RULE it pages by — a fixed-width run of page numbers with ellipses
 * standing in for what was skipped — is `pages`, and it lives in `./pages`
 * because it needs no browser. Re-exported here so the product barrel still
 * carries it; `@hanzo/ui/product/pure` is the door that costs no gui runtime.
 */
import { Button, Text, XStack } from '@hanzo/gui'
import { ChevronLeft, ChevronRight } from '@hanzogui/lucide-icons-2'

import { useEmit } from './instrument'
import { GAP, pages } from './pages'

export { GAP, pages }

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
        icon={<ChevronLeft size={16} />}
        onPress={() => go(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      />
      {pages(page, count, around).map((slot, i) =>
        slot === GAP ? (
          <Text key={`gap-${i}`} px="$1.5" fontSize="$2" color="$soft" aria-hidden>
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
            bg={slot === page ? '$edge' : undefined}
          >
            {String(slot)}
          </Button>
        ),
      )}
      <Button
        size="$2"
        chromeless
        icon={<ChevronRight size={16} />}
        onPress={() => go(page + 1)}
        disabled={page >= count}
        aria-label="Next page"
      />
    </XStack>
  )
}
