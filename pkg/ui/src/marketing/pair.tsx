'use client'

/**
 * Pair — the two controls that close a section: stacked on a phone, side by
 * side from 640.
 *
 * A grid, not a row of flex items. A row of two is a track list, and
 * `gridAutoFlow="column"` says the direction once; the stacked case needs
 * nothing said at all, because a grid is already one column. Each control keeps
 * its own width and the pair centres as a whole.
 *
 * `render` accepts an element, so an entrance can be the pair rather than wrap
 * it: `render={<motion.div {...reveal} />}`.
 */
import { View, type ViewProps } from '@hanzo/gui'
import type { ReactNode } from 'react'

import { slot } from '../backends/gui/slot'
import type { Loose } from './loose'

export type PairProps = Loose<Omit<ViewProps, 'render' | 'children'>> & {
  render?: ViewProps['render']
  children?: ReactNode
}

const Pair = ({ render, ...p }: PairProps) => (
  <View
    {...slot('pair')}
    {...(render === undefined ? null : { render })}
    display="grid"
    gap="$4"
    justifyItems="center"
    justify="center"
    items="center"
    $sm={{ gridAutoFlow: 'column' }}
    {...(p as object)}
  />
)

export { Pair }
