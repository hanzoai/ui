import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'

const CalendarComponent = dynamic(
  () => import('../calendar').then(mod => ({ default: mod.Calendar })),
  {
    ssr: false,
    loading: () => <div className="h-64 w-full animate-pulse rounded-lg bg-muted" />
  }
)

export const Calendar = (props: ComponentProps<typeof CalendarComponent>) => {
  return <CalendarComponent {...props} />
}