import React from 'react'
import Link from 'next/link'

import { ApplyTypography } from '@hanzo/ui/primitives'

import type { StepComponentProps } from './types'

const ThankYou: React.FC<StepComponentProps> = ({}) =>  (
  <ApplyTypography className='flex flex-col gap-4 text-center mt-10'>
    <h3>Thank you for your order!</h3>
    <h6>Once your payment has been confirmed we will send additional information to your email.</h6>
    <p>
      While you wait, we cordially invite you to join the <Link href='https://warpcast.com/~/channel/lux'>Lux Channel</Link> on <Link href='https://warpcast.com/~/invite-page/227706?id=fbc9ca91'>Warpcast</Link>.
    </p>
  </ApplyTypography>
)

export default ThankYou
