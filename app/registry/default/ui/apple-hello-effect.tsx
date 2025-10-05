"use client"

import * as React from "react"
import { motion } from "motion"

import { cn } from "@/lib/utils"

interface AppleHelloEffectProps extends React.HTMLAttributes<HTMLDivElement> {
  text?: string
  duration?: number
}

const AppleHelloEffect = React.forwardRef<
  HTMLDivElement,
  AppleHelloEffectProps
>(({ className, text = "Hello", duration = 2, ...props }, ref) => {
  const letters = text.split("")

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex items-center justify-center text-6xl font-bold",
        className
      )}
      {...props}
    >
      {letters.map((letter, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: duration,
            delay: index * 0.1,
            ease: [0.215, 0.61, 0.355, 1],
          }}
          className="inline-block"
        >
          {letter}
        </motion.span>
      ))}
    </div>
  )
})

AppleHelloEffect.displayName = "AppleHelloEffect"

export { AppleHelloEffect }
