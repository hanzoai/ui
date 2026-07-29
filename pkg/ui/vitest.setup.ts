/**
 * jsdom does not implement `matchMedia`, and @hanzogui/select reads it at MODULE
 * scope — so the shim has to exist before any component module is imported.
 * Static, no-listener, matches nothing: the render suites assert markup, not
 * responsive behaviour.
 */
if (typeof window !== 'undefined' && !window.matchMedia)
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia
