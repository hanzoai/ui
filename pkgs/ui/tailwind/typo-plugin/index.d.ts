declare function plugin(options?: Partial<{ className: string; target: 'modern' | 'legacy', base: number }>): {
  handler: () => void
}

declare namespace plugin {
  const __isOptionsFunction: true
}

export = plugin
