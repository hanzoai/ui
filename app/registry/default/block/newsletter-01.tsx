"use client"

import * as React from "react"
import { Mail } from "lucide-react"

import { Button } from "@/registry/default/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/registry/default/ui/card"
import { Input } from "@/registry/default/ui/input"

export default function NewsletterBlock() {
  const [email, setEmail] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isSubscribed, setIsSubscribed] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    setIsSubscribed(true)
    setIsSubmitting(false)
    setEmail("")

    // Reset success message after 3 seconds
    setTimeout(() => setIsSubscribed(false), 3000)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Subscribe to our newsletter</CardTitle>
            <CardDescription>
              Get the latest updates, articles, and resources delivered to your inbox weekly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || isSubscribed}
            >
              {isSubmitting ? "Subscribing..." : isSubscribed ? "Subscribed! ✓" : "Subscribe"}
            </Button>
            {isSubscribed && (
              <p className="text-center text-sm text-muted-foreground">
                Thank you for subscribing!
              </p>
            )}
            <p className="text-center text-xs text-muted-foreground">
              By subscribing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}
