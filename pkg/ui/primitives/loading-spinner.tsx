import { cn } from '../util'

// cf: https://github.com/shadcn-ui/ui/discussions/1694#discussioncomment-7851248
const LoadingSpinner: React.FC<
  {
    size?: number
    className?: string
  }
  & React.SVGProps<SVGSVGElement>
> = ({
  size = 24,
  className='',
  ...props
}) => {
  return (
    <svg
      width={size}
      height={size}
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("animate-spin", className)}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

export default LoadingSpinner
