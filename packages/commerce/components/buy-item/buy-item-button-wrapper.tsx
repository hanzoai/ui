'use client'
import React, {type PropsWithChildren} from 'react'

import BuyItemPopup from './buy-item-popup'
import BuyItemMobileDrawer from './buy-item-mobile-drawer'

const BuyItemButtonWrapper: React.FC<{
  skuPath: string
  desktopTrigger: React.ReactNode
  mobileTrigger: React.ReactNode
  popupClx?: string
}> = ({
  skuPath,
  desktopTrigger,
  mobileTrigger,
  popupClx=''
}) => (<>
  <BuyItemPopup skuPath={skuPath} popupClx={popupClx}>
    {desktopTrigger}
  </BuyItemPopup>
  <BuyItemMobileDrawer skuPath={skuPath} trigger={mobileTrigger} />
</>
)



export default BuyItemButtonWrapper
