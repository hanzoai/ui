import * as React from 'react'

import { Box } from '../box'
import { cn } from '../core/cn'
import { Breakpoints } from '../types'
import type { Breakpoint } from '../types'
import type { GroupBlock } from './def'
import { Content } from './content'
import type { BlockComponentProps } from './spec'

/**
 * Reads a layout hint: `layout-grid-3-starting-md` — three columns, from `md`
 * up, one column below it.
 *
 * The bounds are real: one column is not a grid, and past six the cells are
 * narrower than the words in them. Out of range returns nothing, and the block
 * says so rather than rendering a layout nobody asked for.
 */
const layout = (specifiers: string): { columns: number; from: Breakpoint } | undefined => {
  const hint = specifiers.split(/\s+/).find((t) => t.startsWith('layout-'))
  if (!hint) return undefined
  const [, kind, count, , from] = hint.split('-')
  if (kind !== 'grid') return undefined
  const columns = parseInt(count, 10)
  if (Number.isNaN(columns) || columns < 2 || columns > 6) return undefined
  if (!Breakpoints.includes(from as Breakpoint)) return undefined
  return { columns, from: from as Breakpoint }
}

export const GroupBlockComponent = ({ block, className, agent }: BlockComponentProps) => {
  if (block.blockType !== 'group') return <>group block required</>
  const b = block as GroupBlock

  if (!b.specifiers?.includes('layout')) return null

  const spec = layout(b.specifiers)
  if (!spec) return <>invalid or missing layout specifier in group block</>

  return (
    <Box
      className={cn(
        'grid grid-cols-1 gap-2 sm:gap-3',
        `${spec.from}:grid-cols-${spec.columns}`,
        className,
      )}
    >
      <Content blocks={b.elements} agent={agent} />
    </Box>
  )
}

export default GroupBlockComponent
