import React, { PropsWithChildren } from 'react'

import type { VideoBlock } from '../../def'
import { cn } from '../../../util'

const Poster: React.FC<{
  banner: VideoBlock | string | undefined,
  className?: string
} & PropsWithChildren> = ({
  children,
  banner,
  className=''
}) => (
  banner ? (
    <div 
      className={cn('relative', className)} 
      style={{
        height: '100%',
        width: '100%',
        backgroundImage: `url(${(typeof banner === 'string') ? banner : banner.poster!})`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
      }} 
    >
      {children}
    </div>
  ) : (
    <div className={cn('bg-transparent h-full w-full relative', className)}>
      {children}  
    </div>
  )
)

export default Poster
