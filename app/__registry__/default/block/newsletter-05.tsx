"use client"

import * as React from "react"
import { ArrowRight } from "lucide-react"

import { Button } from "@/registry/default/ui/button"
import { Input } from "@/registry/default/ui/input"

export default function NewsletterBlock() {
  const [email, setEmail] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isSubscribed, setIsSubscribed] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSubscribed(true)
    setIsSubmitting(false)
    setEmail("")
    setTimeout(() => setIsSubscribed(false), 3000)
  }

  return (
    <section className="flex min-h-screen items-center justify-center">
      <div className="w-full bg-primary px-4 py-16 text-primary-foreground sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 lg:items-center">
            {/* Content */}
            <div className="space-y-4">
              <div className="inline-block rounded-full bg-primary-foreground/10 px-3 py-1 text-sm font-medium">
                Newsletter
              </div>
              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Never miss an update
              </h2>
              <p className="text-lg text-primary-foreground/90 sm:text-xl">
                Join thousands of subscribers getting exclusive insights, tutorials, and early access to new features.
              </p>
            </div>

            {/* Form */}
            <div className="lg:pl-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="h-12 flex-1 border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/60"
                  />
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting || isSubscribed}
                    variant="secondary"
                    className="sm:min-w-[140px]"
                  >
                    {isSubmitting ? (
                      "Subscribing..."
                    ) : isSubscribed ? (
                      "Subscribed! ✓"
                    ) : (
                      <>
                        Subscribe
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
                {isSubscribed && (
                  <p className="text-sm text-primary-foreground/90">
                    Welcome aboard! Confirmation email sent.
                  </p>
                )}
                <p className="text-xs text-primary-foreground/70">
                  We respect your privacy. Unsubscribe at any time.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
