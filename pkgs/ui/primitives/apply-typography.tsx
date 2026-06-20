import React, { PropsWithChildren } from 'react'

import { cn } from '../util'

type TypographySize = 'responsive' | 'sm' | 'base' | 'lg' | 'xl' // if t-shirt size, do *not* be responsive

const ApplyTypography: React.FC<
  React.ComponentProps<'div'> & {
    asTag?: 'div' | 'section' | 'nav' | 'main' | 'article',
    size?: TypographySize
  }
> = ({ 
  children,
  className='',
  asTag='div',
  size='responsive',
  ...rest
}) => {

    // responsive version by default
  let typoClasses = 
    'typography gap-3 ' +
    'xs:typography-sm ' + 
    'sm:typography sm:gap-4 ' +
    'lg:typography-lg lg:gap-5 ' + 
    'xl:typography-xl xl:gap-6 ' + 
    'typography-headings:font-heading ' // only effects h1-h3 (in plugin)

  switch (size) {
    case 'sm': {
      typoClasses = 'typography typography-sm gap-3 typography-headings:font-heading typography-p:text-sm '
    } break
    case 'base': {
      typoClasses = 'typography gap-4 typography-headings:font-heading '
    } break
    case 'lg': {
      typoClasses = 'typography typography-lg gap-5 typography-headings:font-heading typography-p:text-lg '
    } break
    case 'xl': {
      typoClasses = 'typography typography-xl gap-6 typography-headings:font-heading typography-p:text-lg '
    } break
  }
  
  const Tag = asTag
  return (
    <Tag {...rest} className={cn(typoClasses, className)}>
      {children}
    </Tag>
  )
}

export {
  type TypographySize,
  ApplyTypography as default
}
