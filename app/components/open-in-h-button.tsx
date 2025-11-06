import Link from "next/link"
import Image from "next/image"

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
        <Image
          src="/hanzo-logo.svg"
          alt="Hanzo"
          width={16}
          height={16}
          className="size-4"
        />
      </Link>
    </Button>
  )
}
