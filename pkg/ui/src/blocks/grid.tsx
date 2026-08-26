import * as React from 'react'

import { Box } from '../box'
import { cn } from '../core/cn'
import type { GridColumnSpec } from '../types'
import type { Block, GridBlock } from './def'
import { Content } from './content'
import { type BlockComponentProps, has } from './spec'

const cols = (d: GridColumnSpec, at = ''): string =>
  typeof d === 'number'
    ? `${at}grid-cols-${d}`
    : `${at}grid-cols-${d.columns} ${at}gap-${d.gap}`

/**
 * Cells drawn as a table: every cell carries its own right and bottom rule, and
 * the edges of the whole are closed by the first row and first column adding
 * theirs. Corners round outward only.
 *
 * Below `md` the grid is a single column, so the vertical rules are dropped and
 * each cell keeps just its bottom one — which reads as a list, correctly.
 */
const table = (i: number, count: number, columns: number): string => {
  const first = i < columns
  return cn(
    'border-b md:border-r p-4 md:p-8 lg:p-12',
    first && 'border-t',
    i % columns === 0 && 'md:border-l',
    i === 0 && 'md:rounded-tl-lg',
    i === columns - 1 && 'md:rounded-tr-lg',
    i === count - columns && 'md:rounded-bl-lg',
    i === count - 1 && 'md:rounded-br-lg',
  )
}

/**
 * Blocks laid out on a grid.
 *
 * Rendered with children, those replace `cells` — which is how BulletCards uses
 * it: same layout, different cell content.
 *
 * The first rung in `grid.at` is written WITHOUT a prefix so the grid always has
 * a base to fall back to, whichever rung a site chose to start at. The rest are
 * prefixed and take over as the viewport grows.
 */
export const GridBlockComponent = ({
  block,
  className,
  agent,
  children,
}: Omit<BlockComponentProps, 'block'> &
  React.PropsWithChildren<{ block: Block | GridBlock }>) => {
  if (block.blockType !== 'grid') return <>grid block required</>
  const { cells, grid, specifiers } = block as GridBlock

  let layout = ''
  if (agent === 'phone') {
    layout = cols(grid.mobile ?? grid.at.xs ?? grid.at.sm ?? 1)
  } else {
    let base = false
    for (const [rung, spec] of Object.entries(grid.at)) {
      layout += `${cols(spec as GridColumnSpec, base ? `${rung}:` : '')} `
      base = true
    }
  }

  const ruled = has(specifiers, 'style-table-borders')
  let cell = (_: number) => ''
  if (ruled && cells?.length) {
    const md = grid.at.md
    const columns = typeof md === 'number' ? md : (md?.columns ?? 1)
    cell = (i: number) => table(i, cells.length, columns)
  }

  return (
    <Box
      className={cn(
        'grid gap-2 md:gap-4 xl:gap-6',
        layout,
        // Ruled cells own their spacing: a gap would open a gutter through the
        // rules and the table would stop reading as one.
        ruled && 'gap-0 md:gap-0 xl:gap-0',
        className,
      )}
    >
      {React.Children.count(children) > 0
        ? children
        : cells?.map((c, i) => (
            <Content blocks={c} agent={agent} key={i} className={cell(i)} />
          ))}
    </Box>
  )
}

export default GridBlockComponent
