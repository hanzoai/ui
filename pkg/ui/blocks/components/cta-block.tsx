import React from 'react'

import type { LinkDef, ButtonDef} from '../../types'
import  { buttonVariants, ActionButton, LinkElement } from '../../primitives/index-next'
import type { CTABlock } from '../def'
import { cn, containsToken, type VariantProps } from '../../util'

import type BlockComponentProps from './block-component-props'

const CtaBlockComponent: React.FC<BlockComponentProps & {
  itemClasses?: string
  itemSize?: VariantProps<typeof buttonVariants>['size'],
  renderLink?: (def: LinkDef, key: any) => React.ReactElement
  renderButton?: (def: ButtonDef, key: any) => React.ReactElement
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
    // normally 'default' buttons have a min width only at > lg.
    // generally if more than one we don't want this and override it,
    // but this specifier asks to observe the default behavior.
  const fillEvenly = !containsToken(specifiers, 'desktop-dont-fill')
  const mobileCenterFirstIfOdd = containsToken(specifiers, 'mobile-center-first-if-odd')
  const mobileOddFullWidth = containsToken(specifiers, 'mobile-odd-full-width')
  
  let layoutclx: string | undefined = undefined
  if (elements.length > 1) {
    let resetMinWidth = false
    if (mobile2Columns) {
      layoutclx = 'grid grid-cols-2 gap-2 self-stretch '   
      resetMinWidth = true 
    }
    if (fillEvenly) {
      layoutclx = (layoutclx ?? 'grid grid-cols-2 gap-2 self-stretch') 
      resetMinWidth = true 
    }
    else {
      layoutclx = layoutclx ? (layoutclx + 'md:flex md:flex-row md:justify-center ') : 'flex flex-row justify-center '    
    }
    itemclx += resetMinWidth ? '!min-w-0 ' : ''
  }
  layoutclx = layoutclx ?? 'flex flex-col items-stretch gap-2 self-stretch md:flex-row sm:justify-center '  

  const getMobileColSpanClx = (index: number, total: number) => {
    const indexToCenter = (total % 2 === 0) ? -1 : (mobileCenterFirstIfOdd) ? 0 : total - 1
    const widthclx = mobileOddFullWidth ? 'w-full ' : 'w-3/5 mx-auto '
    return (
      (agent === 'phone' && mobile2Columns && (index === indexToCenter)) ? ('col-span-2 ' + widthclx) : ''  
    )
  } 

  return (
    <div className={cn(
      layoutclx, 
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
