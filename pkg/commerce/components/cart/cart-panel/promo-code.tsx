'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { observer } from 'mobx-react-lite'

import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check } from 'lucide-react'

import { 
  Button, 
  Input 
} from '@hanzo/ui/primitives'

import {
  Form,
  FormControl,
  FormField,
  FormItem,
} from '@hanzo/ui/form'

import { useCommerce } from '../../../service/context'
import type { Promo } from '../../../types'
import getPromoFromApi from '../../../util/promo-codes'

const formSchema = z.object({
  code: z.string().min(1, 'Invalid code'),
})

const PromoCode = observer(() => {
  const cmmc = useCommerce()
  const searchParams = useSearchParams()

  const [codeAccepted, setCodeAccepted] = useState<boolean>(false)

  useEffect(() => {
    const code = searchParams.get('code')
    if (code) {
      getPromoFromApi(code).then((promo?: Promo) => {
        if (promo) {
          form.setValue('code', code)
          setCodeAccepted(true)
          cmmc.setAppliedPromo(promo)
        }
      })
    }
  }, [searchParams])

  useEffect(() => {
    if (cmmc.appliedPromo) {
      form.setValue('code', cmmc.appliedPromo.code)
      setCodeAccepted(true)
    }
  }, [cmmc.appliedPromo])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema as any),
    defaultValues: {
      code: '',
    },
  })

  const applyPromoCode = async (values: z.infer<typeof formSchema>) => {
    const { code } = values
    const promo = await getPromoFromApi(code)
    if (!promo) {
      form.setError('code', { message: 'Invalid code' })
      return
    }
    setCodeAccepted(true)
    cmmc.setAppliedPromo(promo)
  }

  const removePromoCode = () => {
    cmmc.setAppliedPromo(null)
    setCodeAccepted(false)
  }

  return (
    <div className='flex flex-col gap-2 border-t py-1'>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(applyPromoCode)}>
          <div className='flex gap-2 items-center'>
            <FormField
              control={form.control}
              name='code'
              render={({ field }) => (
                <FormItem className='w-full'>
                  <FormControl>
                    <Input {...field} className='h-9' placeholder='Discount or invite code' onInput={removePromoCode}/>
                  </FormControl>
                </FormItem>
              )}
            />
            {codeAccepted ? (
              <Check/>
            ) : (
              <Button variant='outline' className='!w-fit !min-w-0 font-inter text-muted text-sm'>Apply</Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
})

export default PromoCode
