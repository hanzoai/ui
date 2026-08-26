'use client'

import * as React from 'react'

import { LinkElement } from '../backends/gui/link'
import { Box } from '../box'
import { cn } from '../core/cn'
import type { ButtonSize } from '../backends/gui/button'
import type { ButtonDef, LinkDef } from '../types'
import type { CTABlock } from './def'
import { type BlockComponentProps, has } from './spec'

/**
 * A button whose action is a modal.
 *
 * `ButtonDef` carries the modal COMPONENT rather than a modal, so the library
 * never has to know what the app's dialog is: this opens it, closes it, and
 * hands it the action to run. The 5.x line shipped this file empty, so every
 * `ButtonDef` in a cta rendered nothing at all.
 */
const ActionButton = ({
  def,
  size,
  className,
}: {
  def: ButtonDef
  size?: ButtonSize | null
  className?: string
}) => {
  const [open, setOpen] = React.useState(false)
  const modal = def.action.def
  const { Comp } = modal
  return (
    <Comp
      open={open}
      onOpenChange={setOpen}
      buttonText={def.text}
      buttonProps={{ ...def.props, ...(size ? { size } : {}), className }}
      title={modal.title}
      byline={modal.byline}
      action={modal.action ?? (async () => undefined)}
      actionEnclosure={modal.actionEnclosure}
    />
  )
}

/** A def with a `title` is a link; anything else is a button. */
const isLink = (e: LinkDef | ButtonDef): e is LinkDef => 'title' in e || 'href' in e

export const CTABlockComponent = ({
  block,
  className,
  itemClasses,
  itemSize,
  renderLink,
  renderButton,
  agent,
}: BlockComponentProps & {
  itemClasses?: string
  /** Overrides the size in each def. */
  itemSize?: ButtonSize | null
  renderLink?: (def: LinkDef, key: number) => React.ReactElement
  renderButton?: (def: ButtonDef, key: number) => React.ReactElement
}) => {
  if (block.blockType !== 'cta') return <>cta block required</>
  const { elements, specifiers } = block as CTABlock

  const spec = (s: string) => has(specifiers, s)

  const justify = spec('fill')
    ? 'w-full'
    : spec('left')
      ? 'md:justify-start'
      : spec('right')
        ? 'md:justify-end'
        : 'md:justify-center'

  const twoUp = spec('mobile-2-columns')
  const fillEvenly = !spec('desktop-dont-fill')
  const centerFirst = spec('mobile-center-first-if-odd')
  const oddFullWidth = spec('mobile-odd-full-width')

  let layout = 'flex flex-col items-stretch gap-2 self-stretch md:flex-row sm:justify-center'
  let item = spec('fill') ? 'grow shrink min-w-0' : ''

  if (elements.length > 1) {
    if (twoUp || fillEvenly) {
      layout = 'grid grid-cols-2 gap-2 self-stretch'
      item += ' min-w-0'
    } else {
      layout = 'flex flex-row justify-center'
    }
  }

  /** With an odd count in two columns, one element spans both. */
  const span = (i: number, total: number) => {
    if (!(agent === 'phone' && twoUp)) return ''
    const centred = total % 2 === 0 ? -1 : centerFirst ? 0 : total - 1
    return i === centred ? `col-span-2 ${oddFullWidth ? 'w-full' : 'w-3/5 mx-auto'}` : ''
  }

  return (
    <Box className={cn(layout, justify, className)}>
      {elements.map((element, i) => {
        const extra = cn(item, itemClasses, span(i, elements.length))
        if (isLink(element)) {
          return renderLink ? (
            renderLink(element, i)
          ) : (
            <LinkElement def={element} key={i} size={itemSize} className={extra} />
          )
        }
        return renderButton ? (
          renderButton(element, i)
        ) : (
          <ActionButton def={element} key={i} size={itemSize} className={extra} />
        )
      })}
    </Box>
  )
}

export default CTABlockComponent
