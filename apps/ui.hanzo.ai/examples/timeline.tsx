import { XStack, YStack } from "@hanzo/gui"
import { Badge, Timeline, type TimelineItem } from "@hanzo/ui"

const milestones: TimelineItem[] = [
  { id: "1", title: "Project started", description: "Initial planning and setup", date: "Jan 1, 2024", status: "completed" },
  { id: "2", title: "Development phase", description: "Building core features", date: "Feb 15, 2024", status: "active" },
  { id: "3", title: "Testing", description: "Quality assurance and bug fixes", date: "Mar 1, 2024", status: "pending" },
]

/** Default — a bordered card beside a connecting line, one per milestone. */
export function Default() {
  return <Timeline items={milestones} />
}

/** Horizontal — the same milestones read left to right instead of top to bottom. */
export function Horizontal() {
  return <Timeline items={milestones} orientation="horizontal" />
}

/** Alternate — cards alternate left and right of a centered line. */
export function Alternate() {
  return <Timeline items={milestones} variant="alternate" />
}

/** Variants — compact and simple render the same data without a card. */
export function Variants() {
  const withContent: TimelineItem[] = [
    {
      id: "1",
      title: "Version 1.0 released",
      description: "Initial release with core features",
      date: "Jan 1, 2024",
      status: "completed",
      content: (
        <XStack gap="$2">
          <Badge>Core</Badge>
          <Badge variant="secondary">Stable</Badge>
        </XStack>
      ),
    },
    { id: "2", title: "Version 2.0 beta", description: "Major update", date: "Feb 15, 2024", status: "active" },
  ]

  return (
    <YStack gap="$8">
      <Timeline items={milestones} variant="compact" />
      <Timeline items={withContent} variant="simple" />
    </YStack>
  )
}
