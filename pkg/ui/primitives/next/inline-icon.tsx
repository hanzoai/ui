import React from 'react'
import Image from 'next/image'

import type { Icon } from '../../types'

const InlineIcon: React.FC<{
    /**
     * If a ReactNode is passed in, it should be set to 'w-full h-auto' so that it can be sized
     * according to width of parent. 
     */
  icon: Icon | string
    /** default should be handled by calling code. */
  size?: number

  agent?: string,
  className?: string
}> = ({
  icon,
  size, 
  agent,
  className=''
}) => {
  if (!icon) return null

  const phone = agent === 'phone'
  if (typeof icon === 'string') {
    const _size = (phone && size) ? (size * .75) : size
    return (<Image src={icon} width={_size} height={_size} alt='icon' className={className}/>)
  }
  return (
    <div className={className}>
      {icon as Icon}
    </div>
  )
}

export default InlineIcon
