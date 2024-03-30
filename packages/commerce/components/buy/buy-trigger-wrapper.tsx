'use client'
import React from 'react'

import BuyDrawer from './buy-drawer'

const BuyTriggerWrapper: React.FC<{
  skuPath: string
  trigger: React.ReactNode
  mobileTrigger?: React.ReactNode
  mobile?: boolean
}> = ({
  skuPath,
  trigger,
  mobileTrigger,
  mobile
}) => (
  <BuyDrawer skuPath={skuPath} trigger={trigger} mobile={mobile}/>
)

export default BuyTriggerWrapper
