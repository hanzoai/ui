#!/usr/bin/env node

import { PlaywrightCrawler, CrawlerConfig } from './playwright-crawler'
import * as path from 'path'
import * as fs from 'fs/promises'

// Define all Radix UI primitive components to crawl
const RADIX_PRIMITIVES = [
  // Form components
  'checkbox',
  'form',
  'label',
  'radio-group',
  'select',
  'slider',
  'switch',
  'toggle',
  'toggle-group',

  // Layout components
  'aspect-ratio',
  'separator',
  'scroll-area',

  // Overlay components
  'alert-dialog',
  'context-menu',
  'dialog',
  'dropdown-menu',
  'hover-card',
  'popover',
  'tooltip',

  // Navigation components
  'menubar',
  'navigation-menu',
  'tabs',
  'toolbar',

  // Display components
  'accordion',
  'avatar',
  'collapsible',
  'progress',

  // Utilities
  'accessible-icon',
  'portal',
  'slot',
  'visually-hidden',

  // Additional components
  'toast'
]

const radixCrawlerConfig: CrawlerConfig = {
  name: 'radix-ui',
  baseUrl: 'https://www.radix-ui.com/primitives/docs',

  selectors: {
    // Component documentation selectors
    componentName: 'h1',
    componentDescription: '.rt-Text.rt-r-size-4',

    // Code examples
    codeBlocks: 'pre code',

    // API Reference
    propsTable: '[data-heading="API Reference"] + div table',
    propsRow: 'tbody tr',
    propName: 'td:first-child code',
    propType: 'td:nth-child(2) code',
    propDefault: 'td:nth-child(3)',
    propDescription: 'td:last-child',

    // Installation
    installationCode: '[data-heading="Installation"] + div pre code',

    // Examples section
    componentCard: '[data-heading="Examples"] + div',

    // Accessibility
    categoryName: '[data-heading="Accessibility"]'
  },

  rateLimit: {
    requestsPerSecond: 2,
    concurrent: 3
  },

  viewport: {
    width: 1920,
    height: 1080
  },

  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 2000,
  headless: true,
  screenshotOnError: true,
  outputDir: '/Users/z/work/hanzo/ui/scrapers/output/radix-ui',
  resumeFromCheckpoint: true,

  // Custom URL patterns for Radix components
  urlPatterns: {
    include: [
      /\/primitives\/docs\/components\/.*/,
      /\/primitives\/docs\/overview\/.*/
    ],
    exclude: [
      /\/themes\/.*/,
      /\/colors\/.*/,
      /\.pdf$/,
      /\#.*/
    ]
  },

  // Custom extractors for Radix-specific data
  customExtractors: {
    extractAccessibility: async (page) => {
      try {
        // Extract accessibility information
        const accessibilitySection = await page.$('[data-heading="Accessibility"]')
        if (!accessibilitySection) return null

        const accessibilityContent = await page.evaluate((el) => {
          const section = el?.nextElementSibling
          if (!section) return null

          return {
            content: section.textContent?.trim(),
            features: Array.from(section.querySelectorAll('li')).map(li => li.textContent?.trim())
          }
        }, accessibilitySection)

        return accessibilityContent
      } catch (error) {
        console.error('Error extracting accessibility:', error)
        return null
      }
    },

    extractKeyboardInteractions: async (page) => {
      try {
        // Extract keyboard interactions table
        const keyboardTable = await page.$('[data-heading="Keyboard Interactions"] + table')
        if (!keyboardTable) return null

        const interactions = await page.evaluate((table) => {
          const rows = Array.from(table.querySelectorAll('tbody tr'))
          return rows.map(row => {
            const cells = Array.from(row.querySelectorAll('td'))
            return {
              key: cells[0]?.textContent?.trim(),
              description: cells[1]?.textContent?.trim()
            }
          })
        }, keyboardTable)

        return interactions
      } catch (error) {
        console.error('Error extracting keyboard interactions:', error)
        return null
      }
    },

    extractDataAttributes: async (page) => {
      try {
        // Extract data attributes
        const dataAttributesSection = await page.$('[data-heading="Data attributes"]')
        if (!dataAttributesSection) return null

        const attributes = await page.evaluate((el) => {
          const section = el?.nextElementSibling
          if (!section) return null

          const table = section.querySelector('table')
          if (!table) return null

          const rows = Array.from(table.querySelectorAll('tbody tr'))
          return rows.map(row => {
            const cells = Array.from(row.querySelectorAll('td'))
            return {
              attribute: cells[0]?.textContent?.trim(),
              values: cells[1]?.textContent?.trim()
            }
          })
        }, dataAttributesSection)

        return attributes
      } catch (error) {
        console.error('Error extracting data attributes:', error)
        return null
      }
    },

    extractApiReference: async (page) => {
      try {
        // Extract complete API reference
        const apiSection = await page.$('[data-heading="API Reference"]')
        if (!apiSection) return null

        const apiData = await page.evaluate((el) => {
          const section = el?.nextElementSibling
          if (!section) return null

          // Get all component parts (Root, Trigger, Content, etc.)
          const parts: any[] = []
          const headers = section.querySelectorAll('h3')

          headers.forEach(header => {
            const componentPart = header.textContent?.trim()
            let nextEl = header.nextElementSibling
            const props: any[] = []

            // Find the props table for this component part
            while (nextEl && nextEl.tagName !== 'H3') {
              if (nextEl.tagName === 'TABLE') {
                const rows = Array.from(nextEl.querySelectorAll('tbody tr'))
                rows.forEach(row => {
                  const cells = Array.from(row.querySelectorAll('td'))
                  props.push({
                    name: cells[0]?.querySelector('code')?.textContent?.trim(),
                    type: cells[1]?.querySelector('code')?.textContent?.trim(),
                    default: cells[2]?.textContent?.trim(),
                    description: cells[3]?.textContent?.trim()
                  })
                })
                break
              }
              nextEl = nextEl.nextElementSibling
            }

            parts.push({
              name: componentPart,
              props
            })
          })

          return parts
        }, apiSection)

        return apiData
      } catch (error) {
        console.error('Error extracting API reference:', error)
        return null
      }
    }
  }
}

async function crawlRadixComponent(componentName: string) {
  const componentUrl = `https://www.radix-ui.com/primitives/docs/components/${componentName}`

  console.log(`\n📦 Crawling component: ${componentName}`)
  console.log(`   URL: ${componentUrl}`)

  const componentConfig: CrawlerConfig = {
    ...radixCrawlerConfig,
    name: `radix-${componentName}`,
    baseUrl: componentUrl,
    outputDir: path.join(radixCrawlerConfig.outputDir!, componentName),
    maxPages: 5 // Limit pages per component
  }

  const crawler = new PlaywrightCrawler(componentConfig)

  try {
    await crawler.initialize()
    const result = await crawler.crawl()

    // Save component-specific results
    const outputDir = path.join(radixCrawlerConfig.outputDir!, componentName)
    await fs.mkdir(outputDir, { recursive: true })

    // Save JSON data
    await crawler.saveResults(path.join(outputDir, `${componentName}.json`))

    // Save Markdown documentation
    await crawler.saveAsMarkdown(path.join(outputDir, `${componentName}.md`))

    // Save component summary
    const summary = {
      name: componentName,
      url: componentUrl,
      crawledAt: new Date().toISOString(),
      componentsFound: result.components.length,
      success: result.success,
      errors: result.metadata.errors.length
    }

    await fs.writeFile(
      path.join(outputDir, 'summary.json'),
      JSON.stringify(summary, null, 2)
    )

    console.log(`   ✅ Successfully crawled ${componentName}`)
    console.log(`   📊 Components found: ${result.components.length}`)

    return summary

  } catch (error) {
    console.error(`   ❌ Failed to crawl ${componentName}:`, error)
    return {
      name: componentName,
      url: componentUrl,
      crawledAt: new Date().toISOString(),
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  } finally {
    await crawler.cleanup()
  }
}

async function crawlAllRadixComponents() {
  console.log('🚀 Starting Radix UI components crawl')
  console.log(`📋 Total components to crawl: ${RADIX_PRIMITIVES.length}`)

  const startTime = Date.now()
  const results: any[] = []

  // Create main output directory
  await fs.mkdir(radixCrawlerConfig.outputDir!, { recursive: true })

  // Crawl each component sequentially to avoid rate limiting
  for (const component of RADIX_PRIMITIVES) {
    const result = await crawlRadixComponent(component)
    results.push(result)

    // Add delay between components
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  // Generate overall summary
  const summary = {
    crawlStarted: new Date(startTime).toISOString(),
    crawlCompleted: new Date().toISOString(),
    duration: `${((Date.now() - startTime) / 1000).toFixed(2)} seconds`,
    totalComponents: RADIX_PRIMITIVES.length,
    successful: results.filter(r => r.success !== false).length,
    failed: results.filter(r => r.success === false).length,
    components: results
  }

  // Save overall summary
  await fs.writeFile(
    path.join(radixCrawlerConfig.outputDir!, 'crawl-summary.json'),
    JSON.stringify(summary, null, 2)
  )

  // Generate master documentation file
  await generateMasterDocumentation(results)

  console.log('\n' + '='.repeat(50))
  console.log('✨ Radix UI crawl completed!')
  console.log(`📊 Summary:`)
  console.log(`   - Total components: ${summary.totalComponents}`)
  console.log(`   - Successful: ${summary.successful}`)
  console.log(`   - Failed: ${summary.failed}`)
  console.log(`   - Duration: ${summary.duration}`)
  console.log(`   - Output directory: ${radixCrawlerConfig.outputDir}`)
  console.log('='.repeat(50))

  // List failed components if any
  if (summary.failed > 0) {
    console.log('\n⚠️ Failed components:')
    results
      .filter(r => r.success === false)
      .forEach(r => console.log(`   - ${r.name}: ${r.error}`))
  }
}

async function generateMasterDocumentation(results: any[]) {
  let markdown = '# Radix UI Components Documentation\n\n'
  markdown += `Generated: ${new Date().toISOString()}\n\n`
  markdown += '## Overview\n\n'
  markdown += 'Complete documentation for all Radix UI primitive components.\n\n'

  // Table of contents
  markdown += '## Table of Contents\n\n'

  const categories = {
    'Form Components': ['checkbox', 'form', 'label', 'radio-group', 'select', 'slider', 'switch', 'toggle', 'toggle-group'],
    'Layout Components': ['aspect-ratio', 'separator', 'scroll-area'],
    'Overlay Components': ['alert-dialog', 'context-menu', 'dialog', 'dropdown-menu', 'hover-card', 'popover', 'tooltip'],
    'Navigation Components': ['menubar', 'navigation-menu', 'tabs', 'toolbar'],
    'Display Components': ['accordion', 'avatar', 'collapsible', 'progress'],
    'Utility Components': ['accessible-icon', 'portal', 'slot', 'visually-hidden', 'toast']
  }

  for (const [category, components] of Object.entries(categories)) {
    markdown += `\n### ${category}\n\n`
    for (const component of components) {
      const result = results.find(r => r.name === component)
      if (result && result.success !== false) {
        markdown += `- [${component}](./${component}/${component}.md)\n`
      }
    }
  }

  // Installation section
  markdown += '\n## Installation\n\n'
  markdown += '```bash\n'
  markdown += '# Install individual components\n'
  markdown += 'npm install @radix-ui/react-[component-name]\n\n'
  markdown += '# Example:\n'
  markdown += 'npm install @radix-ui/react-dialog\n'
  markdown += 'npm install @radix-ui/react-dropdown-menu\n'
  markdown += '```\n\n'

  // Usage section
  markdown += '## Basic Usage\n\n'
  markdown += 'All Radix UI components are unstyled and accessible by default:\n\n'
  markdown += '```tsx\n'
  markdown += 'import * as Dialog from "@radix-ui/react-dialog"\n\n'
  markdown += '<Dialog.Root>\n'
  markdown += '  <Dialog.Trigger>Open</Dialog.Trigger>\n'
  markdown += '  <Dialog.Portal>\n'
  markdown += '    <Dialog.Overlay />\n'
  markdown += '    <Dialog.Content>\n'
  markdown += '      <Dialog.Title>Title</Dialog.Title>\n'
  markdown += '      <Dialog.Description>Description</Dialog.Description>\n'
  markdown += '      <Dialog.Close>Close</Dialog.Close>\n'
  markdown += '    </Dialog.Content>\n'
  markdown += '  </Dialog.Portal>\n'
  markdown += '</Dialog.Root>\n'
  markdown += '```\n\n'

  // Summary statistics
  markdown += '## Crawl Summary\n\n'
  markdown += `- **Total Components**: ${results.length}\n`
  markdown += `- **Successfully Crawled**: ${results.filter(r => r.success !== false).length}\n`
  markdown += `- **Failed**: ${results.filter(r => r.success === false).length}\n`
  markdown += `- **Generated**: ${new Date().toISOString()}\n\n`

  await fs.writeFile(
    path.join(radixCrawlerConfig.outputDir!, 'README.md'),
    markdown
  )
}

// Main execution
if (require.main === module) {
  crawlAllRadixComponents().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

export { crawlRadixComponent, crawlAllRadixComponents }