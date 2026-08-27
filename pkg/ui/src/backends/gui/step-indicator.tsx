'use client'

/**
 * StepIndicator — how far along a sequence you are.
 *
 * A dot per step joined by a rule, the ones behind you filled. It is a
 * PROGRESSBAR, not a list of buttons: the steps are not reachable from here,
 * and announcing them as controls invites a keyboard user to try.
 *
 * The dot size is a caller's number in rem, because this sits inside a checkout
 * header whose height the caller owns — and because a dot that scales with the
 * text is a dot that changes size when someone changes their type size.
 */
import * as React from 'react'

import { Box } from '../../box'
import { cn } from '../../core/cn'

export type StepIndicatorProps = Omit<React.ComponentProps<typeof Box>, 'children'> & {
  steps: string[]
  /** Zero-based. Steps before it are done; this one is current. */
  currentStep: number
  /** Diameter, in rem. */
  dotSizeRem?: number
}

export const StepIndicator = ({
  steps,
  currentStep,
  dotSizeRem = 1,
  className,
  ...props
}: StepIndicatorProps) => {
  const dot = `${dotSizeRem}rem`
  return (
    <Box
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={steps.length - 1}
      aria-valuenow={currentStep}
      aria-valuetext={steps[currentStep]}
      className={cn('grid items-start', className)}
      // One column per step, each an equal share. A count is data, and data
      // cannot be a class name.
      style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
      {...props}
    >
      {steps.map((name, i) => {
        const done = i <= currentStep
        return (
          <Box key={name} className="grid justify-items-center gap-1 relative">
            {/* The rule to the NEXT dot, drawn from this one. Behind the dot,
                and absent on the last step, which has nothing to join. */}
            {i < steps.length - 1 && (
              <Box
                aria-hidden="true"
                className={cn('absolute', i < currentStep ? 'bg-foreground' : 'bg-muted')}
                style={{
                  height: 2,
                  top: `calc(${dot} / 2 - 1px)`,
                  left: '50%',
                  right: '-50%',
                }}
              />
            )}
            <Box
              aria-hidden="true"
              className={cn('rounded-full relative', done ? 'bg-foreground' : 'bg-muted')}
              style={{ width: dot, height: dot }}
            />
            <Box tag="span" className={done ? 'text-foreground' : 'text-muted-foreground'}>
              {name}
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}
