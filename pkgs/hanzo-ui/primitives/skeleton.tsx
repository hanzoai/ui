import { cn } from '../util'

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-level-2', className)}
      {...props}
    />
  )
}

export default Skeleton
