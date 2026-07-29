import { chromium } from 'playwright'
import { pathToFileURL } from 'node:url'
import { join } from 'node:path'
const url = pathToFileURL(join(process.cwd(), 'scripts/.world-proof.html')).href
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 })
await p.goto(url, { waitUntil: 'networkidle' })
await p.screenshot({ path: 'scripts/.world-proof.png', fullPage: true })
await b.close()
console.log('shot written')
