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
  FormLabel,
  FormMessage,
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@hanzo/ui/primitives'

import { useAuth } from '@hanzo/auth/service'

import { useCommerce } from '../..'

import { countries } from './countries'

const shippingFormSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters.'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters.'),
  addressLine1: z.string().min(2, 'Address must be at least 2 characters.'),
  addressLine2: z.string().optional(),
  zipCode: z.string().min(2, 'Zip code is invalid.'),
  city: z.string().min(2, 'City is invalid.'),
  state: z.string().optional(),
  country: z.string().min(2, 'Country is invalid.'),
})

const ShippingInfo: React.FC<{
  orderId?: string,
  setCurrentStep: (currentStep: number) => void
}> = ({
  orderId,
  setCurrentStep
}) => { 
  const auth = useAuth()
  const cmmc = useCommerce()
  
  const shippingForm = useForm<z.infer<typeof shippingFormSchema>>({
    resolver: zodResolver(shippingFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      addressLine1: '',
      addressLine2: '',
      zipCode: '',
      city: '',
      state: '',
      country: '',
    },
  })

  const onSubmit = async (values: z.infer<typeof shippingFormSchema>) => {
    if (auth.user && orderId) {
      await cmmc.updateOrderShippingInfo(orderId, values)
    }
    setCurrentStep(3)
  }

  return (
    <Form {...shippingForm}>
      <form onSubmit={shippingForm.handleSubmit(onSubmit)} className='text-left'>
        <div className='flex flex-col gap-4'>
          <div className='flex gap-4 items-end'>
            <FormField
              control={shippingForm.control}
              name='firstName'
              render={({ field }) => (
                <FormItem className='space-y-1 w-full'>
                  <FormLabel>First name</FormLabel>
                  <FormControl>
                    <Input {...field} className='border-muted-4'/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={shippingForm.control}
              name='lastName'
              render={({ field }) => (
                <FormItem className='space-y-1 w-full'>
                  <FormLabel>Last name</FormLabel>
                  <FormControl>
                    <Input {...field} className='border-muted-4'/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className='flex gap-4 items-end'>
            <FormField
              control={shippingForm.control}
              name='addressLine1'
              render={({ field }) => (
                <FormItem className='space-y-1 w-full'>
                  <FormLabel>Address line 1</FormLabel>
                  <FormControl>
                    <Input {...field} className='border-muted-4'/>
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
                  <FormLabel>Address line 2 (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} className='border-muted-4'/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className='flex gap-4 items-end'>
            <FormField
              control={shippingForm.control}
              name='zipCode'
              render={({ field }) => (
                <FormItem className='space-y-1 w-full'>
                  <FormLabel>Zip code</FormLabel>
                  <FormControl>
                    <Input {...field} className='border-muted-4'/>
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
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input {...field} className='border-muted-4'/>
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
                  <FormLabel>State (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} className='border-muted-4'/>
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
                  <FormLabel>Country</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select a country' />
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

export default ShippingInfo