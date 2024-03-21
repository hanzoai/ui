import { LockKeyhole } from 'lucide-react'
import Amex from './amex'
import Discover from './discover'
import Mastercard from './mastercard'
import Visa from './visa'
import DinersClub from './diners-club'
import Jcb from './jcb'

const PaymentMethods: React.FC = () => {
  return (
    <div className='flex gap-1 items-center text-muted-1'>
      <LockKeyhole className='w-4 h-4'/>
      <span className='hidden sm:flex text-sm'>Secure payments with</span>
      <Amex className='w-9 h-5'/>
      <Discover className='w-9 h-5'/>
      <Mastercard className='w-9 h-5'/>
      <Visa className='w-9 h-5'/>
      <DinersClub className='w-9 h-5'/>
      <Jcb className='w-9 h-5'/>
    </div>
  )
}

export default PaymentMethods
