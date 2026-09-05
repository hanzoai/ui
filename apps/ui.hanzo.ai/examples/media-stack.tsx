import { Text, XStack, YStack } from "@hanzo/gui"
import { fit, MediaStack } from "@hanzo/ui"

const photo = {
  src: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&q=70",
  alt: "A desk with two laptops",
  dim: { w: 1200, h: 800 },
}

/** Default — a photograph fitted inside the box the layout reserves for it. */
export function Default() {
  return <MediaStack media={{ img: photo }} constrainTo={{ w: 320, h: 240 }} />
}

/** Constrained — the same source in three boxes; each keeps the aspect ratio and reserves its space before the bytes arrive. */
export function Constrained() {
  return (
    <XStack flexWrap="wrap" gap="$4" items="flex-end">
      {[
        { w: 240, h: 240 },
        { w: 160, h: 240 },
        { w: 320, h: 120 },
      ].map((box) => (
        <YStack key={`${box.w}x${box.h}`} gap="$2" items="center">
          <MediaStack media={{ img: photo }} constrainTo={box} />
          <Text fontSize={12} color="$color10">
            {box.w} × {box.h}
          </Text>
        </YStack>
      ))}
    </XStack>
  )
}

/** Fit — the arithmetic the stack uses, exposed for a layout that needs the numbers. */
export function Fit() {
  const fitted = fit(photo.dim, { w: 320, h: 240 })
  return (
    <Text fontFamily="$mono" fontSize={13} color="$color11">
      {`fit(${photo.dim.w}×${photo.dim.h}, 320×240) → ${Math.round(fitted.w)}×${Math.round(fitted.h)}`}
    </Text>
  )
}
