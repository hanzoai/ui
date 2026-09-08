import { PositionsList } from "@hanzo/ui"
import type { Position } from "@hanzo/ui"

const positions: Position[] = [
  { symbol: "NASDAQ:AAPL", shares: 100, avgPrice: 150.0, currentPrice: 175.5 },
  { symbol: "NASDAQ:MSFT", shares: 25, avgPrice: 420.0, currentPrice: 415.2 },
  { symbol: "NASDAQ:TSLA", shares: 10, avgPrice: 180.0, currentPrice: 245.3 },
]

/** Default — every open position, with its P&L trend and totals. */
export function Default() {
  return <PositionsList positions={positions} />
}

/** Clickable — a handler on the list logs the row a viewer selects. */
export function Clickable() {
  return (
    <PositionsList
      positions={positions}
      onPositionClick={(position) => console.log("clicked", position.symbol)}
    />
  )
}

/** Empty — no positions yields a centered No open positions message. */
export function Empty() {
  return <PositionsList positions={[]} />
}
