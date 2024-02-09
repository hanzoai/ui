import React from 'react'

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '../../../primitives'

import { cn, containsToken } from '../../../util'

import {
  getSpecifierData, 
  getPrimaryStartingWith, 
  getDim, 
} from '../../../util/specifier'

import type CarteBlancheBlock from '../../def/carte-blanche-block'

import CTABlockComponent from '../cta-block'
import Content from '../content'
import type BlockComponentProps from '../block-component-props'
import { EnhHeadingBlockComponent } from '..'

type CardSection = 'entire' | 'header' | 'content' | 'footer'

const _getClx = (specifier: string, section: CardSection): string => {
  let result = ''
  if (specifier === 'big-padding') {
    switch (section) {
        // defaults: p-4 lg:p-6 xl:p-8 
      case 'header': {
        result = 'md:p-8 lg:p-12 xl:p-16'
      } break
    }
  }
  else if (specifier === 'no-inner-borders') {
    switch (section) {
      case 'header': {
        result = 'border-none'
      } break
    }
  }

  return result
}

const CarteBlancheBlockComponent: React.FC<
  BlockComponentProps 
> = ({
  block,
  className='',
  agent,
}) => {

  if (block.blockType !== 'carte-blanche') {
    return <>carte blanche block required</>
  }

  const b = block as CarteBlancheBlock

  const specified = (s: string): boolean => (containsToken(b.specifiers, s))
  const getClx = (specifier: string, section: CardSection): string => (
    (specified(specifier)) ? _getClx(specifier, section) : ''
  )

  //const bigPadding = specified('big-padding')
  
  const headingclx = [
    getClx('big-padding', 'header'),
    getClx('no-inner-borders', 'header'),
  ].join(' ')

  return (
    <Card className={cn('flex flex-col ', className)} >
    {b.heading && (
      <CardHeader className={cn('typography-img:m-0', headingclx)} >
      {b.topContent && (
        <Content blocks={b.topContent} agent={agent} className=''/>
      )}
        <EnhHeadingBlockComponent block={b.heading} className='text-accent' agent={agent}/>
      </CardHeader>
    )}
    {b.content && (
      <CardContent className={cn('typography flex flex-col justify-center', className)}>
        <Content blocks={b.content} agent={agent}/>
      </CardContent>
    )}
    {b.cta && (
      <CardFooter className={'grid grid-cols-1 gap-2 md:flex md:flex-row md:justify-center ' /*+ paddingclx*/} >
        <CTABlockComponent block={b.cta} agent={agent}/>
      </CardFooter>
    )}
    </Card> 
  )
}

export default CarteBlancheBlockComponent
