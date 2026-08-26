import * as React from 'react'

import { ApplyTypography } from '../backends/gui/prose'
import { Box } from '../box'
import type { HeadingBlock } from './def'
import type { BlockComponentProps } from './spec'

/** 0 is a paragraph; 1–6 are the heading tags. */
const tag = (level: number | undefined, fallback: string): string =>
  level === undefined ? fallback : level === 0 ? 'p' : `h${Math.min(6, Math.max(1, level))}`

/** A byline sits two rungs below its heading unless it says otherwise. */
const BYLINE: Record<string, string> = {
  p: 'p', h1: 'h3', h2: 'h4', h3: 'h5', h4: 'h6', h5: 'p', h6: 'p',
}

export const HeadingBlockComponent = ({ block, className }: BlockComponentProps) => {
  if (block.blockType !== 'heading') return <>heading block required</>
  const b = block as HeadingBlock

  const Head = tag(b.level, 'h3')
  const Byline = b.bylineLevel !== undefined ? tag(b.bylineLevel, 'h5') : BYLINE[Head]

  return (
    <ApplyTypography className={className}>
      <Box tag={Head as 'h3'}>{b.heading}</Box>
      {b.spaceBetween ? <Box className={`w-[1px] h-${b.spaceBetween}`} /> : null}
      {b.byline && <Box tag={Byline as 'h5'}>{b.byline}</Box>}
      {b.spaceAfter ? <Box className={`w-[1px] h-${b.spaceAfter}`} /> : null}
    </ApplyTypography>
  )
}

export default HeadingBlockComponent
