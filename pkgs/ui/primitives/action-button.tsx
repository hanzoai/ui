'use client'
import React from 'react'

import { cn, type VariantProps } from '../util'

import type { ButtonDef, ButtonModalDef } from '../types'
import type { buttonVariants } from './button'
import DVC from './dialog-video-controller'

const ActionButton: React.FC<
  VariantProps<typeof buttonVariants> &
  {
    def: ButtonDef
    className?: string
  }
> = ({
  def,
  className='',
  ...rest
}) => {
  if (def.action.type === 'modal') {
    const m = def.action.def as ButtonModalDef
    const Modal = m.Comp
    return (
      <DVC>
        <Modal 
          title={m.title}
          byline={m.byline}
          buttonText={def.text}
          buttonProps={{...def.props, ...rest, className: cn((def.props?.className ?? ''), className)}}
          action={m.action}
          actionEnclosure={m.actionEnclosure}
          {...m.props}
        />
      </DVC>
    )
  }
    // no other types supported yet
  return <></>
}

export default ActionButton
