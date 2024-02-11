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
    itemclx += 'grow shrink !min-w-0' 
  }
  else if (containsToken(specifiers, 'left')) {
    wrapperClasses += 'md:justify-start '
  }
  else if (containsToken(specifiers, 'right')) {
    wrapperClasses += 'md:justify-end '
  }
  else {
    wrapperClasses += 'md:justify-center '
  }

  const mobile2Columns = containsToken(specifiers, 'mobile-2-columns')
  const mobileCenterFirstIfOdd = containsToken(specifiers, 'mobile-center-first-if-odd')
  const mobileOddFullWidth = containsToken(specifiers, 'mobile-odd-full-width')
  
  const containerclx = (
    agent === 'phone'
    &&
    mobile2Columns
    && 
    elements.length > 1 
  ) 
    ? 
    'grid grid-cols-2 gap-2 self-stretch'
    :
    'flex flex-col items-stretch gap-2 self-stretch md:flex-row sm:justify-center '

  const getMobileColSpanClx = (index: number, total: number) => {
    const indexToCenter = (total % 2 === 0) ? -1 : (mobileCenterFirstIfOdd) ? 0 : total - 1
    const widthclx = mobileOddFullWidth ? 'w-full ' : 'w-3/5 mx-auto '
    return (
      (agent === 'phone' && mobile2Columns && (index === indexToCenter)) ? ('col-span-2 ' + widthclx) : ''  
    )
  } 

  return (
    <div className={cn(
      containerclx, 
      wrapperClasses,
      className
    )}>
    {elements.map((element, index) => {
      const twoColClx = getMobileColSpanClx(index, elements.length)
      if ((element as any).title) {
        const def = element as LinkDef
        return renderLink ? renderLink(def, index) : (
          <LinkElement 
            def={def}
            key={index}
            size={itemSize}
            className={cn(itemclx, itemClasses, twoColClx)}
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
            className={cn(itemclx, itemClasses, twoColClx)}
          />
        ) 
      }
    })}
    </div>
  )
}

export default CtaBlockComponent
