import React from 'react'
import Image from 'next/image'

import type { Icon } from '../../types'
import { cn } from '../../util'


const InlineIcon: React.FC<{
  icon: Icon | string
  size?: number
  agent?: string,
  className?: string
}> = ({
  icon,
  size, // default should be handled by calling code.
  agent,
  className=''
}) => {
  if (!icon) return null

  const phone = agent === 'phone'

  if (typeof icon === 'string') {
    const sz = (phone && size) ? (size * .75) : size
    const mclx = phone ? 'mr-2' : 'mr-4'
    return <Image src={icon} width={sz} height={sz} alt='icon' className={cn(mclx, className)}/>
  }
  return icon as Icon
}

export default InlineIcon
