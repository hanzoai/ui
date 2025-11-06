// Single theme system - only "default" style
export const styles = [
  {
    name: "default",
    label: "Default",
  },
] as const

export type Style = (typeof styles)[number]

export function getActiveStyle() {
  // Always returns "default" in single theme system
  return styles[0]
}

export function getStyle(name: string) {
  // Always returns "default" since we only have one style
  return styles[0]
}
