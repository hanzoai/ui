import React, { type PropsWithChildren } from 'react'
import { cn } from '../util'

const c = 'max-w-screen-2xl 2xl:w-[1500px] lg:mx-auto ' + 
  'flex flex-col justify-start items-stretch ' +
  'p-4 md:px-6 lg:px-8 '

const Main: React.FC<PropsWithChildren & { 
  id?: string
  className?: string 
}> = ({
  children,
  className='',
  id
}) => (
  <main id={id ?? 'HZO_UI_MAIN'} className={cn(c, className)}>
    {children}
  </main>
)

export default Main
