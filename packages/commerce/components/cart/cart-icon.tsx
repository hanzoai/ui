import React from 'react'
import { type LucideProps } from 'lucide-react'

const CartIcon: React.FC<LucideProps> = (props: LucideProps) => (
<svg viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg' {...props}>
  <path d='m3.731 8-1.231 20h27l-1.231-20zm1.991 2.103h20.557l.972 15.794h-22.502l.972-15.794z'/>
  <path d='m20.718 8.134c0-2.375-1.932-4.307-4.307-4.307s-4.307 1.932-4.307 4.307h-2.084c0-3.524 2.867-6.391 6.391-6.391s6.391 2.867 6.391 6.391z'/>
</svg>)

export default CartIcon
