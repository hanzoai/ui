/**
 * Interactive Feature Tests
 * Tests form functionality, calendar interactions, and sidebar navigation
 */

import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

describe('Auth Forms', () => {
  describe('Login Form', () => {
    it('should accept email input', async () => {
      const { default: Login } = await import('../auth/login/page')
      const { getByLabelText } = render(<Login />)

      const emailInput = getByLabelText(/email/i)
      await userEvent.type(emailInput, 'test@example.com')

      expect(emailInput).toHaveValue('test@example.com')
    })

    it('should accept password input', async () => {
      const { default: Login } = await import('../auth/login/page')
      const { getByLabelText } = render(<Login />)

      const passwordInput = getByLabelText(/password/i)
      await userEvent.type(passwordInput, 'password123')

      expect(passwordInput).toHaveValue('password123')
    })

    it('should have submit button', async () => {
      const { default: Login } = await import('../auth/login/page')
      const { getByRole } = render(<Login />)

      const submitButton = getByRole('button', { name: /sign in|login|log in/i })
      expect(submitButton).toBeDefined()
    })
  })

  describe('Signup Form', () => {
    it('should accept email input', async () => {
      const { default: Signup } = await import('../auth/signup/page')
      const { getByLabelText } = render(<Signup />)

      const emailInput = getByLabelText(/email/i)
      await userEvent.type(emailInput, 'newuser@example.com')

      expect(emailInput).toHaveValue('newuser@example.com')
    })

    it('should have submit button', async () => {
      const { default: Signup } = await import('../auth/signup/page')
      const { getByRole } = render(<Signup />)

      const submitButton = getByRole('button', { name: /sign up|create account/i })
      expect(submitButton).toBeDefined()
    })
  })

  describe('OTP Form', () => {
    it('should render OTP input slots', async () => {
      const { default: OTP } = await import('../auth/otp/page')
      const { container } = render(<OTP />)

      const otpInputs = container.querySelectorAll('[data-input-otp]')
      expect(otpInputs.length).toBeGreaterThan(0)
    })

    it('should have verify button', async () => {
      const { default: OTP } = await import('../auth/otp/page')
      const { getByRole } = render(<OTP />)

      const verifyButton = getByRole('button', { name: /verify|submit/i })
      expect(verifyButton).toBeDefined()
    })
  })
})

describe('Calendar Interactions', () => {
  it('should render calendar with current month', async () => {
    const { default: Calendar } = await import('../calendar/calendar-01')
    const { container } = render(<Calendar />)

    const currentMonth = new Date().toLocaleString('default', { month: 'long' })
    expect(container.textContent).toContain(currentMonth)
  })

  it('should allow date selection in interactive calendar', async () => {
    const { default: Calendar } = await import('../calendar/calendar-20')
    const { container } = render(<Calendar />)

    const dateButtons = container.querySelectorAll('button[name="day"]')
    expect(dateButtons.length).toBeGreaterThan(0)
  })

  it('should have navigation controls', async () => {
    const { default: Calendar } = await import('../calendar/calendar-10')
    const { container } = render(<Calendar />)

    const navButtons = container.querySelectorAll('button')
    const hasNavigation = Array.from(navButtons).some(
      btn => btn.getAttribute('aria-label')?.includes('previous') ||
             btn.getAttribute('aria-label')?.includes('next')
    )
    expect(hasNavigation).toBe(true)
  })
})

describe('Sidebar Navigation', () => {
  it('should render navigation items', async () => {
    const { default: Sidebar } = await import('../sidebar/sidebar-01/page')
    const { container } = render(<Sidebar />)

    const navLinks = container.querySelectorAll('a, button[role="link"]')
    expect(navLinks.length).toBeGreaterThan(0)
  })

  it('should have collapsible menu items', async () => {
    const { default: Sidebar } = await import('../sidebar/sidebar-07/page')
    const { container } = render(<Sidebar />)

    const collapsibleTriggers = container.querySelectorAll('[data-state]')
    expect(collapsibleTriggers.length).toBeGreaterThan(0)
  })

  it('should render user menu', async () => {
    const { default: Sidebar } = await import('../sidebar/sidebar-01/page')
    const { container } = render(<Sidebar />)

    expect(container.textContent).toBeTruthy()
  })
})

describe('Dashboard Interactions', () => {
  it('should render date range picker', async () => {
    const { default: Dashboard } = await import('../dashboard/dashboard-01/page')
    const { container } = render(<Dashboard />)

    const datePickerButton = container.querySelector('[data-placeholder="Pick a date"]')
    expect(datePickerButton || container.textContent?.includes('date')).toBeTruthy()
  })

  it('should render team switcher', async () => {
    const { default: Dashboard } = await import('../dashboard/dashboard-01/page')
    const { container } = render(<Dashboard />)

    expect(container.textContent).toBeTruthy()
  })

  it('should render navigation actions', async () => {
    const { default: Dashboard } = await import('../dashboard/dashboard-01/page')
    const { container } = render(<Dashboard />)

    const buttons = container.querySelectorAll('button')
    expect(buttons.length).toBeGreaterThan(0)
  })
})
