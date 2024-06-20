import React from 'react'

import { cn } from '../util'

const StepIndicator: React.FC<{
  steps: string[]
  currentStep: number
  dotSizeRem: number 
  className?: string
  muted?: boolean
}> = ({
  steps,
  currentStep,
  dotSizeRem,
  className='',
  muted=false
}) => {

  const pX = `calc(${1 / (steps.length * 2) * 100}% - ${dotSizeRem / 2}rem)`

    // This code current throws 'Warning: Each child in a list should have a unique "key" prop.'
    // As is evident, we supply keys that should suffice.  < shrug >
  return ( 
    <div className={cn('flex flex-col', className)}>
      <div 
        key='one' 
        /* id='FOO' */
        className='flex flex-row items-center justify-start w-full'
        style={{ paddingLeft: pX, paddingRight: pX }}
      >
        {steps.map((ignore, index) => (<>
          {index !== 0 && (
            <div
              key={`sep-${index}`}
              className={cn(
                'h-[1px] grow',
                currentStep >= index ? (muted ? 'bg-muted' : 'bg-foreground') : (muted ? 'bg-muted-3' : 'bg-level-3'),
              )}
            />
          )}
          <div 
            key={`circle-${index}`} 
            style={{width: `${dotSizeRem}rem`, height: `${dotSizeRem}rem`}} 
            className={cn(
              'shrink-0 rounded-full border-[1.5px]', 
              currentStep >= index ? (muted ? 'bg-muted border-muted' : 'bg-foreground border-foreground') : '',
              //currentStep > index || currentStep === steps.length - 1 ? (muted ? 'bg-muted border-muted' : 'bg-foreground border-foreground') : ''
            )} 
          />
        </>))}
      </div>
      <div key='two' className={'grid ' + `grid-cols-${steps.length}` /* These are white listed already */} >
        {steps.map((label, index) => (
          <div
            key={index}
            className={cn(
              'text-center whitespace-nowrap',
              (muted ? 'text-muted' : 'text-foreground')
            )}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}

export default StepIndicator
