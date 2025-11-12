import Link from "next/link"
import { HanzoLogo } from "@hanzo/logo"

import { cn } from "@/lib/utils"
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
      className={cn("h-[1.8rem] gap-1.5", className)}
      {...props}
    >
      <Link href={`https://hanzo.app/builder?block=${name}`} target="_blank">
        <span className="font-medium">Open in</span>
        <HanzoLogo className="size-4 shrink-0 [&_svg]:fill-current" />
      </Link>
    </Button>
  )
}
