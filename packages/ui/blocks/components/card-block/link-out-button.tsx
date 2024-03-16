import React from 'react'

import type { LinkDef } from '../../../types'
import { LinkElement, Icons } from '../../../primitives'

const ArrowLinkElement: React.FC<{
  def: LinkDef,
}> = ({
  def
}) => (
  <LinkElement
    def={def}
    className='justify-between'
    variant='link'
    icon={<Icons.linkOut className='w-[18px] h-[18px]' />}
    iconAfter
  />
) 

export default ArrowLinkElement
