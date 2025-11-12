import Link from "next/link"

import { cn } from "@/lib/utils"
import { HanzoLogo } from "@/components/hanzo-logo"
import { Button } from "@/registry/default/ui/button"

export function OpenInHButton({
  name,
  className,
  ...props
}: React.ComponentProps<typeof Button> & {
  name: string
}) {
  return (
    <Button
      size="sm"
      asChild
      className={cn("h-[1.8rem] gap-1.5 bg-black text-white hover:bg-black dark:bg-white dark:text-black dark:hover:bg-white", className)}
      {...props}
    >
      <Link href={`https://hanzo.app/builder?block=${name}`} target="_blank">
        <span className="font-medium">Open in</span>
        <HanzoLogo className="size-4 shrink-0 invert dark:invert-0" />
      </Link>
    </Button>
  )
}
