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
      className={className}
    >
      <ChevronLeft className='w-5 h-5'/>
    </Button>    
)

export default CloseButton
