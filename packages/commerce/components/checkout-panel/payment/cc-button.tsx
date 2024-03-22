import { Button } from '@hanzo/ui/primitives'

import PaymentMethods from './payment-methods'
import type { PropsWithChildren } from 'react'

const CCButton: React.FC<PropsWithChildren> = ({
  children
}) => (
  <Button variant='outline' size='lg' className='flex items-center' >
    <div className='font-sans text-base mr-2 text-muted'>CC</div>
    <PaymentMethods />
    {children}
  </Button>
)


export default CCButton