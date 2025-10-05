"use client"

import * as React from "react"
import { AnimatePresence, motion } from "motion"

import { cn } from "@/lib/utils"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/registry/default/ui/avatar"
import { Card, CardContent } from "@/registry/default/ui/card"

interface Testimonial {
  id: string
  content: string
  author: string
  role?: string
  company?: string
  avatar?: string
}

interface AnimatedTestimonialsProps
  extends React.HTMLAttributes<HTMLDivElement> {
  testimonials: Testimonial[]
  autoPlay?: boolean
  duration?: number
}

const AnimatedTestimonials = React.forwardRef<
  HTMLDivElement,
  AnimatedTestimonialsProps
>(
  (
    { className, testimonials, autoPlay = true, duration = 5000, ...props },
    ref
  ) => {
    const [activeIndex, setActiveIndex] = React.useState(0)

    React.useEffect(() => {
      if (!autoPlay) return

      const interval = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % testimonials.length)
      }, duration)

      return () => clearInterval(interval)
    }, [autoPlay, duration, testimonials.length])

    return (
      <div
        ref={ref}
        className={cn("relative min-h-[200px]", className)}
        {...props}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardContent className="pt-6">
                <blockquote className="space-y-4">
                  <p className="text-lg italic">
                    "{testimonials[activeIndex].content}"
                  </p>
                  <footer className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={testimonials[activeIndex].avatar} />
                      <AvatarFallback>
                        {testimonials[activeIndex].author
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <cite className="not-italic font-medium">
                        {testimonials[activeIndex].author}
                      </cite>
                      {testimonials[activeIndex].role && (
                        <p className="text-sm text-muted-foreground">
                          {testimonials[activeIndex].role}
                          {testimonials[activeIndex].company &&
                            `, ${testimonials[activeIndex].company}`}
                        </p>
                      )}
                    </div>
                  </footer>
                </blockquote>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        <div className="mt-4 flex justify-center gap-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "h-2 w-2 rounded-full transition-all",
                index === activeIndex
                  ? "w-8 bg-primary"
                  : "bg-muted hover:bg-muted-foreground"
              )}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    )
  }
)

AnimatedTestimonials.displayName = "AnimatedTestimonials"

export { AnimatedTestimonials, type Testimonial }
