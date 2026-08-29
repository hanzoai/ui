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

/**
 * jsdom applies no author CSS, so `<Hanzo>`'s stylesheet guard cannot be
 * answered here — it reads `--hanzo-ui-styles` off the document, and nothing in
 * this environment will ever set it. The guard skips a document that holds no
 * owned sheet for exactly that reason, but a runtime insert can own a `<style>`
 * (the dialog suite is one), and then it asks a question jsdom cannot answer
 * and throws about a bundler that is not involved.
 *
 * Declaring the property is the answer the environment owes it. The guard is a
 * browser check for a real bundler; here it has nothing to find.
 */
if (typeof document !== 'undefined')
  document.documentElement.style.setProperty('--hanzo-ui-styles', '1')
