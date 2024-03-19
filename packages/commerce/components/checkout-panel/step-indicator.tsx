import React from 'react'

import { Separator } from '@hanzo/ui/primitives'
import { cn } from '@hanzo/ui/util'

import type { CheckoutSteps } from './step'

const StepIndicator: React.FC<{
  steps: CheckoutSteps
  currentStep: number
  className?: string
}> = ({
  steps,
  currentStep,
  className=''
}) => ( 
  <div className={className}>
  {Object.keys(steps).map((key, index) => (<>
    {index !== 0 && (<Separator className='w-[4rem] sm:w-[6rem]'/>)}
    <div className={cn(
      'w-6 h-6 rounded-full border border-foreground flex flex-col justify-center items-center', 
      currentStep === parseInt(key) ? 'bg-foreground text-muted-4' : ''
    )}>
      <div className='relative text-foreground top-4 h-0 whitespace-nowrap'>{steps[parseInt(key)].label}</div>
    </div>
  </>))}
  </div>
)

export default StepIndicator
