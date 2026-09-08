import { YStack } from "@hanzo/gui"
import { OrderEntry } from "@hanzo/ui"

/** Default — a market buy ticket for AAPL with the standard buying power. */
export function Default() {
  return (
    <YStack maxW={360}>
      <OrderEntry symbol="NASDAQ:AAPL" accountBalance={10000} />
    </YStack>
  )
}

/** Handling submission — logs the composed order when the trader places it. */
export function HandlingSubmit() {
  return (
    <YStack maxW={360}>
      <OrderEntry
        symbol="NYSE:TSLA"
        accountBalance={25000}
        onPlaceOrder={(order) => console.log("Order placed:", order)}
      />
    </YStack>
  )
}

/** Disabled — every control is inert, for a market that is closed or a pending fill. */
export function Disabled() {
  return (
    <YStack maxW={360}>
      <OrderEntry symbol="NASDAQ:MSFT" accountBalance={5000} disabled />
    </YStack>
  )
}
