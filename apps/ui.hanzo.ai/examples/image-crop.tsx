import { YStack } from "@hanzo/gui"
import { ImageCrop } from "@hanzo/ui"

const PHOTO = "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800&h=600&fit=crop"

/** Default — a square preview with zoom, rotate and crop controls under it. */
export function Default() {
  return (
    <YStack width="100%" maxW={480}>
      <ImageCrop src={PHOTO} />
    </YStack>
  )
}

/** Widescreen — `aspect` sets the frame's width-to-height ratio. */
export function Widescreen() {
  return (
    <YStack width="100%" maxW={480}>
      <ImageCrop src={PHOTO} aspect={16 / 9} />
    </YStack>
  )
}

/** Portrait — a taller frame for a portrait crop, such as an avatar upload. */
export function Portrait() {
  return (
    <YStack width="100%" maxW={320}>
      <ImageCrop src={PHOTO} aspect={3 / 4} />
    </YStack>
  )
}
