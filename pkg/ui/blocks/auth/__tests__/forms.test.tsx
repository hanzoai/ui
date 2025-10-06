/**
 * Comprehensive Auth Form Validation Tests
 * Tests all auth forms: login (5 variants), signup (5 variants), OTP (5 variants)
 *
 * Test Coverage:
 * - Form submission with valid data
 * - Field validation (email, password, OTP)
 * - User interactions (typing, clicking)
 * - Password matching for signup forms
 * - OTP input handling (6-digit code)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock console.log to verify form submissions
let consoleLogSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
  consoleLogSpy.mockRestore()
})

describe('Auth Forms - Comprehensive Validation', () => {
  describe('Login Forms (5 variants)', () => {
    it('login-01: submits form data correctly', async () => {
      const { LoginForm } = await import('../login/login-01/components/login-form')
      const user = userEvent.setup()

      render(<LoginForm />)

      // Find and fill email field
      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, 'test@example.com')

      // Find and fill password field
      const passwordInput = screen.getByLabelText(/^password$/i)
      await user.type(passwordInput, 'password123')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /^login$/i })
      await user.click(submitButton)

      // Verify handleSubmit was called with correct data
      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith(
          'Form submitted:',
          expect.objectContaining({
            email: 'test@example.com',
            password: 'password123'
          })
        )
      })
    })

    it('login-01: validates required email field', async () => {
      const { LoginForm } = await import('../login/login-01/components/login-form')
      const user = userEvent.setup()

      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement
      expect(emailInput).toHaveAttribute('required')
      expect(emailInput).toHaveAttribute('type', 'email')
    })

    it('login-01: validates required password field', async () => {
      const { LoginForm } = await import('../login/login-01/components/login-form')

      render(<LoginForm />)

      const passwordInput = screen.getByLabelText(/^password$/i) as HTMLInputElement
      expect(passwordInput).toHaveAttribute('required')
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    it('login-02: submits form data correctly', async () => {
      const { LoginForm } = await import('../login/login-02/components/login-form')
      const user = userEvent.setup()

      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, 'user@test.com')

      const passwordInput = screen.getByLabelText(/^password$/i)
      await user.type(passwordInput, 'securepass456')

      const submitButton = screen.getByRole('button', { name: /^login$/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith(
          'Form submitted:',
          expect.objectContaining({
            email: 'user@test.com',
            password: 'securepass456'
          })
        )
      })
    })

    it('login-03: submits form data correctly', async () => {
      const { LoginForm } = await import('../login/login-03/components/login-form')
      const user = userEvent.setup()

      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, 'admin@example.com')

      const passwordInput = screen.getByLabelText(/^password$/i)
      await user.type(passwordInput, 'admin789')

      const submitButton = screen.getByRole('button', { name: /^login$/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith(
          'Form submitted:',
          expect.objectContaining({
            email: 'admin@example.com',
            password: 'admin789'
          })
        )
      })
    })

    it('login-04: submits form data correctly', async () => {
      const { LoginForm } = await import('../login/login-04/components/login-form')
      const user = userEvent.setup()

      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, 'dev@hanzo.ai')

      const passwordInput = screen.getByLabelText(/^password$/i)
      await user.type(passwordInput, 'developer123')

      const submitButton = screen.getByRole('button', { name: /^login$/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith(
          'Form submitted:',
          expect.objectContaining({
            email: 'dev@hanzo.ai',
            password: 'developer123'
          })
        )
      })
    })

    it('login-05: submits form data correctly (passwordless)', async () => {
      const { LoginForm } = await import('../login/login-05/components/login-form')
      const user = userEvent.setup()

      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, 'tester@hanzo.ai')

      // login-05 is a passwordless/magic link login, so no password field
      const submitButton = screen.getByRole('button', { name: /^login$/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith(
          'Form submitted:',
          expect.objectContaining({
            email: 'tester@hanzo.ai'
          })
        )
      })
    })

    it('login forms 01-04 have email and password fields', async () => {
      const forms = [
        await import('../login/login-01/components/login-form'),
        await import('../login/login-02/components/login-form'),
        await import('../login/login-03/components/login-form'),
        await import('../login/login-04/components/login-form'),
      ]

      for (const { LoginForm } of forms) {
        const { unmount } = render(<LoginForm />)

        expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()

        unmount()
      }
    })

    it('login-05 is passwordless (email only)', async () => {
      const { LoginForm } = await import('../login/login-05/components/login-form')

      render(<LoginForm />)

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.queryByLabelText(/^password$/i)).not.toBeInTheDocument()
    })

    it('all login forms have submit buttons', async () => {
      const forms = [
        await import('../login/login-01/components/login-form'),
        await import('../login/login-02/components/login-form'),
        await import('../login/login-03/components/login-form'),
        await import('../login/login-04/components/login-form'),
        await import('../login/login-05/components/login-form'),
      ]

      for (const { LoginForm } of forms) {
        const { unmount } = render(<LoginForm />)

        expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()

        unmount()
      }
    })
  })

  describe('Signup Forms (5 variants)', () => {
    it('signup-01: submits complete form data', async () => {
      const { SignupForm } = await import('../signup/signup-01/components/signup-form')
      const user = userEvent.setup()

      render(<SignupForm />)

      const nameInput = screen.getByLabelText(/full name/i)
      await user.type(nameInput, 'John Doe')

      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, 'john@example.com')

      const passwordInput = screen.getByLabelText(/^password$/i)
      await user.type(passwordInput, 'password123')

      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      await user.type(confirmPasswordInput, 'password123')

      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith(
          'Form submitted:',
          expect.objectContaining({
            name: 'John Doe',
            email: 'john@example.com',
            password: 'password123',
            'confirm-password': 'password123'
          })
        )
      })
    })

    it('signup-01: validates password length requirement', async () => {
      const { SignupForm } = await import('../signup/signup-01/components/signup-form')

      render(<SignupForm />)

      // Check that password description mentions 8 characters
      expect(screen.getByText(/must be at least 8 characters/i)).toBeInTheDocument()
    })

    it('signup-01: has all required fields', async () => {
      const { SignupForm } = await import('../signup/signup-01/components/signup-form')

      render(<SignupForm />)

      expect(screen.getByLabelText(/full name/i)).toHaveAttribute('required')
      expect(screen.getByLabelText(/email/i)).toHaveAttribute('required')
      expect(screen.getByLabelText(/^password$/i)).toHaveAttribute('required')
      expect(screen.getByLabelText(/confirm password/i)).toHaveAttribute('required')
    })

    it('signup-02: submits complete form data', async () => {
      const { SignupForm } = await import('../signup/signup-02/components/signup-form')
      const user = userEvent.setup()

      render(<SignupForm />)

      const nameInput = screen.getByLabelText(/full name/i)
      await user.type(nameInput, 'Jane Smith')

      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, 'jane@test.com')

      const passwordInput = screen.getByLabelText(/^password$/i)
      await user.type(passwordInput, 'securepass')

      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      await user.type(confirmPasswordInput, 'securepass')

      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalled()
      })
    })

    it('signup-03: submits complete form data', async () => {
      const { SignupForm } = await import('../signup/signup-03/components/signup-form')
      const user = userEvent.setup()

      render(<SignupForm />)

      const nameInput = screen.getByLabelText(/full name/i)
      await user.type(nameInput, 'Bob Wilson')

      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, 'bob@hanzo.ai')

      const passwordInput = screen.getByLabelText(/^password$/i)
      await user.type(passwordInput, 'bobpass123')

      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      await user.type(confirmPasswordInput, 'bobpass123')

      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalled()
      })
    })

    it('signup-04: submits complete form data', async () => {
      const { SignupForm } = await import('../signup/signup-04/components/signup-form')
      const user = userEvent.setup()

      render(<SignupForm />)

      // signup-04 only has email, password, and confirm-password (no name field)
      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, 'alice@example.com')

      const passwordInput = screen.getByLabelText(/^password$/i)
      await user.type(passwordInput, 'alice2024')

      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      await user.type(confirmPasswordInput, 'alice2024')

      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith(
          'Form submitted:',
          expect.objectContaining({
            email: 'alice@example.com',
            password: 'alice2024',
            'confirm-password': 'alice2024'
          })
        )
      })
    })

    it('signup-05: submits complete form data (passwordless)', async () => {
      const { SignupForm } = await import('../signup/signup-05/components/signup-form')
      const user = userEvent.setup()

      render(<SignupForm />)

      // signup-05 is email-only (passwordless/magic link signup)
      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, 'charlie@hanzo.ai')

      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith(
          'Form submitted:',
          expect.objectContaining({
            email: 'charlie@hanzo.ai'
          })
        )
      })
    })

    it('signup forms 01-03 have all fields (name, email, password, confirm)', async () => {
      const forms = [
        await import('../signup/signup-01/components/signup-form'),
        await import('../signup/signup-02/components/signup-form'),
        await import('../signup/signup-03/components/signup-form'),
      ]

      for (const { SignupForm } of forms) {
        const { unmount } = render(<SignupForm />)

        expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()

        unmount()
      }
    })

    it('signup-04 has email, password, and confirm password (no name)', async () => {
      const { SignupForm } = await import('../signup/signup-04/components/signup-form')

      render(<SignupForm />)

      expect(screen.queryByLabelText(/full name/i)).not.toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    })

    it('signup-05 is email-only (passwordless)', async () => {
      const { SignupForm } = await import('../signup/signup-05/components/signup-form')

      render(<SignupForm />)

      expect(screen.queryByLabelText(/full name/i)).not.toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.queryByLabelText(/^password$/i)).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/confirm password/i)).not.toBeInTheDocument()
    })

    it('all signup forms have create account buttons', async () => {
      const forms = [
        await import('../signup/signup-01/components/signup-form'),
        await import('../signup/signup-02/components/signup-form'),
        await import('../signup/signup-03/components/signup-form'),
        await import('../signup/signup-04/components/signup-form'),
        await import('../signup/signup-05/components/signup-form'),
      ]

      for (const { SignupForm } of forms) {
        const { unmount } = render(<SignupForm />)

        expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()

        unmount()
      }
    })
  })

  describe('OTP Forms (5 variants)', () => {
    it('otp-01: submits 6-digit OTP correctly', async () => {
      const { OTPForm } = await import('../otp/otp-01/components/otp-form')
      const user = userEvent.setup()

      render(<OTPForm />)

      // OTP uses InputOTP component with individual slots
      // Find the OTP input container
      const otpInput = screen.getByLabelText(/verification code/i)

      // Type the 6-digit code
      await user.type(otpInput, '123456')

      const submitButton = screen.getByRole('button', { name: /verify/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith(
          'Form submitted:',
          expect.objectContaining({
            otp: '123456'
          })
        )
      })
    })

    it('otp-01: validates OTP field is required', async () => {
      const { OTPForm } = await import('../otp/otp-01/components/otp-form')

      render(<OTPForm />)

      const otpInput = screen.getByLabelText(/verification code/i)
      expect(otpInput).toHaveAttribute('required')
    })

    it('otp-01: has description about 6-digit code', async () => {
      const { OTPForm } = await import('../otp/otp-01/components/otp-form')

      render(<OTPForm />)

      expect(screen.getByText(/enter the 6-digit code/i)).toBeInTheDocument()
    })

    it('otp-02: submits 6-digit OTP correctly', async () => {
      const { OTPForm } = await import('../otp/otp-02/components/otp-form')
      const user = userEvent.setup()

      render(<OTPForm />)

      const otpInput = screen.getByLabelText(/verification code/i)
      await user.type(otpInput, '654321')

      const submitButton = screen.getByRole('button', { name: /verify/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalled()
      })
    })

    it('otp-03: submits 6-digit OTP correctly', async () => {
      const { OTPForm } = await import('../otp/otp-03/components/otp-form')
      const user = userEvent.setup()

      render(<OTPForm />)

      const otpInput = screen.getByLabelText(/verification code/i)
      await user.type(otpInput, '789012')

      const submitButton = screen.getByRole('button', { name: /verify/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalled()
      })
    })

    it('otp-04: submits 6-digit OTP correctly', async () => {
      const { OTPForm } = await import('../otp/otp-04/components/otp-form')
      const user = userEvent.setup()

      render(<OTPForm />)

      const otpInput = screen.getByLabelText(/verification code/i)
      await user.type(otpInput, '345678')

      const submitButton = screen.getByRole('button', { name: /verify/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalled()
      })
    })

    it('otp-05: submits 6-digit OTP correctly', async () => {
      const { OTPForm } = await import('../otp/otp-05/components/otp-form')
      const user = userEvent.setup()

      render(<OTPForm />)

      const otpInput = screen.getByLabelText(/verification code/i)
      await user.type(otpInput, '901234')

      const submitButton = screen.getByRole('button', { name: /verify/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalled()
      })
    })

    it('all OTP forms have verification code input', async () => {
      const forms = [
        await import('../otp/otp-01/components/otp-form'),
        await import('../otp/otp-02/components/otp-form'),
        await import('../otp/otp-03/components/otp-form'),
        await import('../otp/otp-04/components/otp-form'),
        await import('../otp/otp-05/components/otp-form'),
      ]

      for (const { OTPForm } of forms) {
        const { unmount } = render(<OTPForm />)

        expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument()

        unmount()
      }
    })

    it('all OTP forms have verify buttons', async () => {
      const forms = [
        await import('../otp/otp-01/components/otp-form'),
        await import('../otp/otp-02/components/otp-form'),
        await import('../otp/otp-03/components/otp-form'),
        await import('../otp/otp-04/components/otp-form'),
        await import('../otp/otp-05/components/otp-form'),
      ]

      for (const { OTPForm } of forms) {
        const { unmount } = render(<OTPForm />)

        expect(screen.getByRole('button', { name: /verify/i })).toBeInTheDocument()

        unmount()
      }
    })
  })

  describe('Form Interaction Tests', () => {
    it('login form: clears input after typing and clearing', async () => {
      const { LoginForm } = await import('../login/login-01/components/login-form')
      const user = userEvent.setup()

      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement
      await user.type(emailInput, 'test@example.com')
      expect(emailInput.value).toBe('test@example.com')

      await user.clear(emailInput)
      expect(emailInput.value).toBe('')
    })

    it('signup form: handles multiple field updates', async () => {
      const { SignupForm } = await import('../signup/signup-01/components/signup-form')
      const user = userEvent.setup()

      render(<SignupForm />)

      const nameInput = screen.getByLabelText(/full name/i) as HTMLInputElement
      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement

      await user.type(nameInput, 'Test User')
      await user.type(emailInput, 'test@example.com')

      expect(nameInput.value).toBe('Test User')
      expect(emailInput.value).toBe('test@example.com')
    })

    it('OTP form: accepts numeric input only', async () => {
      const { OTPForm } = await import('../otp/otp-01/components/otp-form')
      const user = userEvent.setup()

      render(<OTPForm />)

      const otpInput = screen.getByLabelText(/verification code/i)

      // Type only numbers
      await user.type(otpInput, '123456')

      // Should have accepted the numeric input
      expect(otpInput).toHaveValue('123456')
    })
  })

  describe('Console Log Verification', () => {
    it('verifies console.log is called on form submission', async () => {
      const { LoginForm } = await import('../login/login-01/components/login-form')
      const user = userEvent.setup()

      render(<LoginForm />)

      await user.type(screen.getByLabelText(/email/i), 'verify@test.com')
      await user.type(screen.getByLabelText(/^password$/i), 'verify123')
      await user.click(screen.getByRole('button', { name: /^login$/i }))

      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalled()
        expect(consoleLogSpy.mock.calls[0][0]).toBe('Form submitted:')
      })
    })

    it('verifies form data structure in console.log', async () => {
      const { SignupForm } = await import('../signup/signup-01/components/signup-form')
      const user = userEvent.setup()

      render(<SignupForm />)

      await user.type(screen.getByLabelText(/full name/i), 'Data Test')
      await user.type(screen.getByLabelText(/email/i), 'data@test.com')
      await user.type(screen.getByLabelText(/^password$/i), 'data123')
      await user.type(screen.getByLabelText(/confirm password/i), 'data123')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        const loggedData = consoleLogSpy.mock.calls[0][1]
        expect(loggedData).toHaveProperty('name')
        expect(loggedData).toHaveProperty('email')
        expect(loggedData).toHaveProperty('password')
      })
    })
  })
})
