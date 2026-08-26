import * as React from 'react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../backends/gui/accordion'
import { ApplyTypography } from '../backends/gui/prose'
import { Box } from '../box'
import type { AccordianBlock } from './def'
import { type BlockComponentProps, sx } from './spec'

export const AccordianBlockComponent = ({ block, className }: BlockComponentProps) => {
  if (block.blockType !== 'accordian') return <>accordian block required</>
  const b = block as AccordianBlock

  return (
    <Accordion
      type="single"
      collapsible
      {...sx('w-full border rounded-xl overflow-hidden', className)}
    >
      {b.items.map((item, i) => (
        <AccordionItem
          {...sx('border-b overflow-hidden')}
          value={`value-${i}`}
          key={i}
        >
          <AccordionTrigger {...sx('px-3 md:px-4 lg:px-6')}>
            <ApplyTypography>
              <Box tag="h6" className="text-[1.05rem] font-semibold">
                {item.trigger}
              </Box>
            </ApplyTypography>
          </AccordionTrigger>
          <AccordionContent {...sx('p-4 border-t')}>
            {/* `justify-items`, not `items`: prose is a grid of implicit rows,
                so the INLINE axis — the one that decides whether a paragraph
                stretches or shrinks to its text — is justify. On a flex column
                the two were swapped, which is why this reads differently from
                the 5.x original it came from. */}
            <ApplyTypography className="justify-items-start">
              {typeof item.content === 'string' ? <Box tag="p">{item.content}</Box> : item.content}
            </ApplyTypography>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

export default AccordianBlockComponent
