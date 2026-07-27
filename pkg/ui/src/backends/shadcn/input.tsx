'use client'

import { EyeIcon, EyeOffIcon } from 'lucide-react'
import * as React from 'react'

import { cn } from './utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Optional leading affordance (icon/text) rendered inside the field. */
  startAdornment?: React.ReactNode
  /** Optional trailing affordance rendered inside the field. */
  endAdornment?: React.ReactNode
  /** Suppress the built-in show/hide control for `type="password"`. */
  hidePasswordToggle?: boolean
}

/**
 * Input — canonical shadcn field on STANDARD tokens (`border-input`,
 * `bg-transparent`, `ring-ring`, `text-foreground`, `placeholder:text-muted-foreground`).
 *
 * The previous implementation hard-coded a floating-label look with app-private
 * tokens (`bg-bg-secondary`, `border-border-input`, `text-text-default`, `h-input`)
 * that were undefined in consumers, so plain `<Input placeholder="…">` rendered
 * transparent/broken. This renders solid everywhere. A bare input is emitted when
 * no adornment/password affordance is requested (the common path); adornments and
 * the password toggle add a relative wrapper only when actually used.
 */
const BASE =
  'flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-sm text-foreground shadow-xs transition-colors outline-none file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20'

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, startAdornment, endAdornment, hidePasswordToggle, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const isPassword = type === 'password'
    const showToggle = isPassword && !hidePasswordToggle
    const inputType = isPassword && showPassword ? 'text' : type

    const field = (
      <input
        ref={ref}
        data-slot="input"
        type={inputType}
        spellCheck={false}
        className={cn(
          BASE,
          startAdornment && 'pl-9',
          (endAdornment || showToggle) && 'pr-9',
          className,
        )}
        {...props}
      />
    )

    if (!startAdornment && !endAdornment && !showToggle) return field

    return (
      <div className="relative w-full">
        {startAdornment ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground [&_svg]:size-4">
            {startAdornment}
          </span>
        ) : null}
        {field}
        {endAdornment && !showToggle ? (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground [&_svg]:size-4">
            {endAdornment}
          </span>
        ) : null}
        {showToggle ? (
          <button
            type="button"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? (
              <EyeOffIcon aria-hidden className="size-4" />
            ) : (
              <EyeIcon aria-hidden className="size-4" />
            )}
          </button>
        ) : null}
      </div>
    )
  },
)
Input.displayName = 'Input'

export { Input }
