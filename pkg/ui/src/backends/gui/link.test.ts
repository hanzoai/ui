import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from 'vitest'

// Every marketing control reads the router-link context, so what ./link imports
// rides every page of every host: Button alone brought Tooltip, popover and
// floating-ui, some 25 KB. The link that wears a button is ./link-element.
test('the router-link context imports nothing but React', () => {
  const source = readFileSync(join(__dirname, 'link.tsx'), 'utf8')
  const imports = [...source.matchAll(/^import\s[^'"]*['"]([^'"]+)['"]/gm)].map((m) => m[1])
  expect(imports).toEqual(['react'])
})
