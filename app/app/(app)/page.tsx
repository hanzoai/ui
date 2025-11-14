import { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CheckCircle2 } from "lucide-react"

import { Button } from "@/registry/default/ui/button"

import { HomeContent } from "./home-content"

const title = "Hanzo UI Component Library"
const description =
  "Beautifully designed components built by Hanzo AI. Accessible. Customizable. Open Source. Built with React and Tailwind CSS."

export const dynamic = "force-static"
export const revalidate = false

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    images: [
      {
        url: `/og?title=${encodeURIComponent(
          title
        )}&description=${encodeURIComponent(description)}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: [
      {
        url: `/og?title=${encodeURIComponent(
          title
        )}&description=${encodeURIComponent(description)}`,
      },
    ],
  },
}

export default function IndexPage() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Enhanced Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 animate-gradient bg-[length:200%_200%]" />
          <div className="absolute inset-0 bg-grid-white/[0.02]" />
        </div>

        {/* Hero content */}
        <div className="container py-16 md:py-24 lg:py-32 space-y-8 animate-fade-in-up">
          {/* Animated badge with pulse indicator */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-sm font-medium border">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              New: 150+ components, Page Builder, and more
            </div>
          </div>

          {/* Main heading with gradient text */}
          <h1 className="text-center text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-foreground/70">
              {title}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-center text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4">
            {description}
          </p>

          {/* CTAs with clear hierarchy - larger and more prominent */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button
              asChild
              size="lg"
              className="gap-2 text-base md:text-lg h-11 md:h-12 px-6 md:px-8 min-w-[160px] shadow-lg hover:shadow-xl transition-shadow"
            >
              <Link href="/docs/installation">
                Get Started
                <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="text-base md:text-lg h-11 md:h-12 px-6 md:px-8 min-w-[160px]"
            >
              <Link href="/docs/components">View Components</Link>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-8 text-sm md:text-base text-muted-foreground pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              <span>Open Source</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              <span>TypeScript</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              <span>Accessible</span>
            </div>
          </div>
        </div>
      </section>

      <div className="container-wrapper section-soft flex-1 pb-6">
        <div className="container overflow-hidden">
          <section className="theme-container">
            <HomeContent />
          </section>
        </div>
      </div>
    </div>
  )
}
