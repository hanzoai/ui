import { createRequire } from 'node:module'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const withGui = require('@hanzo/ui/next')

export default withGui(
  {
    output: 'export',
  },
  dirname(fileURLToPath(import.meta.url)),
)
