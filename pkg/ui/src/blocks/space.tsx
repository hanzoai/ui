import * as React from 'react'

import { ApplyTypography } from '../backends/gui/prose'
import { Box } from '../box'
import type { Breakpoint } from '../types'
import { SPACE_DEFAULTS, type SpaceBlock, type SpaceUnit } from './def'
import type { BlockComponentProps } from './spec'

/** 0 is a paragraph's worth of space; 1–6 are the heading tags'. */
const TAGS = ['div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const

export const SpaceBlockComponent = ({ block, className }: BlockComponentProps) => {
  if (block.blockType !== 'space') return <>space block required</>
  const b = block as SpaceBlock

  // Measured against a heading: the space a level-N heading WOULD occupy, so a
  // gap between sections matches the rhythm of the text around it.
  //
  // Tested against undefined, not for truth. Level 0 means "a paragraph's
  // worth", and `if (b.level)` reads 0 as absent — so it fell through to the
  // rung ladder below and the h-4 case it documents could never be reached.
  if (b.level !== undefined) {
    const Tag = TAGS[b.level]
    return (
      <ApplyTypography className={className}>
        <Box tag={Tag} aria-hidden className={`invisible m-0 ${b.level === 0 ? 'h-4' : ''}`}>
          &nbsp;
        </Box>
      </ApplyTypography>
    )
  }

  // One number is that height at every rung.
  if (typeof b.sizes === 'number') {
    return <Box aria-hidden className={`invisible w-[1px] h-${b.sizes} ${className ?? ''}`} />
  }

  // Otherwise the given rungs sit over the defaults, and each becomes a
  // prefixed class. `xs` lands at the base (see the VARIANT map in tw.ts), so
  // the ladder has a floor and every larger rung overrides it in turn.
  const sizes: { [k in Breakpoint]?: SpaceUnit } = { ...SPACE_DEFAULTS, ...b.sizes }
  const rungs = Object.entries(sizes)
    .map(([rung, v]) => `${rung}:h-${v}`)
    .join(' ')

  return <Box aria-hidden className={`invisible w-[1px] ${rungs} ${className ?? ''}`} />
}

export default SpaceBlockComponent
