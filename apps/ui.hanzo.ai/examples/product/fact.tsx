import { YStack } from '@hanzo/gui'
import { Fact } from '@hanzo/ui/product'

/** A property list — one Fact per row, a hairline separator beneath each. */
export function PropertyList() {
  return (
    <YStack width={320}>
      <Fact label="Region" value="us-east-1" />
      <Fact label="Instance id" value="i-0abc123def456" mono />
      <Fact label="Status" value="Running" />
    </YStack>
  )
}
