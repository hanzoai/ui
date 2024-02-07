import React from 'react'

import type { LinkDef, ButtonDef} from '../../types'
import  { type ButtonSizes, ActionButton, LinkElement } from '../../primitives'
import type { CTABlock } from '../def'
import { cn, containsToken } from '../../util'

import type BlockComponentProps from './block-component-props'

const CtaBlockComponent: React.FC<BlockComponentProps & {
  itemClasses?: string
  itemSize?: ButtonSizes,
  renderLink?: (def: LinkDef, key: any) => JSX.Element
  renderButton?: (def: ButtonDef, key: any) => JSX.Element
}> = ({
  block,
  className='', // assigned to each item
  itemClasses='',
  itemSize, // do not provide default.  this is an override to the def
  renderLink,
  renderButton,
  agent
}) => {
  
  if (block.blockType !== 'cta') {
    return <>cta block required</>
  }

  const { elements, specifiers } = block as CTABlock
  let wrapperClasses = ''
  let itemclx = ''
  if (containsToken(specifiers, 'fill')) {
    wrapperClasses += 'w-full '
    itemclx += 'grow ' 
  }
  else if (containsToken(specifiers, 'left')) {
    wrapperClasses += 'sm:justify-start '
  }
  else if (containsToken(specifiers, 'right')) {
    wrapperClasses += 'sm:justify-end '
  }

  const containerclx = (
    agent === 'phone'
    &&
    containsToken(specifiers, 'mobile-2-columns') 
    && 
    elements.length > 1 
  ) 
    ? 
    'grid grid-cols-2 gap-2 self-stretch'
    :
    'flex flex-col items-stretch gap-2 self-stretch sm:flex-row sm:justify-center '

  return (
    <div className={cn(
      containerclx, 
      wrapperClasses,
      className
    )}>
    {elements.map((element, index) => {
      if ((element as any).title) {
        const def = element as LinkDef
        return renderLink ? renderLink(def, index) : (
          <LinkElement 
            def={def}
            key={index}
            size={itemSize}
            className={cn(itemclx, itemClasses)}
          />
        )
      } 
      else {
        const def = element as ButtonDef
        return renderButton ? renderButton(def, index) : (
          <ActionButton 
            def={def}
            key={index}
            size={itemSize}
            className={cn(itemclx, itemClasses)}
          />
        ) 
      }
    })}
    </div>
  )
}

export default CtaBlockComponent
