import { YStack } from '@hanzo/gui'
import { RelativeTime } from '@hanzo/ui'

/** Default — an hour-old moment read as friendly words. */
export function Default() {
  const anHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  return <RelativeTime date={anHourAgo} />
}

/** Short — the same distance abbreviated, e.g. "3h" instead of "3 hours ago". */
export function Short() {
  const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000)
  return <RelativeTime date={threeHoursAgo} format="short" />
}

/** Long — locale-correct phrasing from Intl.RelativeTimeFormat. */
export function Long() {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
  return <RelativeTime date={yesterday} format="long" />
}

/** A timeline — several moments, past and future, read at once. */
export function Timeline() {
  const now = Date.now()
  return (
    <YStack gap="$2">
      <RelativeTime date={new Date(now - 5 * 60 * 1000)} />
      <RelativeTime date={new Date(now - 2 * 24 * 60 * 60 * 1000)} />
      <RelativeTime date={new Date(now + 60 * 60 * 1000)} />
    </YStack>
  )
}
