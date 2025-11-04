"use client"

import * as React from "react"

import { Button } from "@/registry/new-york/ui/button"
import { Input } from "@/registry/new-york/ui/input"

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
    <section className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6 text-center">
        <div className="space-y-3">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
            Subscribe
          </h1>
          <p className="mx-auto max-w-lg text-lg text-muted-foreground sm:text-xl">
            Get notified about new articles, tutorials, and product updates.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="mx-auto max-w-md">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
              className="h-12 text-base"
            />
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting || isSubscribed}
              className="min-w-[100px]"
            >
              {isSubmitting ? "..." : isSubscribed ? "✓" : "Join"}
            </Button>
          </div>
          {isSubscribed && (
            <p className="mt-3 text-sm text-muted-foreground">
              You're in! Check your email.
            </p>
          )}
        </form>
      </div>
    </section>
  )
}
