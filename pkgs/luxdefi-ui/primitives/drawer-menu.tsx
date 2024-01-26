'use client'
import React, { type ComponentType, type ForwardRefExoticComponent, type PropsWithChildren, type ReactNode } from 'react'

import { Sheet, SheetContent, SheetTrigger } from './sheet'
import type { LucideProps, LucideIcon } from 'lucide-react'

const DrawerMenu: React.FC<PropsWithChildren & {
  triggerIcon: ReactNode
  className?: string
}> = ({
  triggerIcon,
  children,
  className=''
}) => {

  const [open, setOpen] = React.useState(false)

  const onAction = () => { setOpen(false) }

    // https://stackoverflow.com/a/49052730/11645689
  const updatedChildren = React.Children.map(
    children,
    (child) => (React.cloneElement(
      child as any, { onAction }
    ))
  )

  return (
    <Sheet open={open} onOpenChange={setOpen} >
      <SheetTrigger>
        {triggerIcon}
      </SheetTrigger>
      <SheetContent side="right" className={className} closeButtonClass='text-inherit opacity-90' onClick={onAction}>
        {updatedChildren}
      </SheetContent>
    </Sheet>
  )
}

export default DrawerMenu
