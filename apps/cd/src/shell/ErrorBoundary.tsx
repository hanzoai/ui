import { Component, type ErrorInfo, type ReactNode } from "react"

/**
 * Top-level boundary so a single component render throw can never white-screen
 * the whole dashboard. A caught error shows a recover panel (back to the fleet /
 * reload) instead of an unmounted root. Deliberately dependency-free.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surface to the console for the operator; never log identity/token.
    console.error("[cd] render error", error, info.componentStack)
  }

  private reset = () => {
    this.setState({ error: null })
    if (location.hash && location.hash !== "#/") location.hash = "#/"
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div style={{ maxWidth: 520, margin: "12vh auto", padding: "0 24px", textAlign: "center", fontFamily: "'Zen', ui-sans-serif, system-ui, sans-serif" }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>Something went wrong</h1>
        <p style={{ color: "#8a8a8a", fontSize: 14, margin: "0 0 20px" }}>
          A view failed to render. Your fleet is unaffected — this is only the dashboard.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button onClick={this.reset} style={btn(true)}>← Back to fleet</button>
          <button onClick={() => location.reload()} style={btn(false)}>Reload</button>
        </div>
      </div>
    )
  }
}

const btn = (primary: boolean): React.CSSProperties => ({
  padding: "9px 16px",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  borderRadius: 8,
  border: primary ? "0" : "1px solid #2a2a2a",
  background: primary ? "#fff" : "transparent",
  color: primary ? "#000" : "inherit",
})
