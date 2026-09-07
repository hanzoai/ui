import { YStack } from "@hanzo/gui"
import { CryptoScreener } from "@hanzo/ui"

/** Default — the crypto market, dark theme, priced in USD. */
export function Default() {
  return <CryptoScreener />
}

/** Market — the same table switched to a stock exchange universe. */
export function Market() {
  return <CryptoScreener market="america" colorTheme="dark" />
}

/** Column — opens on the performance columns instead of the overview. */
export function Column() {
  return <CryptoScreener defaultColumn="performance" />
}

/** Sized — a shorter, fixed-width frame for a sidebar placement. */
export function Sized() {
  return (
    <YStack width={360}>
      <CryptoScreener width={360} height={400} colorTheme="light" />
    </YStack>
  )
}
