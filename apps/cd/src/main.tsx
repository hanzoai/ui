import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { App } from "./App"
import { ErrorBoundary } from "./shell/ErrorBoundary"
// THE FACES. Zen is the Hanzo family and @hanzo/font is where it is authored;
// this is its @font-face and nothing else, plus --font-zen-sans/--font-zen-mono,
// which styles.css binds to --font-sans/--font-mono. First, so the faces are
// declared before any sheet names a family.
import "@hanzo/font/css"
import "./styles.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
