'use client'
import React, {type PropsWithChildren} from 'react'

import { type ButtonVariants, type ButtonSizes, Button } from '@hanzo/ui/primitives'

import BuyItemPopup from './buy-item-popup'
import BuyItemMobileDrawer from './buy-item-mobile-drawer'
import { cn } from '@hanzo/ui/util'

const BuyItemButton: React.FC<PropsWithChildren & {
  skuPath: string
  variant? : ButtonVariants 
  size?: ButtonSizes  
  /* rounded?: ButtonRounded // wait for version bump*/
  className?: string 
  popupClx?: string
}> = ({
  skuPath,
  variant,
  size,
  children,
  className='',
  popupClx=''
}) => (<>
  <BuyItemPopup skuPath={skuPath} popupClx={popupClx}>
    <Button size={size} variant={variant} className={cn(className, 'hidden md:flex')}>{children}</Button>
  </BuyItemPopup>
  <BuyItemMobileDrawer skuPath={skuPath} trigger={<Button size={size} variant={variant} className={cn(className, 'md:hidden')}>{children}</Button>} />
</>
)



export default BuyItemButton
