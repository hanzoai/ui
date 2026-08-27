'use client'

/**
 * "Connected", and the way out of it.
 *
 * A connection is a thing a person can END, so the badge that reports one
 * carries the disconnect rather than leaving it somewhere else on the page —
 * the state and the verb that changes it belong in the same box.
 *
 * `method` and `extra` are separate because they answer different questions:
 * HOW the connection was made, and WHICH one it is. A caller that knows only
 * one passes only one.
 */
import { Button, Spinner, Text, XStack, YStack } from '@hanzo/gui'
import { LogOut } from '@hanzogui/lucide-icons-2'
import type { ReactNode } from 'react'

export type ConnectionBadgeProps = {
  /** How the connection was made — "OAuth", "API key". */
  method?: string
  /** Which connection it is — an account name, a host. */
  extra?: string
  /** A line under the badge, for anything that needs more than the row. */
  info?: ReactNode
  onDisconnect: () => void
  /** The disconnect is in flight; the button waits rather than repeating. */
  disconnecting?: boolean
}

export function ConnectionBadge({
  method,
  extra,
  info,
  onDisconnect,
  disconnecting,
}: ConnectionBadgeProps) {
  return (
    <YStack>
      <XStack
        items="center"
        justify="space-between"
        p="$2.5"
        rounded="$5"
        borderWidth={1}
        borderColor="$green3"
        bg="$green1"
      >
        <XStack items="center" gap="$2">
          <YStack height={10} width={10} rounded={9999} bg="$green9" />
          <Text fontSize="$3" fontWeight="500" color="$green11">
            Connected
          </Text>
          {method ? (
            <Text fontSize="$1" color="$quiet">
              via {method}
            </Text>
          ) : null}
          {extra ? (
            <Text fontSize="$1" color="$quiet">
              {extra}
            </Text>
          ) : null}
        </XStack>
        <Button chromeless onPress={onDisconnect} disabled={disconnecting}>
          <XStack items="center" gap="$1">
            {disconnecting ? <Spinner size="small" /> : <LogOut size={12} />}
            <Text color="$quiet" fontSize="$1">
              Disconnect
            </Text>
          </XStack>
        </Button>
      </XStack>
      {info ? (
        <YStack mt="$2">
          <Text fontSize="$1" color="$quiet">
            {info}
          </Text>
        </YStack>
      ) : null}
    </YStack>
  )
}
