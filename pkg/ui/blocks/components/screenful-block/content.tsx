import React, { PropsWithChildren } from 'react'

import type { Block, ScreenfulBlock} from '../../def'
import { containsToken, cn } from '../../../util'
import ContentComponent from '../content'

const ContentColumn: React.FC<{
  blocks: Block[]
  specifiers?: string
  agent?: string
  className?: string
}> = ({
  blocks,
  specifiers,
  agent,
  className='',
}) => {

  const specified = (s: string) => (containsToken(specifiers, s))

  let modifiers = ''

  if (agent !== 'phone') {
    if (specified('right')) {
      modifiers += 'items-end ' 
      
    }
    else if (specified('center')) {
      modifiers += 'items-center '
    }
    // default to left
    else {
      modifiers += 'items-start '
    } 
  }
    // default to left
  else {
    modifiers += 'items-start '
  } 

  if (agent !== 'phone') {
    if (specified('bottom')) {
      modifiers += 'justify-end ' 
    }
    else if (specified('vert-center')) {
      modifiers += 'justify-center ' 
    }
      // default to top 
    else {
      modifiers += 'justify-start ' 
    } 
    // right aligned text looks shitty on mobile 
    if (specified('text-align-right')) {
      modifiers += 'text-right '  
    }
    else {
      modifiers += 'text-left '  
    }
  }
  else {
    if (specified('mobile-vert-center')) {
      modifiers += 'justify-center ' 
    }
    else {
      modifiers += 'justify-start ' 
    }
  }

  if (agent === 'phone' && specified('mobile-center-headings')) {
    modifiers += 'typography-headings:text-center '  
  }

  /* ContentComponent's parent div needs h-full class in order for vertical alignment with flexbox to work.
  *  This affects specifiers: bottom, vert-center, mobile-vert-center
  */
  return (
    <div className={cn('flex flex-col justify-center h-full', modifiers, className)} >
      <ContentComponent blocks={blocks} agent={agent} />
    </div>
  )
}  

const Content: React.FC<{
  block: ScreenfulBlock
  agent?: string
  className?: string
}> = ({
  block: b,
  agent,
  className='',
}) => {

  // We need to set h-full when we have more than 1 column too, so the grid takes full height - Firefox and Safari fix.
  const layoutClx = 'flex flex-col gap-2 sm:gap-4 h-full ' + ((agent !== 'phone') ? ('md:grid md:gap-8 ' + `md:grid-cols-${b.contentColumns.length} `) : '')

  const orderclx = (columnIndex: number): string => {
    const orderIndex = b.mobileOrder?.indexOf(columnIndex)
    return (orderIndex && orderIndex >= 0) ? `order-${orderIndex} md:order-none` : '' // one-based in flexbox slec
  }

  return  b.contentColumns.length == 1 ? (
    <ContentColumn 
      blocks={b.contentColumns[0]} 
      specifiers={b.columnSpecifiers?.[0]} 
      agent={agent} 
      className={cn(className)}
    />
  ) : (
    <div className={cn(layoutClx, className)}>
    {b.contentColumns.map((column, index) => (
      <ContentColumn 
        blocks={column} 
        specifiers={b.columnSpecifiers?.[index]} 
        agent={agent} 
        className={orderclx(index)}
        key={index}
      />
    ))}  
    </div>
  )
}

export default Content
