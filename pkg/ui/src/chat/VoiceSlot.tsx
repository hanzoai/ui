import type { ComponentProps } from 'react'
import { Voice } from '@hanzo/voice'

/** `Voice` as a gui `asChild` child: gui injects `onPress`, which `Voice`'s native `<button>` must not receive. */
export function VoiceSlot({ onPress: _onPress, ...props }: ComponentProps<typeof Voice> & { onPress?: unknown }) {
  return <Voice {...props} />
}
