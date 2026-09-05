import { useState } from "react"
import { Text, XStack, YStack } from "@hanzo/gui"
import {
  Button,
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  Label,
} from "@hanzo/ui"

/** Default — six boxes drawn from one hidden input, so paste, autofill and backspace act on the whole code. */
export function Default() {
  return (
    <InputOTP
      maxLength={6}
      render={({ slots }) => (
        <InputOTPGroup>
          {slots.map((slot, i) => (
            <InputOTPSlot key={i} {...slot} />
          ))}
        </InputOTPGroup>
      )}
    />
  )
}

/** Grouped — `render` decides how the boxes are split: three and three with a separator, or one run of four for a PIN. */
export function Grouped() {
  return (
    <YStack gap="$4" items="flex-start">
      <InputOTP
        maxLength={6}
        render={({ slots }) => (
          <>
            <InputOTPGroup>
              {slots.slice(0, 3).map((slot, i) => (
                <InputOTPSlot key={i} {...slot} />
              ))}
            </InputOTPGroup>
            <InputOTPSeparator className="px-2" />
            <InputOTPGroup>
              {slots.slice(3).map((slot, i) => (
                <InputOTPSlot key={i} {...slot} />
              ))}
            </InputOTPGroup>
          </>
        )}
      />
      <InputOTP
        maxLength={4}
        render={({ slots }) => (
          <InputOTPGroup>
            {slots.map((slot, i) => (
              <InputOTPSlot key={i} {...slot} />
            ))}
          </InputOTPGroup>
        )}
      />
    </YStack>
  )
}

/** Masked — each box shows a dot in place of its digit, for a PIN typed where someone else can see the screen. */
export function Masked() {
  return (
    <InputOTP
      maxLength={4}
      render={({ slots }) => (
        <InputOTPGroup>
          {slots.map((slot, i) => (
            <InputOTPSlot
              key={i}
              {...slot}
              char={slot.char === null ? null : "•"}
            />
          ))}
        </InputOTPGroup>
      )}
    />
  )
}

/** Disabled — `disabled` reaches the hidden input, so the control takes no focus or keystrokes; the boxes fade through `className`. */
export function Disabled() {
  return (
    <InputOTP
      maxLength={6}
      disabled
      className="opacity-50"
      render={({ slots }) => (
        <InputOTPGroup>
          {slots.map((slot, i) => (
            <InputOTPSlot key={i} {...slot} />
          ))}
        </InputOTPGroup>
      )}
    />
  )
}

/** Controlled — `value` and `onChange` keep the code in React state, a Label bound by `htmlFor` focuses it, and the button waits for all six digits. */
export function Controlled() {
  const [code, setCode] = useState("")
  return (
    <YStack gap="$3" items="flex-start">
      <Label htmlFor="sms-code">Enter the code sent to +1 415 555 0142</Label>
      <InputOTP
        id="sms-code"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        render={({ slots }) => (
          <InputOTPGroup>
            {slots.map((slot, i) => (
              <InputOTPSlot key={i} {...slot} />
            ))}
          </InputOTPGroup>
        )}
      />
      <XStack gap="$3" items="center">
        <Button disabled={code.length < 6}>Verify</Button>
        <Text fontSize="$2" color="$color11">
          {code.length}/6
        </Text>
      </XStack>
    </YStack>
  )
}
