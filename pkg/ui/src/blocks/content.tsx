import * as React from 'react'

import type { Block, ElementBlock } from './def'
import type { BlockComponentProps } from './spec'

import { AccordianBlockComponent } from './accordian'
import { BulletCardsBlockComponent } from './bullet-cards'
import { CardBlockComponent } from './card'
import { CarteBlancheBlockComponent } from './carte-blanche'
import { CTABlockComponent } from './cta'
import { EnhHeadingBlockComponent } from './enh-heading'
import { GridBlockComponent } from './grid'
import { GroupBlockComponent } from './group'
import { HeadingBlockComponent } from './heading'
import { ImageBlockComponent } from './image'
import { SpaceBlockComponent } from './space'
import { VideoBlockComponent } from './video'

/**
 * `blockType` → renderer.
 *
 * A Map rather than a switch because it is also the extension point: a host
 * calls `registerBlockType` to add a type of its own, or to replace one of
 * these — which is how a Next app substitutes its optimizing image, and how
 * anything the library does not ship reaches the page.
 */
const map = new Map<string, React.ComponentType<BlockComponentProps>>([
  ['accordian', AccordianBlockComponent],
  ['bullet-cards', BulletCardsBlockComponent],
  ['card', CardBlockComponent],
  ['carte-blanche', CarteBlancheBlockComponent],
  ['cta', CTABlockComponent],
  ['enh-heading', EnhHeadingBlockComponent],
  ['grid', GridBlockComponent],
  ['group', GroupBlockComponent],
  ['heading', HeadingBlockComponent],
  ['image', ImageBlockComponent],
  ['space', SpaceBlockComponent],
  ['video', VideoBlockComponent],
])

export const registerBlockType = (
  key: string,
  type: React.ComponentType<BlockComponentProps>,
): void => {
  map.set(key, type)
}

/**
 * `element` is the one type with no renderer, by design: it carries a node the
 * author already built, so rendering it means handing it back. That is what
 * makes a page of blocks able to hold anything at all.
 */
const one = (block: Block, className?: string, agent?: string, key?: string): React.ReactNode => {
  if (block.blockType === 'element') return (block as ElementBlock).element
  const Comp = map.get(block.blockType)
  if (!Comp) return null
  return <Comp block={block} className={className} agent={agent} key={key} />
}

export const Content = ({
  blocks,
  className,
  agent,
}: {
  blocks: Block | Block[] | undefined
  className?: string
  agent?: string
}) => {
  if (!blocks) return null
  if (Array.isArray(blocks)) {
    return (
      <>
        {blocks.map((b, i) => one(b, className, agent, `${b.blockType}-${i}`))}
      </>
    )
  }
  return <>{one(blocks, className, agent)}</>
}

export default Content
