import React from 'react'

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '../../../primitives/index-blocks'

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
import VariantContentLeft from './variant-content-left'

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
  if (specifier === 'big-padding-content') {
    switch (section) {
      case 'content': {
        result = 'md:p-8 lg:p-12 xl:p-16'
      } break
    }
  }
  else if (specifier === 'no-inner-borders') {
    switch (section) {
      case 'header': {
        result = 'border-none'
      } break
      case 'footer': {
        result = 'border-t-0'
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

  const contentclx = [
    getClx('big-padding-content', 'content'),
  ].join(' ')

  const footerclx = [
    getClx('no-inner-borders', 'footer'),
  ].join(' ')

  const noOuterBorders = specified('no-outer-borders')
  const contentLeft = specified('variant-content-left')
  const mobileContentLeft = specified('variant-mobile-content-left')

  return (
    <Card className={cn('flex flex-col', className, noOuterBorders ? 'border-none' : '')} >
      {contentLeft || (mobileContentLeft && agent === 'phone') ? (
        <VariantContentLeft block={b} agent={agent} className={className} headingclx={headingclx} contentclx={contentclx} footerclx={footerclx}/>
      ) : (<>
        {(b.heading || b.topContent) && (
          <CardHeader className={cn('typography-img:m-0', headingclx)} >
            {b.topContent && (
              <Content blocks={b.topContent} agent={agent} className=''/>
            )}
            {b.heading && (
              <EnhHeadingBlockComponent block={b.heading} className='text-accent' agent={agent}/>
            )}
          </CardHeader>
        )}
        {b.content && (
          <CardContent className={cn('typography flex flex-col justify-center', contentclx, className)}>
            <Content blocks={b.content} agent={agent}/>
          </CardContent>
        )}
        {b.cta && (
          <CardFooter className={cn('grid grid-cols-1 gap-2 md:flex md:flex-row md:justify-center', footerclx)} >
            <CTABlockComponent block={b.cta} agent={agent}/>
          </CardFooter>
        )}
      </>)}
    </Card> 
  )
}

export default CarteBlancheBlockComponent
