#!/usr/bin/env node
import { PlaywrightCrawler } from './playwright-crawler'
import shadcnConfig from './configs/shadcn-ui.config'
import * as fs from 'fs/promises'
import * as path from 'path'

async function crawlShadcnUI() {
  console.log('🚀 Starting shadcn/ui crawler...')

  const outputDir = path.join(__dirname, 'output', 'shadcn-ui')
  await fs.mkdir(outputDir, { recursive: true })

  // Initialize crawler
  const crawler = new PlaywrightCrawler({
    ...shadcnConfig,
    outputPath: outputDir,
    format: 'both' as const,
    saveScreenshots: true,
    maxPages: 100,
    headless: true,
  })

  try {
    // Get all component URLs from the docs
    const componentUrls: string[] = []

    // Main component categories
    const categories = [
      'accordion', 'alert', 'alert-dialog', 'aspect-ratio', 'avatar', 'badge',
      'breadcrumb', 'button', 'calendar', 'card', 'carousel', 'checkbox',
      'collapsible', 'combobox', 'command', 'context-menu', 'data-table',
      'date-picker', 'dialog', 'drawer', 'dropdown-menu', 'form', 'hover-card',
      'input', 'input-otp', 'label', 'menubar', 'navigation-menu', 'pagination',
      'popover', 'progress', 'radio-group', 'resizable', 'scroll-area', 'select',
      'separator', 'sheet', 'skeleton', 'slider', 'sonner', 'switch', 'table',
      'tabs', 'textarea', 'toast', 'toggle', 'toggle-group', 'tooltip'
    ]

    // Build component URLs
    for (const component of categories) {
      componentUrls.push(`https://ui.shadcn.com/docs/components/${component}`)
    }

    // Also get blocks
    const blocks = [
      'authentication-01', 'authentication-02', 'authentication-03',
      'authentication-04', 'dashboard-01', 'dashboard-02', 'dashboard-03',
      'dashboard-04', 'dashboard-05', 'dashboard-06', 'dashboard-07'
    ]

    for (const block of blocks) {
      componentUrls.push(`https://ui.shadcn.com/blocks#${block}`)
    }

    console.log(`📋 Found ${componentUrls.length} components to crawl`)

    // Custom extractors for shadcn
    const extractors = {
      async extractComponent(page: any) {
        const data: any = {}

        // Get component name
        data.name = await page.$eval('h1', (el: any) => el.textContent?.trim())
          .catch(() => null)

        // Get description
        data.description = await page.$eval('.lead', (el: any) => el.textContent?.trim())
          .catch(() => null)

        // Get installation instructions
        const installSteps: string[] = []
        const installSections = await page.$$('.steps > div')
        for (const section of installSections) {
          const text = await section.textContent()
          if (text) installSteps.push(text.trim())
        }
        data.installation = installSteps

        // Get code examples
        const codeBlocks: any[] = []
        const codeElements = await page.$$('pre code')
        for (const codeEl of codeElements) {
          const code = await codeEl.textContent()
          const lang = await codeEl.evaluate((el: any) => {
            const className = el.className || ''
            const match = className.match(/language-(\w+)/)
            return match ? match[1] : 'plaintext'
          })
          if (code) {
            codeBlocks.push({ code: code.trim(), language: lang })
          }
        }
        data.codeExamples = codeBlocks

        // Get props/API
        const propsData: any[] = []
        const propsTables = await page.$$('table')
        for (const table of propsTables) {
          const headers = await table.$$eval('thead th', (els: any[]) =>
            els.map(el => el.textContent?.trim())
          )
          const rows = await table.$$eval('tbody tr', (els: any[]) =>
            els.map(row => {
              const cells = row.querySelectorAll('td')
              return Array.from(cells).map((cell: any) => cell.textContent?.trim())
            })
          )
          if (headers.length && rows.length) {
            propsData.push({ headers, rows })
          }
        }
        data.props = propsData

        // Get dependencies
        const deps = await page.$$eval('code:has-text("npm install")', (els: any[]) =>
          els.map(el => {
            const text = el.textContent || ''
            const match = text.match(/npm install (.+)/)
            return match ? match[1].trim() : null
          }).filter(Boolean)
        ).catch(() => [])
        data.dependencies = [...new Set(deps)]

        return data
      }
    }

    // Start crawling
    const results = await crawler.crawl(componentUrls, extractors)

    // Save individual component files
    for (const [url, data] of Object.entries(results.pages)) {
      const componentName = url.split('/').pop()?.replace('#', '-') || 'unknown'
      const componentPath = path.join(outputDir, `${componentName}.json`)
      await fs.writeFile(
        componentPath,
        JSON.stringify(data, null, 2),
        'utf-8'
      )
      console.log(`✅ Saved ${componentName}`)
    }

    // Save summary
    const summary = {
      crawledAt: new Date().toISOString(),
      totalComponents: Object.keys(results.pages).length,
      components: Object.keys(results.pages).map(url => {
        const name = url.split('/').pop()?.replace('#', '-') || 'unknown'
        return { name, url }
      }),
      metadata: results.metadata
    }

    await fs.writeFile(
      path.join(outputDir, 'summary.json'),
      JSON.stringify(summary, null, 2),
      'utf-8'
    )

    console.log(`\n✨ Crawling complete! Saved ${Object.keys(results.pages).length} components to ${outputDir}`)

    await crawler.close()
  } catch (error) {
    console.error('❌ Crawling failed:', error)
    await crawler.close()
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  crawlShadcnUI().catch(console.error)
}

export { crawlShadcnUI }