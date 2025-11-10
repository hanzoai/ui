"use client"

import dynamic from "next/dynamic"

import { Card, CardContent } from "@/registry/default/ui/card"

// Dynamically import the form component to avoid SSR issues with Wagmi
const IdentityForm = dynamic(
  () => import("./identity-form").then((mod) => mod.IdentityForm),
  {
    ssr: false,
    loading: () => (
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Register Identity</h1>
          <p className="text-muted-foreground">
            Claim your unique identity across Hanzo, Lux, and Zoo networks
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Loading Web3...</p>
          </CardContent>
        </Card>
      </div>
    ),
  }
)

export default function IdentityPage() {
  return <IdentityForm />
}
