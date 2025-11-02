import Link from "next/link"
import { ArrowRightIcon } from "@radix-ui/react-icons"
import { Sparkles } from "lucide-react"

import { Separator } from "@/registry/new-york/ui/separator"

export function Announcement() {
  return (
    <Link
      href="/docs/components"
      className="group inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium transition-colors hover:bg-primary/20"
    >
      <Sparkles className="h-3.5 w-3.5 text-primary" />{" "}
      <Separator className="mx-2 h-4" orientation="vertical" />{" "}
      <span className="text-primary">New Components: Field, Input Group, Item and more</span>
      <ArrowRightIcon className="ml-1.5 h-3.5 w-3.5 text-primary transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}
