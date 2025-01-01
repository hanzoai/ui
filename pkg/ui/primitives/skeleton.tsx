import { cn } from '../util'

const Skeleton: React.FC<{
  reverse?: boolean  
} & React.HTMLAttributes<HTMLDivElement>> = ({
  reverse=false,
  className,
  ...props
}) => (
  <div
    className={cn(
      'rounded-md bg-level-2', 
      reverse ? 'animate-pulsereverse' : 'animate-pulse',  
      className
    )}
    {...props}
  />
)

export default Skeleton
