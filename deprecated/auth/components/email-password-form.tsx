// @ts-nocheck 
'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
 
import {
  Button,
  Input
} from '@hanzo/ui/primitives'

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@hanzo/ui/form'

import { cn } from '@hanzo/ui/util'
 
const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(2, 'Password must be at least 2 characters'),
})
 
const EmailPasswordForm: React.FC<{
  onSubmit: (email: string, password: string) => void 
  isLoading: boolean
  className?: string
  inputClx?: string
  prompt?: string
}> = ({
  onSubmit, 
  isLoading, 
  className,
  inputClx,
  prompt='Login'
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
      <form
        onSubmit={form.handleSubmit(({email, password}) => onSubmit(email, password))}
        className={cn('text-left', className)}
      >
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem className='space-y-1'>
              <FormControl>
                <Input
                  {...field}
                  className={inputClx}
                  placeholder='Email'
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem className='space-y-1'>
              <FormControl>
                <Input
                  type='password'
                  {...field}
                  className={inputClx}
                  placeholder='Password'
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type='submit' className='w-full' disabled={isLoading}>{prompt}</Button>
      </form>
    </Form>
  )
}

export default EmailPasswordForm