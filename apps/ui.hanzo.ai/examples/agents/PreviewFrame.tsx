import { useRef, useState } from 'react'
import { XStack, YStack } from '@hanzo/gui'
import { MoreVertical, RefreshCw, WandSparkles } from '@hanzogui/lucide-icons-2'
import { Button } from '@hanzo/ui'
import { PreviewFrame, type PreviewHandle } from '@hanzo/ui/agents'

/** Framed — a deployed page on its own origin, with the floating edit toolbar over it. */
export function Framed() {
  const frame = useRef<PreviewHandle>(null)
  const [picking, setPicking] = useState(false)
  return (
    <YStack width="100%" height={360} gap="$2">
      <XStack>
        <Button variant="ghost" size="icon-sm" aria-label="Reload preview" onClick={() => frame.current?.reload()}>
          <RefreshCw size={15} />
        </Button>
      </XStack>
      <PreviewFrame
        ref={frame}
        src="https://hanzo.ai/"
        title="Preview of hanzo.ai"
        onBridge={(event) => event.type === 'preview:select' && setPicking(false)}
        toolbar={
          <>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Pick an element"
              aria-pressed={picking}
              onClick={() => {
                setPicking(!picking)
                frame.current?.post({ type: 'preview:editable', active: !picking })
              }}
            >
              <WandSparkles size={15} />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="More">
              <MoreVertical size={15} />
            </Button>
          </>
        }
      />
    </YStack>
  )
}

/** Phone — the same page in a phone-wide column. */
export function Phone() {
  return (
    <YStack width="100%" height={360}>
      <PreviewFrame src="https://hanzo.ai/" device="mobile" />
    </YStack>
  )
}

/** Empty — no address yet: nothing has been deployed. */
export function Empty() {
  return (
    <YStack width="100%" height={220}>
      <PreviewFrame src={null} />
    </YStack>
  )
}
