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

  return ( 
    <div className={cn('flex flex-col', className)}>
      <div 
        key='one' 
        /* id='FOO' */
        className='flex flex-row items-center justify-start w-full'
        style={{ paddingLeft: pX, paddingRight: pX }}
      >
        {steps.map((ignore, index) => (<>
          {index !== 0 && (<div key={`sep-${index}`} className={'h-[1px] grow ' + (muted ? 'bg-muted' : 'bg-foreground')}/>)}
          <div 
            key={`circle-${index}`} 
            style={{width: `${dotSizeRem}rem`, height: `${dotSizeRem}rem`}} 
            className={cn(
              'shrink-0 rounded-full border-[1.5px] ' + (muted ? 'border-muted' : 'border-foreground') , 
              currentStep === index ? (muted ? 'bg-muted' : 'bg-foreground') : ''
            )} 
          />
        </>))}
      </div>
      <div key='two' className={'grid ' + `grid-cols-${steps.length}` /* These are white listed already */} >
        {steps.map((label, index) => (
          <div key={index} className={'text-center whitespace-nowrap ' + (muted ? 'text-muted' : 'text-foreground')} >{label}</div>
        ))}
      </div>
    </div>
  )
}

export default StepIndicator
