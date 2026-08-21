'use client'

/**
 * SecretInput — a secret you can check, copy, and not leak over someone's
 * shoulder.
 *
 * An API key, a token, a webhook signing secret. Masked by default, revealed
 * deliberately, and copyable without ever being revealed — which is the point:
 * the usual reason a person unmasks a key is to select it by hand, so a copy
 * control that works while masked removes the reason to show it at all.
 *
 * Copying is `CopyButton`, not a second implementation. This component owns
 * exactly one thing the others do not: the reveal.
 *
 * Nothing here reports the secret. The analytics event carries the LENGTH and
 * whether it was revealed — never a character of the value, and it is never
 * written to the console, which is where the previous implementation sent its
 * clipboard failures.
 */
import { useState } from 'react'
import { Input, XStack } from '@hanzo/gui'
import { Eye, EyeOff } from '@hanzogui/lucide-icons-2'

import { tip } from '../backends/gui/slot'
import { CopyButton } from './CopyButton'
import { useEmit } from './instrument'
import { masked } from '../backends/gui/mask'

// `masked` — the props that hide a value on web AND native — is a value, so it
// lives in `./mask` and is reachable without a gui runtime via
// `@hanzo/ui/product/pure`. Re-exported here because it was published from this
// module and the product barrel still carries it.
export { masked }

export type SecretInputProps = {
  value: string
  /** Omit to render read-only — the common case for a key the server minted. */
  onChange?: (v: string) => void
  placeholder?: string
  disabled?: boolean
  /** Show the copy control. Default true — copying is why the field exists. */
  copy?: boolean
  /** Names the secret in analytics ("openai-key"). Never the value. */
  id?: string
  /** Failed validation: reddens the frame AND says so to a screen reader. A
   *  colour alone is not a message, and a required key is the field's most
   *  common error. */
  invalid?: boolean
  /** id of the element holding the error text, so the field announces WHY it is
   *  invalid rather than only that it is. */
  'aria-describedby'?: string
}

export function SecretInput({
  value,
  onChange,
  placeholder,
  disabled,
  copy = true,
  id,
  invalid,
  'aria-describedby': describedBy,
}: SecretInputProps) {
  const [shown, setShown] = useState(false)
  const track = useEmit()

  const toggle = () => {
    track({ component: 'SecretInput', action: shown ? 'close' : 'open', id })
    setShown((s) => !s)
  }

  return (
    <XStack
      items="center"
      gap="$1"
      px="$2"
      rounded="$3"
      borderWidth={1}
      borderColor={invalid ? '$red10' : '$borderColor'}
      bg="$background"
      opacity={disabled ? 0.5 : 1}
    >
      <Input
        flex={1}
        minW={0}
        borderWidth={0}
        bg="transparent"
        aria-invalid={invalid ? 'true' : undefined}
        aria-describedby={describedBy}
        value={value}
        onChangeText={
          onChange
            ? (v: string) => {
                track({ component: 'SecretInput', action: 'change', id, value: v.length })
                onChange(v)
              }
            : undefined
        }
        // No handler means the caller is displaying a minted secret, not
        // collecting one; a field that accepts keystrokes it then discards
        // reads as broken. `readOnly`, not `editable` — see `masked`.
        readOnly={!onChange}
        disabled={disabled}
        {...masked(!shown)}
        placeholder={placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
      />
      {copy && value ? <CopyButton value={value} label="Copy secret" id={id} /> : null}
      <XStack
        width={24}
        height={24}
        items="center"
        justify="center"
        rounded="$2"
        cursor={disabled ? 'not-allowed' : 'pointer'}
        opacity={0.7}
        onPress={disabled ? undefined : toggle}
        role="button"
        tabIndex={0}
        aria-label={shown ? 'Hide secret' : 'Show secret'}
        {...tip(shown ? 'Hide' : 'Show')}
        hoverStyle={disabled ? undefined : { bg: '$color4', opacity: 1 }}
        pressStyle={disabled ? undefined : { bg: '$color5' }}
      >
        {shown ? <EyeOff size={14} /> : <Eye size={14} />}
      </XStack>
    </XStack>
  )
}
