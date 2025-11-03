"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { Announcement } from "@/components/announcement"
import { ExamplesNav } from "@/components/examples-nav"
import { PageNav } from "@/components/page-nav"
import { ThemeSelector } from "@/components/theme-selector"
import {
  PageActions,
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/page-header"
import { buttonVariants } from "@/registry/new-york/ui/button"

interface ExamplesLayoutProps {
  children: React.ReactNode
}

function ExamplesLayoutContent({ children }: ExamplesLayoutProps) {
  const searchParams = useSearchParams()
  const isEmbedded = searchParams.get("embedded") === "true"

  // If embedded, just show the content without header
  if (isEmbedded) {
    return <>{children}</>
  }

  // Full layout for standalone view
  return (
    <>
      <div className="container relative">
        <PageHeader>
          <Announcement />
          <PageHeaderHeading className="hidden md:block">
            Check out some examples
          </PageHeaderHeading>
          <PageHeaderHeading className="md:hidden">Examples</PageHeaderHeading>
          <PageHeaderDescription>
            Dashboard, cards, authentication. Some examples built using the
            components. Use this as a guide to build your own.
          </PageHeaderDescription>
          <PageActions>
            <Link
              href="/docs"
              className={cn(buttonVariants(), "rounded-[6px]")}
            >
              Get Started
            </Link>
            <Link
              href="/components"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "rounded-[6px]"
              )}
            >
              Components
            </Link>
          </PageActions>
        </PageHeader>
        <section>
          <PageNav id="examples" className="hidden md:flex">
            <ExamplesNav className="[&>a:first-child]:text-primary flex-1 overflow-hidden" />
            <ThemeSelector className="mr-4 hidden md:flex" />
          </PageNav>
          <div className="overflow-hidden rounded-[0.5rem] border bg-background shadow-md md:shadow-xl">
            {children}
          </div>
        </section>
      </div>
    </>
  )
}

export default function ExamplesLayout({ children }: ExamplesLayoutProps) {
  return (
    <Suspense fallback={<>{children}</>}>
      <ExamplesLayoutContent>{children}</ExamplesLayoutContent>
    </Suspense>
  )
}
