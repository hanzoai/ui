'use client'

import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { 
  Input, 
  Button, 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@hanzo/ui/primitives'

import { useCommerce } from '../../service/context'

import countries from '../../util/countries'
import { sendGAEvent } from '../../util/analytics'

import type { CheckoutStepComponentProps } from '../../types'

const shippingFormSchema = z.object({
  addressLine1: z.string().min(2, 'Address must be at least 2 characters.'),
  addressLine2: z.string().optional(),
  zipCode: z.string().min(2, 'Zip code is invalid.'),
  city: z.string().min(2, 'City is invalid.'),
  state: z.string().optional(),
  country: z.string().min(2, 'Country is invalid.'),
})

const ShippingStepForm: React.FC<CheckoutStepComponentProps> = ({
  orderId,
  onDone
}) => { 
  const cmmc = useCommerce()
  
  const shippingForm = useForm<z.infer<typeof shippingFormSchema>>({
    resolver: zodResolver(shippingFormSchema),
    defaultValues: {
      addressLine1: '',
      addressLine2: '',
      zipCode: '',
      city: '',
      state: '',
      country: '',
    },
  })

  const onSubmit = async (values: z.infer<typeof shippingFormSchema>) => {
    if (orderId) {
      await cmmc.updateOrderShippingInfo(orderId, values)
    }
    sendGAEvent('add_shipping_info', {
      items: cmmc.cartItems.map((item) => ({
        item_id: item.sku,
        item_name: item.title,
        item_category: item.familyId,
        price: item.price,
        quantity: item.quantity
      })),
      num_items: cmmc.cartItems.length,
      value: cmmc.cartTotal,
      currency: 'USD',
    })
    onDone()
  }

  return (
    <Form {...shippingForm}>
      <form onSubmit={shippingForm.handleSubmit(onSubmit)} className='text-left'>
        <div className='flex flex-col gap-4'>
          <FormField
            control={shippingForm.control}
            name='addressLine1'
            render={({ field }) => (
              <FormItem className='space-y-1 w-full'>
                <FormControl>
                  <Input {...field} placeholder='Address line 1'/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={shippingForm.control}
            name='addressLine2'
            render={({ field }) => (
              <FormItem className='space-y-1 w-full'>
                <FormControl>
                  <Input {...field} placeholder='Address line 2 (optional)'/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className='flex gap-4 items-end'>
            <FormField
              control={shippingForm.control}
              name='zipCode'
              render={({ field }) => (
                <FormItem className='space-y-1 w-full'>
                  <FormControl>
                    <Input {...field} placeholder='Zip code'/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={shippingForm.control}
              name='city'
              render={({ field }) => (
                <FormItem className='space-y-1 w-full'>
                  <FormControl>
                    <Input {...field} placeholder='City'/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className='flex gap-4 items-start'>
            <FormField
              control={shippingForm.control}
              name='state'
              render={({ field }) => (
                <FormItem className='space-y-1 w-full'>
                  <FormControl>
                    <Input {...field} placeholder='State (optional)'/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={shippingForm.control}
              name='country'
              render={({ field }) => (
                <FormItem className='space-y-1 w-full'>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className='bg-level-1 border-muted-4'>
                        <SelectValue placeholder='Country' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.id} value={country.name}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>
        </div>
        <Button type='submit' className='mx-auto w-full mt-4'>Confirm order</Button>
      </form>
    </Form>
  )
}

export default ShippingStepForm
