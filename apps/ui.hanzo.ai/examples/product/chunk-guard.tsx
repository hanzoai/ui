import { Text, YStack } from '@hanzo/gui'
import { ChunkGuard } from '@hanzo/ui/product'

/** Mounted once near the shell root — recovers a stale-deploy chunk 404 by
 *  reloading, at most once per window. Renders nothing itself. */
export function Mounted() {
  return (
    <YStack gap="$2">
      <ChunkGuard />
      <Text fontSize="$2" color="$color10">
        No visible output — this is a window-level listener, not a view.
      </Text>
    </YStack>
  )
}
