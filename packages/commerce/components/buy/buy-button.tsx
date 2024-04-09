'use client'
import React, {type PropsWithChildren} from 'react'

import { type ButtonVariants, type ButtonSizes, Button } from '@hanzo/ui/primitives'

import BuyTriggerWrapper from './buy-trigger-wrapper'
import { cn } from '@hanzo/ui/util'

const BuyButton: React.FC<PropsWithChildren & {
  skuPath: string
  variant? : ButtonVariants 
  size?: ButtonSizes  
  /* rounded?: ButtonRoundedValue // TODO: wait for version bump*/
  className?: string 
  mobile?: boolean
}> = ({
  skuPath,
  variant,
  size,
  children,
  className='',
  mobile=false
}) => (
  <BuyTriggerWrapper skuPath={skuPath} mobile={mobile}
    trigger={  <Button size={size} variant={variant} className={cn(className, '')}>{children}</Button> }
  />
)



export default BuyButton
