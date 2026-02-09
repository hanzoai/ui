import Link from "next/link"
<<<<<<<< HEAD:app/components/pager.tsx
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons"
// import { Doc } from "contentlayer/generated" // Migrated to Fumadocs
import { NavItem, NavItemWithChildren } from "types/nav"

import { docsConfig } from "@/config/docs"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/registry/default/ui/button"
========
import { Doc } from "contentlayer/generated"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { NavItem, NavItemWithChildren } from "types/nav"

import { docsConfig } from "@/config/docs"
import { Button } from "@/registry/new-york/ui/button"
>>>>>>>> shadcn/main:deprecated/www/components/pager.tsx

interface DocsPagerProps {
  doc: any // TODO: Update to Fumadocs types
}

export function DocsPager({ doc }: DocsPagerProps) {
  const pager = getPagerForDoc(doc)

  if (!pager) {
    return null
  }

  return (
    <div className="flex flex-row items-center justify-between">
      {pager?.prev?.href && (
        <Button variant="ghost" asChild>
          <Link href={pager.prev.href}>
            <ChevronLeft />
            {pager.prev.title}
          </Link>
        </Button>
      )}
      {pager?.next?.href && (
        <Button variant="ghost" className="ml-auto" asChild>
          <Link href={pager.next.href}>
            {pager.next.title}
            <ChevronRight />
          </Link>
        </Button>
      )}
    </div>
  )
}

<<<<<<<< HEAD:app/components/pager.tsx
export function getPagerForDoc(doc: any) {
  const flattenedLinks = [null, ...flatten(docsConfig.sidebarNav), null]
========
export function getPagerForDoc(doc: Doc) {
  const nav = doc.slug.startsWith("/docs/charts")
    ? docsConfig.chartsNav
    : docsConfig.sidebarNav
  const flattenedLinks = [null, ...flatten(nav), null]
>>>>>>>> shadcn/main:deprecated/www/components/pager.tsx
  const activeIndex = flattenedLinks.findIndex(
    (link) => doc.slug === link?.href
  )
  const prev = activeIndex !== 0 ? flattenedLinks[activeIndex - 1] : null
  const next =
    activeIndex !== flattenedLinks.length - 1
      ? flattenedLinks[activeIndex + 1]
      : null
  return {
    prev,
    next,
  }
}

export function flatten(links: NavItemWithChildren[]): NavItem[] {
  return links
    .reduce<NavItem[]>((flat, link) => {
      return flat.concat(link.items?.length ? flatten(link.items) : link)
    }, [])
    .filter((link) => !link?.disabled)
}
