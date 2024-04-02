import React from 'react'
import Image from 'next/image'

import type { ProductTreeNode } from '../../types'

const ICON_SIZE = 20

const NodeImage: React.FC<{
  treeNode: ProductTreeNode
}> = ({
  treeNode: {
    img,
    imgAR: ar,
    label
  }
}) => {

  if (!img) { return null }
    // treat as URL
  return (typeof img === 'string') ? (
    <Image 
      src={img as string} 
      alt={`Toggle ${label}`} 
      className={'block mr-1 '} 
      width={ar ?  ar * ICON_SIZE : ICON_SIZE}
      height={ICON_SIZE}
    />
  ) : (img as React.ReactNode) 
} 

export default NodeImage
