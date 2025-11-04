"use client"

import * as React from "react"

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
    <section className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Stay Updated</h2>
            <p className="text-muted-foreground">
              Join our newsletter for the latest updates and exclusive content.
            </p>
          </div>
          <div className="mx-auto flex max-w-md gap-2">
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={isSubmitting || isSubscribed}
              className="min-w-[120px]"
            >
              {isSubmitting ? "Subscribing..." : isSubscribed ? "Subscribed! ✓" : "Subscribe"}
            </Button>
          </div>
          {isSubscribed && (
            <p className="text-sm text-muted-foreground">
              Thank you! Check your inbox to confirm.
            </p>
          )}
        </form>
      </div>
    </section>
  )
}
