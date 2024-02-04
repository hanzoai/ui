import React from 'react'

import type { LinkDef, ButtonDef} from '../../types'
import  { type ButtonSizes, ActionButton, LinkElement } from '../../primitives'
import type { Block, CTABlock } from '../def'
import { cn, containsToken } from '../../util'

const CtaBlockComponent: React.FC<{
  block: Block,
  itemClassName?: string,
  itemSize?: ButtonSizes,
  renderLink?: (def: LinkDef, key: any) => JSX.Element
  renderButton?: (def: ButtonDef, key: any) => JSX.Element
}> = ({
  block,
  itemClassName='',
  itemSize, // do not provide default.  this is an override to the def
  renderLink,
  renderButton
}) => {
  
  if (block.blockType !== 'cta') {
    return <>cta block required</>
  }

  const { elements, specifiers } = block as CTABlock
  let wrapperClasses = ''
  let itemClasses = ''
  if (containsToken(specifiers, 'fill')) {
    wrapperClasses += 'w-full '
    itemClasses += 'grow ' 
  }
  else if (containsToken(specifiers, 'left')) {
    wrapperClasses += 'sm:justify-start '
  }
  else if (containsToken(specifiers, 'right')) {
    wrapperClasses += 'sm:justify-end '
  }

  return (
    <div className={cn(
      'flex flex-col items-stretch gap-2 self-stretch sm:flex-row sm:justify-center ', 
      wrapperClasses
    )}>
    {elements.map((element, index) => {
      if ((element as any).title) {
        const def = element as LinkDef
        return renderLink ? renderLink(def, index) : (
          <LinkElement 
            def={def}
            key={index}
            size={itemSize}
            className={itemClassName}
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
            className={itemClassName}
          />
        ) 
      }
    })}
    </div>
  )
}

export default CtaBlockComponent
