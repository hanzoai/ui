// Toggle — a compact switch (track + sliding thumb) for boolean fields. Built from
// primitives (no composite gui Switch API) so it type-checks everywhere and reads
// the data palette. Press flips; `on` is green.
import { YStack } from '@hanzo/gui'
import { tagTone, tokens } from '../theme'

export interface ToggleProps {
  on?: boolean
  onChange?: (on: boolean) => void
  disabled?: boolean
}

export function Toggle({ on, onChange, disabled }: ToggleProps) {
  const w = 34
  const h = 20
  const pad = 2
  const thumb = h - pad * 2
  return (
    <YStack
      width={w}
      height={h}
      rounded={h}
      justify="center"
      cursor={disabled ? undefined : 'pointer'}
      onPress={disabled || !onChange ? undefined : () => onChange(!on)}
      style={{
        opacity: disabled ? 0.5 : 1,
        backgroundColor: on ? tagTone('green').border : tokens.border,
        paddingLeft: pad,
        paddingRight: pad,
      }}
    >
      <YStack
        width={thumb}
        height={thumb}
        rounded={thumb}
        style={{
          backgroundColor: '#f4f4f5',
          transform: [{ translateX: on ? w - thumb - pad * 2 : 0 }],
        }}
      />
    </YStack>
  )
}
