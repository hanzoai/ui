// @ts-nocheck 
'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
 
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input
} from '@hanzo/ui/primitives'

import { cn } from '@hanzo/ui/util'
 
const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(2, 'Password must be at least 2 characters'),
})
 
const EmailPasswordForm: React.FC<{
  onSubmit: (email: string, password: string) => void 
  isLoading: boolean
  className?: string
}> = ({
  onSubmit, 
  isLoading, 
  className
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(({email, password}) => onSubmit(email, password))} className={cn('text-left', className)}>
        <FormField
          
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem className='space-y-1'>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem  className='space-y-1'>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type='password' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type='submit' className='w-full' disabled={isLoading}>Login</Button>
      </form>
    </Form>
  )
}

export default EmailPasswordForm