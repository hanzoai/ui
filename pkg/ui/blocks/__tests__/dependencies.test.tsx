/**
 * Dependency Resolution Tests
 * Tests that all primitive dependencies are resolved correctly
 */

import { describe, it, expect } from 'vitest'

describe('Primitive Dependencies', () => {
  it('should resolve Button primitive', async () => {
    const { Button } = await import('../../primitives/button')
    expect(Button).toBeDefined()
  })

  it('should resolve Card primitives', async () => {
    const { Card, CardHeader, CardContent, CardFooter } = await import('../../primitives/card')
    expect(Card).toBeDefined()
    expect(CardHeader).toBeDefined()
    expect(CardContent).toBeDefined()
    expect(CardFooter).toBeDefined()
  })

  it('should resolve Input primitive', async () => {
    const { Input } = await import('../../primitives/input')
    expect(Input).toBeDefined()
  })

  it('should resolve Label primitive', async () => {
    const { Label } = await import('../../primitives/label')
    expect(Label).toBeDefined()
  })

  it('should resolve Calendar primitive', async () => {
    const { Calendar } = await import('../../primitives/calendar')
    expect(Calendar).toBeDefined()
  })

  it('should resolve Select primitives', async () => {
    const { Select, SelectTrigger, SelectContent, SelectItem } = await import('../../primitives/select')
    expect(Select).toBeDefined()
    expect(SelectTrigger).toBeDefined()
    expect(SelectContent).toBeDefined()
    expect(SelectItem).toBeDefined()
  })

  it('should resolve Sidebar primitives', async () => {
    const {
      Sidebar,
      SidebarContent,
      SidebarGroup,
      SidebarProvider
    } = await import('../../primitives/sidebar')
    expect(Sidebar).toBeDefined()
    expect(SidebarContent).toBeDefined()
    expect(SidebarGroup).toBeDefined()
    expect(SidebarProvider).toBeDefined()
  })

  it('should resolve Form primitives', async () => {
    const { Form, FormField, FormItem, FormControl } = await import('../../primitives/form')
    expect(Form).toBeDefined()
    expect(FormField).toBeDefined()
    expect(FormItem).toBeDefined()
    expect(FormControl).toBeDefined()
  })

  it('should resolve Checkbox primitive', async () => {
    const { Checkbox } = await import('../../primitives/checkbox')
    expect(Checkbox).toBeDefined()
  })

  it('should resolve InputOTP primitives', async () => {
    const { InputOTP, InputOTPGroup, InputOTPSlot } = await import('../../primitives/input-otp')
    expect(InputOTP).toBeDefined()
    expect(InputOTPGroup).toBeDefined()
    expect(InputOTPSlot).toBeDefined()
  })
})

describe('Dashboard Component Dependencies', () => {
  it('should import all dashboard-01 components', async () => {
    const components = await import('../dashboard/dashboard-01/components')
    expect(components.AppSidebar).toBeDefined()
    expect(components.DateRangePicker).toBeDefined()
    expect(components.NavActions).toBeDefined()
    expect(components.NavMain).toBeDefined()
    expect(components.NavUser).toBeDefined()
    expect(components.TeamSwitcher).toBeDefined()
  })
})

describe('Auth Component Dependencies', () => {
  it('should import login components', async () => {
    const components = await import('../auth/login/components')
    expect(components.LoginForm).toBeDefined()
  })

  it('should import signup components', async () => {
    const components = await import('../auth/signup/components')
    expect(components.SignupForm).toBeDefined()
  })

  it('should import otp components', async () => {
    const components = await import('../auth/otp/components')
    expect(components.OTPForm).toBeDefined()
  })
})

describe('Sidebar Component Dependencies', () => {
  it('should import sidebar-01 components', async () => {
    const components = await import('../sidebar/sidebar-01/components')
    expect(components.AppSidebar).toBeDefined()
  })

  it('should import sidebar-07 components', async () => {
    const components = await import('../sidebar/sidebar-07/components')
    expect(components.AppSidebar).toBeDefined()
  })
})

describe('External Dependencies', () => {
  it('should resolve react-day-picker', async () => {
    const { DayPicker } = await import('react-day-picker')
    expect(DayPicker).toBeDefined()
  })

  it('should resolve date-fns', async () => {
    const { format, addDays } = await import('date-fns')
    expect(format).toBeDefined()
    expect(addDays).toBeDefined()
  })

  it('should resolve lucide-react', async () => {
    const { ChevronLeft, Calendar } = await import('lucide-react')
    expect(ChevronLeft).toBeDefined()
    expect(Calendar).toBeDefined()
  })

  it('should resolve react-hook-form', async () => {
    const { useForm } = await import('react-hook-form')
    expect(useForm).toBeDefined()
  })

  it('should resolve zod', async () => {
    const { z } = await import('zod')
    expect(z).toBeDefined()
  })
})
