export const styles = [
  {
    name: "default",
    label: "Default",
  },
  {
    name: "new-york",
    label: "New York",
  },
] as const

export type Style = (typeof styles)[number]

export function getActiveStyle() {
  // In the future, this can read from cookies, session, etc.
  // When that happens, this will need to become async again
  return styles[0]
}

export function getStyle(name: string) {
  return styles.find((style) => style.name === name)
}
