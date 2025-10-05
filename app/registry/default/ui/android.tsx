import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const androidVariants = cva("inline-flex items-center justify-center", {
  variants: {
    size: {
      sm: "h-4 w-4",
      default: "h-6 w-6",
      lg: "h-8 w-8",
      xl: "h-12 w-12",
    },
  },
  defaultVariants: {
    size: "default",
  },
})

export interface AndroidProps
  extends React.SVGAttributes<SVGSVGElement>,
    VariantProps<typeof androidVariants> {
  color?: string
}

const Android = React.forwardRef<SVGSVGElement, AndroidProps>(
  ({ className, size, color = "currentColor", ...props }, ref) => {
    return (
      <svg
        ref={ref}
        className={cn(androidVariants({ size, className }))}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        {/* Android robot body */}
        <path
          d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10z"
          fill={color}
        />
        {/* Android robot head */}
        <path
          d="M15.5 6.5C15.5 5.12 14.38 4 13 4h-2c-1.38 0-2.5 1.12-2.5 2.5S9.62 9 11 9h2c1.38 0 2.5-1.12 2.5-2.5z"
          fill={color}
        />
        {/* Left antenna */}
        <path
          d="M7.5 2.5L9 4"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* Right antenna */}
        <path
          d="M16.5 2.5L15 4"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* Left arm */}
        <path
          d="M4 10.5c0-.83.67-1.5 1.5-1.5S7 9.67 7 10.5v3c0 .83-.67 1.5-1.5 1.5S4 14.33 4 13.5v-3z"
          fill={color}
        />
        {/* Right arm */}
        <path
          d="M17 10.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v3c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5v-3z"
          fill={color}
        />
        {/* Left eye */}
        <circle
          cx="10"
          cy="6.5"
          r="0.5"
          fill={color === "currentColor" ? "#ffffff" : "#000000"}
        />
        {/* Right eye */}
        <circle
          cx="14"
          cy="6.5"
          r="0.5"
          fill={color === "currentColor" ? "#ffffff" : "#000000"}
        />
      </svg>
    )
  }
)

Android.displayName = "Android"

export { Android, androidVariants }
