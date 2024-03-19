'use client'
import React from 'react'

import { ChevronLeft } from 'lucide-react'
import { Button } from '@hanzo/ui/primitives'

const CloseButton: React.FC<{
  onClose: () => void
  className?: string
}> = ({
  onClose,
  className=''
}) => (
    <Button
      variant='ghost'
      size='icon'
      onClick={onClose}
      className={'group ' + className}
    >
      <ChevronLeft className='w-5 h-5 group-hover:scale-110 transition-scale transition-duration-300'/>
    </Button>    
)

export default CloseButton
