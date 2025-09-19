#!/usr/bin/env node
import { PlaywrightCrawler } from './playwright-crawler'
import * as configs from './configs'
import * as fs from 'fs/promises'
import * as path from 'path'

interface CrawlerResult {
  library: string
  success: boolean
  componentsCount: number
  error?: string
}

/**
 * Generic crawler for any UI library
 */
async function crawlLibrary(
  libraryName: string,
  config: any,
  componentPaths: string[]
): Promise<CrawlerResult> {
  console.log(`\n🚀 Starting ${libraryName} crawler...`)

  const outputDir = path.join(__dirname, 'output', libraryName.toLowerCase().replace(/\s+/g, '-'))
  await fs.mkdir(outputDir, { recursive: true })

  const crawler = new PlaywrightCrawler({
    ...config,
    outputPath: outputDir,
    format: 'both' as const,
    saveScreenshots: false,
    maxPages: componentPaths.length,
    headless: true,
  })

  try {
    // Build full URLs
    const urls = componentPaths.map(path => {
      if (path.startsWith('http')) return path
      return new URL(path, config.baseUrls.docs || config.baseUrls.components).toString()
    })

    console.log(`📋 Crawling ${urls.length} ${libraryName} components...`)

    // Custom extractors based on library type
    const extractors = {
      async extractComponent(page: any) {
        const data: any = {}

        // Get component name
        data.name = await page.$eval(
          config.selectors.componentTitle || 'h1',
          (el: any) => el.textContent?.trim()
        ).catch(() => null)

        // Get description
        data.description = await page.$eval(
          config.selectors.componentDescription || '.description, .lead, [class*="description"]',
          (el: any) => el.textContent?.trim()
        ).catch(() => null)

        // Get code examples
        const codeBlocks: any[] = []
        const codeSelector = config.selectors.componentCode || 'pre code, .code-block'
        const codeElements = await page.$$(codeSelector)

        for (const codeEl of codeElements) {
          const code = await codeEl.textContent()
          const lang = await codeEl.evaluate((el: any) => {
            const className = el.className || ''
            const match = className.match(/language-(\w+)/)
            return match ? match[1] : 'jsx'
          })
          if (code) {
            codeBlocks.push({ code: code.trim(), language: lang })
          }
        }
        data.codeExamples = codeBlocks

        // Get props/API table
        if (config.selectors.propsTable) {
          const propsData = await page.$eval(config.selectors.propsTable, (table: any) => {
            const headers = Array.from(table.querySelectorAll('thead th'))
              .map((th: any) => th.textContent?.trim())
            const rows = Array.from(table.querySelectorAll('tbody tr'))
              .map((tr: any) => {
                return Array.from(tr.querySelectorAll('td'))
                  .map((td: any) => td.textContent?.trim())
              })
            return { headers, rows }
          }).catch(() => null)
          if (propsData) data.props = propsData
        }

        return data
      }
    }

    // Start crawling
    const results = await crawler.crawl(urls.slice(0, 10), extractors) // Limit to 10 for demo

    // Save results
    let componentCount = 0
    for (const [url, data] of Object.entries(results.pages)) {
      if (data && Object.keys(data).length > 0) {
        const componentName = url.split('/').pop()?.replace(/[#?].*/g, '') || `component-${componentCount}`
        const componentPath = path.join(outputDir, `${componentName}.json`)
        await fs.writeFile(
          componentPath,
          JSON.stringify(data, null, 2),
          'utf-8'
        )
        componentCount++
      }
    }

    // Save summary
    const summary = {
      library: libraryName,
      crawledAt: new Date().toISOString(),
      totalComponents: componentCount,
      components: Object.entries(results.pages)
        .filter(([_, data]) => data && Object.keys(data).length > 0)
        .map(([url, data]: [string, any]) => ({
          name: data.name || url.split('/').pop(),
          url
        })),
      metadata: results.metadata
    }

    await fs.writeFile(
      path.join(outputDir, 'summary.json'),
      JSON.stringify(summary, null, 2),
      'utf-8'
    )

    console.log(`✅ ${libraryName}: Saved ${componentCount} components`)

    await crawler.close()

    return {
      library: libraryName,
      success: true,
      componentsCount: componentCount
    }
  } catch (error) {
    console.error(`❌ ${libraryName} crawling failed:`, error)
    await crawler.close()

    return {
      library: libraryName,
      success: false,
      componentsCount: 0,
      error: (error as Error).message
    }
  }
}

/**
 * Crawl all UI libraries
 */
async function crawlAll() {
  console.log('🎯 Starting comprehensive UI library crawling...\n')

  const libraries = [
    {
      name: 'shadcn/ui',
      config: configs.shadcnUIConfig,
      paths: [
        'accordion', 'alert', 'alert-dialog', 'avatar', 'badge', 'button',
        'calendar', 'card', 'checkbox', 'dialog', 'dropdown-menu', 'form',
        'input', 'label', 'popover', 'select', 'separator', 'slider',
        'switch', 'table', 'tabs', 'textarea', 'toast', 'toggle'
      ].map(c => `/docs/components/${c}`)
    },
    {
      name: 'Radix UI',
      config: configs.radixUIConfig,
      paths: [
        'accordion', 'alert-dialog', 'avatar', 'checkbox', 'dialog',
        'dropdown-menu', 'hover-card', 'label', 'popover', 'progress',
        'radio-group', 'select', 'separator', 'slider', 'switch',
        'tabs', 'toast', 'toggle', 'tooltip'
      ].map(c => `/docs/primitives/${c}`)
    },
    {
      name: 'Material UI',
      config: configs.materialUIConfig,
      paths: [
        'button', 'checkbox', 'text-field', 'select', 'slider',
        'switch', 'radio', 'card', 'dialog', 'snackbar', 'table',
        'tabs', 'avatar', 'badge', 'chip', 'list', 'menu',
        'stepper', 'tooltip', 'typography'
      ].map(c => `/components/${c}`)
    },
    {
      name: 'Ant Design',
      config: configs.antDesignConfig,
      paths: [
        'button', 'icon', 'typography', 'divider', 'grid', 'layout',
        'breadcrumb', 'menu', 'pagination', 'steps', 'form', 'input',
        'select', 'checkbox', 'radio', 'switch', 'slider', 'datepicker',
        'upload', 'rate'
      ].map(c => `/components/${c}`)
    },
    {
      name: 'Headless UI',
      config: configs.headlessUIConfig,
      paths: [
        'dialog', 'disclosure', 'menu', 'popover', 'listbox',
        'combobox', 'switch', 'radiogroup', 'transition'
      ].map(c => `/${c}`)
    },
    {
      name: 'Chakra UI',
      config: configs.chakraUIConfig,
      paths: [
        'button', 'checkbox', 'input', 'select', 'slider', 'switch',
        'textarea', 'radio', 'form-control', 'alert', 'toast', 'modal',
        'drawer', 'popover', 'tooltip', 'accordion', 'tabs', 'menu',
        'avatar', 'badge'
      ].map(c => `/docs/components/${c}`)
    }
  ]

  const results: CrawlerResult[] = []

  // Crawl each library sequentially to be respectful
  for (const lib of libraries) {
    const result = await crawlLibrary(lib.name, lib.config, lib.paths)
    results.push(result)

    // Wait between libraries to be respectful
    if (lib !== libraries[libraries.length - 1]) {
      console.log('⏳ Waiting 5 seconds before next library...')
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
  }

  // Generate final report
  console.log('\n' + '='.repeat(60))
  console.log('📊 CRAWLING COMPLETE - FINAL REPORT')
  console.log('='.repeat(60))

  const totalComponents = results.reduce((sum, r) => sum + r.componentsCount, 0)
  const successfulLibraries = results.filter(r => r.success).length

  results.forEach(result => {
    const status = result.success ? '✅' : '❌'
    console.log(`${status} ${result.library}: ${result.componentsCount} components`)
    if (result.error) {
      console.log(`   Error: ${result.error}`)
    }
  })

  console.log('\n' + '-'.repeat(60))
  console.log(`📈 Total: ${totalComponents} components from ${successfulLibraries}/${libraries.length} libraries`)
  console.log('📁 Output saved to: ./scrapers/output/')
  console.log('='.repeat(60))

  // Save overall summary
  const overallSummary = {
    crawledAt: new Date().toISOString(),
    totalLibraries: libraries.length,
    successfulLibraries,
    totalComponents,
    libraries: results
  }

  await fs.writeFile(
    path.join(__dirname, 'output', 'crawl-summary.json'),
    JSON.stringify(overallSummary, null, 2),
    'utf-8'
  )
}

// Run if called directly
if (require.main === module) {
  crawlAll().catch(console.error)
}

export { crawlAll, crawlLibrary }