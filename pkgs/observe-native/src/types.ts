// Native interactions carry no DOM, so the semantic descriptor is supplied
// explicitly per element (name / role / testid) and composed with the surrounding
// ObserveScope stack into the same Semantic shape the web derives from the tree.

export interface NativeMeta {
  /** Element/component name — the leaf's label (e.g. "SaveButton"). */
  name?: string
  /** Semantic role. Each helper supplies a sensible default (button, textbox, …). */
  role?: string
  /** Stable test id (React Native `testID`, Tamagui `testID`). */
  testid?: string
  /** Field kind for inputs (text, password, email, number, …). */
  kind?: string
  /** Force-redact this field's value regardless of name/kind. */
  secure?: boolean
  /** Extra properties merged onto the emitted event. */
  props?: Record<string, unknown>
}
