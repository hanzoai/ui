import { useState } from 'react'
import { Button, Text, YStack } from '@hanzo/gui'
import { SlideOver } from '@hanzo/ui/product'

/** Slides from the right by default; full-screen below the `lg` breakpoint. */
export function Basic() {
  const [open, setOpen] = useState(false)
  return (
    <YStack gap="$3">
      <Button onPress={() => setOpen(true)}>Open</Button>
      <SlideOver open={open} onClose={() => setOpen(false)} title="Details" ariaLabel="Details">
        <Text>Panel content goes here.</Text>
      </SlideOver>
    </YStack>
  )
}
