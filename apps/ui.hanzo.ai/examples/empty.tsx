import { YStack } from "@hanzo/gui"
import {
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@hanzo/ui"

/** Default — a media slot above a title and description, with a button in the content slot. */
export function Default() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">＋</EmptyMedia>
        <EmptyTitle>No data</EmptyTitle>
        <EmptyDescription>No data found. Add one to get started.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button>Add data</Button>
      </EmptyContent>
    </Empty>
  )
}

/** Plain media — `variant="default"` leaves the media unboxed, for a larger custom icon or logo. */
export function PlainMedia() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia>🗂️</EmptyMedia>
        <EmptyTitle>No projects</EmptyTitle>
        <EmptyDescription>You have not created any projects yet.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

/** With actions — two buttons stacked in the content slot below the description. */
export function WithActions() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">⚠</EmptyMedia>
        <EmptyTitle>Something went wrong</EmptyTitle>
        <EmptyDescription>We could not load your notifications.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <YStack gap="$2" width="100%">
          <Button>Retry</Button>
          <Button variant="outline">Go back</Button>
        </YStack>
      </EmptyContent>
    </Empty>
  )
}
