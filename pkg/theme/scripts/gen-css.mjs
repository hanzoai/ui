import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateThemesStylesheet } from '../dist/css.js'

const root = fileURLToPath(new URL('..', import.meta.url))
const css = generateThemesStylesheet()
writeFileSync(join(root, 'dist', 'theme.css'), css, 'utf8')
console.log(`@hanzo/theme: wrote dist/theme.css (${css.length} bytes)`)
