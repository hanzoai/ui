import * as React from 'react'

import { Box } from '../box'
import { cn } from '../core/cn'
import type { BulletCardsBlock } from './def'
import { GridBlockComponent } from './grid'
import { type BlockComponentProps, has } from './spec'

/** An icon given as a url is drawn at `size`; given as a node it renders as-is. */
const Mark = ({
  icon,
  size,
  phone,
  className,
}: {
  icon: React.ReactNode
  size: number
  phone: boolean
  className?: string
}) => {
  if (!icon) return null
  if (typeof icon === 'string') {
    const s = phone ? size * 0.75 : size
    return <Box tag="img" src={icon} width={s} height={s} alt="" className={className} />
  }
  return <Box className={className}>{icon}</Box>
}

/**
 * A grid of one-line cards, each an icon beside its text.
 *
 * Borders arrive at `md` and not before: on a phone the grid is one column, so
 * a border per card would draw a stack of boxes where the eye reads a list.
 */
export const BulletCardsBlockComponent = ({
  block,
  className,
  agent,
}: BlockComponentProps) => {
  if (block.blockType !== 'bullet-cards') return <>bullet-cards block required</>
  const b = block as BulletCardsBlock
  const spec = (s: string) => has(b.specifiers, s)

  const border = spec('no-card-border')
    ? 'border-0'
    : cn(
        'md:border',
        spec('border-muted-3')
          ? 'md:border-muted-3'
          : spec('border-muted-1')
            ? 'md:border-muted-1'
            : 'md:border-muted-2',
      )

  return (
    <GridBlockComponent
      block={{ blockType: 'grid', grid: b.grid }}
      className={className}
      agent={agent}
    >
      {b.cards.map((card, i) => (
        <Box
          key={i}
          className={cn(
            'px-0 sm:px-4 py-1 md:py-4 rounded-lg',
            'flex flex-row justify-start items-center text-foreground',
            border,
          )}
        >
          <Mark
            icon={card.icon}
            size={b.iconSize ?? 28}
            phone={agent === 'phone'}
            className="shrink-0 mr-2 md:mr-4"
          />
          <Box tag="p" className={cn('m-0 sm:text-base', spec('mobile-small-text') ? 'text-xs' : 'text-sm')}>
            {card.text}
          </Box>
        </Box>
      ))}
    </GridBlockComponent>
  )
}

export default BulletCardsBlockComponent
