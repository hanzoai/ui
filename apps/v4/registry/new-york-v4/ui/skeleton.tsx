import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
<<<<<<< HEAD
      className={cn("bg-accent animate-pulse rounded-md", className)}
=======
      className={cn("animate-pulse rounded-md bg-accent", className)}
>>>>>>> shadcn/main
      {...props}
    />
  )
}

export { Skeleton }
