import { XStack, YStack } from "@hanzo/gui"
import { PixelImage } from "@hanzo/ui"

const PHOTO =
  "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=400&h=400&fit=crop"

/** Default — the source image redrawn as 8px pixelation blocks. */
export function Default() {
  return (
    <YStack width={320} items="center">
      <PixelImage src={PHOTO} pixelSize={8} alt="A pixelated landscape" />
    </YStack>
  )
}

/** Block sizes — a smaller pixelSize keeps more detail, a larger one abstracts further. */
export function BlockSizes() {
  return (
    <XStack flexWrap="wrap" gap="$4" items="center">
      {[4, 12, 24].map((pixelSize) => (
        <YStack key={pixelSize} width={160} items="center" gap="$2">
          <PixelImage src={PHOTO} pixelSize={pixelSize} />
        </YStack>
      ))}
    </XStack>
  )
}

/** Rounded frame — layout props on PixelImage reach the frame around the canvas, not the canvas rules. */
export function RoundedFrame() {
  return (
    <YStack width={240} rounded="$4" overflow="hidden" borderWidth={1} borderColor="$borderColor">
      <PixelImage src={PHOTO} pixelSize={10} />
    </YStack>
  )
}
