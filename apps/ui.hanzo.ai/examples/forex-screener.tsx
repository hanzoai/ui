import { YStack } from "@hanzo/gui"
import { ForexScreener } from "@hanzo/ui"

/** Default — the forex market, dark theme, with the toolbar shown. */
export function Default() {
  return <ForexScreener />
}

/** Screen — opens pre-filtered to the top-gainers preset screen. */
export function Screen() {
  return <ForexScreener defaultScreen="top_gainers" />
}

/** Column — opens on the performance columns instead of the overview. */
export function Column() {
  return <ForexScreener defaultColumn="performance" />
}

/** Sized — a shorter, fixed-width frame with the toolbar hidden. */
export function Sized() {
  return (
    <YStack width={360}>
      <ForexScreener width={360} height={400} showToolbar={false} colorTheme="light" />
    </YStack>
  )
}
