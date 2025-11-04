"use client"

import * as React from "react"
import { Mail, Check } from "lucide-react"

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
    <section className="flex min-h-screen items-center justify-center p-4 md:p-8">
      <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Left side - Content */}
        <div className="flex flex-col justify-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Join Our Newsletter
            </h2>
            <p className="text-xl text-muted-foreground">
              Get weekly insights, tips, and exclusive content delivered directly to your inbox.
            </p>
          </div>
          <ul className="space-y-3">
            {[
              "Weekly curated content",
              "Exclusive subscriber-only resources",
              "Early access to new features",
              "Unsubscribe anytime",
            ].map((feature, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Check className="h-4 w-4 text-primary" />
                </div>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right side - Form */}
        <div className="flex flex-col justify-center">
          <div className="rounded-lg border bg-card p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting || isSubscribed}
              >
                <Mail className="mr-2 h-4 w-4" />
                {isSubmitting ? "Subscribing..." : isSubscribed ? "Subscribed! ✓" : "Subscribe Now"}
              </Button>
              {isSubscribed && (
                <p className="text-center text-sm text-muted-foreground">
                  Success! Check your email to confirm.
                </p>
              )}
              <p className="text-center text-xs text-muted-foreground">
                By subscribing, you agree to our Terms and Privacy Policy.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
