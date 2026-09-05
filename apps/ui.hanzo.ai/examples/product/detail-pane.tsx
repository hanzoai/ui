import { Button, YStack } from '@hanzo/gui'
import { DetailPane, Fact, useDetailPane } from '@hanzo/ui/product'

function OpenButton() {
  const { open } = useDetailPane()
  return (
    <Button
      onPress={() =>
        open({
          title: 'Machine gpu-1',
          subtitle: 'Running',
          content: (
            <YStack gap="$1">
              <Fact label="Region" value="us-east-1" />
              <Fact label="Type" value="a100.80g" mono />
            </YStack>
          ),
          footer: <Button size="$2">Restart</Button>,
        })
      }
    >
      Open details
    </Button>
  )
}

/** `useDetailPane().open(descriptor)` from anywhere inside `DetailPane` — one
 *  mount point, so every "view an item's details" looks the same. */
export function Basic() {
  return (
    <DetailPane>
      <OpenButton />
    </DetailPane>
  )
}
