import { RelativeTime } from "@/registry/new-york/ui/relative-time"

export default function RelativeTimeDemo() {
  // Example: 1 hour ago
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

  return (
    <div className="w-full min-h-[400px] flex items-center justify-center">
      <RelativeTime date={oneHourAgo} />
    </div>
  )
}
