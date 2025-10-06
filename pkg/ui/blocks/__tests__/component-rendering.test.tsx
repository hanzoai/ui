/**
 * Component Rendering Tests
 * Tests that blocks render without errors
 */

import { describe, it, expect } from '@jest/globals'
import React from 'react'

describe('Dashboard Rendering', () => {
  it('should render dashboard-01 page', async () => {
    const { default: Dashboard } = await import('../dashboard/dashboard-01/page')
    const { container } = render(<Dashboard />)
    expect(container).toBeTruthy()
  })
})

describe('Calendar Rendering', () => {
  it('should render calendar-01', async () => {
    const { default: Calendar } = await import('../calendar/calendar-01')
    const { container } = render(<Calendar />)
    expect(container).toBeTruthy()
  })

  it('should render calendar-15 (basic variant)', async () => {
    const { default: Calendar } = await import('../calendar/calendar-15')
    const { container } = render(<Calendar />)
    expect(container).toBeTruthy()
  })

  it('should render calendar-20 (interactive)', async () => {
    const { default: Calendar } = await import('../calendar/calendar-20')
    const { container } = render(<Calendar />)
    expect(container).toBeTruthy()
  })
})

describe('Auth Rendering', () => {
  it('should render login page', async () => {
    const { default: Login } = await import('../auth/login/page')
    const { container } = render(<Login />)
    expect(container).toBeTruthy()
  })

  it('should render signup page', async () => {
    const { default: Signup } = await import('../auth/signup/page')
    const { container } = render(<Signup />)
    expect(container).toBeTruthy()
  })

  it('should render otp page', async () => {
    const { default: OTP } = await import('../auth/otp/page')
    const { container } = render(<OTP />)
    expect(container).toBeTruthy()
  })
})

describe('Sidebar Rendering', () => {
  it('should render sidebar-01', async () => {
    const { default: Sidebar } = await import('../sidebar/sidebar-01/page')
    const { container } = render(<Sidebar />)
    expect(container).toBeTruthy()
  })

  it('should render sidebar-07 (collapsible)', async () => {
    const { default: Sidebar } = await import('../sidebar/sidebar-07/page')
    const { container } = render(<Sidebar />)
    expect(container).toBeTruthy()
  })

  it('should render sidebar-16 (latest)', async () => {
    const { default: Sidebar } = await import('../sidebar/sidebar-16/page')
    const { container } = render(<Sidebar />)
    expect(container).toBeTruthy()
  })
})
