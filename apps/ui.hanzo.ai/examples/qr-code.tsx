import { XStack, YStack, SizableText } from '@hanzo/gui'
import { QRCode } from '@hanzo/ui'

/** Default — a QR code for a URL at its default 256px size. */
export function Default() {
  return <QRCode value="https://ui.hanzo.ai" />
}

/** Sizes — the same value rendered at three pixel sizes. */
export function Sizes() {
  return (
    <XStack gap="$4" items="center">
      {[96, 160, 224].map((size) => (
        <QRCode key={size} value="https://ui.hanzo.ai" size={size} />
      ))}
    </XStack>
  )
}

/** Error correction — the same value at each of the four correction levels. */
export function ErrorCorrection() {
  return (
    <XStack gap="$4" items="center" flexWrap="wrap">
      {(['L', 'M', 'Q', 'H'] as const).map((level) => (
        <YStack key={level} gap="$2" items="center">
          <QRCode value="https://ui.hanzo.ai" size={120} level={level} />
          <SizableText size="$2" color="$quiet">
            {level}
          </SizableText>
        </YStack>
      ))}
    </XStack>
  )
}

/** Colors and margin — custom foreground/background with a quiet-zone margin. */
export function Styled() {
  return <QRCode value="https://ui.hanzo.ai" fgColor="#7000FF" bgColor="#F4EEFF" includeMargin size={200} />
}
