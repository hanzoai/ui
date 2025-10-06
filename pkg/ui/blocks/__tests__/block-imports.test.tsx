/**
 * Block Import Validation Tests
 * Tests that all migrated blocks can be imported without errors
 */

import { describe, it, expect } from '@jest/globals'

describe('Dashboard Blocks', () => {
  it('should import dashboard-01 page', async () => {
    const module = await import('../dashboard/dashboard-01/page')
    expect(module.default).toBeDefined()
  })

  it('should import dashboard-01 components', async () => {
    const components = await import('../dashboard/dashboard-01/components')
    expect(components).toBeDefined()
  })
})

describe('Sidebar Blocks', () => {
  const sidebarVariants = Array.from({ length: 16 }, (_, i) => i + 1)

  sidebarVariants.forEach((num) => {
    const variant = String(num).padStart(2, '0')

    it(`should import sidebar-${variant} page`, async () => {
      const module = await import(`../sidebar/sidebar-${variant}/page`)
      expect(module.default).toBeDefined()
    })

    it(`should import sidebar-${variant} components`, async () => {
      const components = await import(`../sidebar/sidebar-${variant}/components`)
      expect(components).toBeDefined()
    })
  })
})

describe('Calendar Blocks', () => {
  const calendarVariants = Array.from({ length: 32 }, (_, i) => i + 1)

  calendarVariants.forEach((num) => {
    const variant = String(num).padStart(2, '0')

    it(`should import calendar-${variant}`, async () => {
      const module = await import(`../calendar/calendar-${variant}`)
      expect(module.default).toBeDefined()
    })
  })
})

describe('Auth Blocks', () => {
  describe('Login', () => {
    it('should import login page', async () => {
      const module = await import('../auth/login/page')
      expect(module.default).toBeDefined()
    })

    it('should import login components', async () => {
      const components = await import('../auth/login/components')
      expect(components).toBeDefined()
    })
  })

  describe('Signup', () => {
    it('should import signup page', async () => {
      const module = await import('../auth/signup/page')
      expect(module.default).toBeDefined()
    })

    it('should import signup components', async () => {
      const components = await import('../auth/signup/components')
      expect(components).toBeDefined()
    })
  })

  describe('OTP', () => {
    it('should import otp page', async () => {
      const module = await import('../auth/otp/page')
      expect(module.default).toBeDefined()
    })

    it('should import otp components', async () => {
      const components = await import('../auth/otp/components')
      expect(components).toBeDefined()
    })
  })
})

describe('Block Index Exports', () => {
  it('should export all dashboard blocks', async () => {
    const dashboard = await import('../dashboard')
    expect(dashboard).toBeDefined()
  })

  it('should export all sidebar blocks', async () => {
    const sidebar = await import('../sidebar')
    expect(sidebar).toBeDefined()
  })

  it('should export all calendar blocks', async () => {
    const calendar = await import('../calendar')
    expect(calendar).toBeDefined()
  })

  it('should export all auth blocks', async () => {
    const auth = await import('../auth')
    expect(auth).toBeDefined()
  })
})
