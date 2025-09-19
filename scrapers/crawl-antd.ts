import { chromium, Browser, Page } from 'playwright'
import * as fs from 'fs/promises'
import * as path from 'path'
import { antDesignConfig } from './configs/ant-design.config'

interface ComponentData {
  name: string
  category: string
  url: string
  title: string
  description: string
  examples: Example[]
  api: ApiTable | null
  whenToUse: string | null
  code: string[]
  imports: string[]
}

interface Example {
  title: string
  description: string
  preview: string
  code: string
}

interface ApiTable {
  props: ApiProp[]
}

interface ApiProp {
  property: string
  description: string
  type: string
  default: string
}

class AntDesignCrawler {
  private browser: Browser | null = null
  private page: Page | null = null
  private outputDir = '/Users/z/work/hanzo/ui/scrapers/output/ant-design'
  private processedComponents = new Set<string>()

  async initialize() {
    console.log('Initializing Playwright browser...')
    this.browser = await chromium.launch({
      headless: true,
      args: ['--disable-blink-features=AutomationControlled']
    })
    this.page = await this.browser.newPage()

    // Set viewport and user agent
    await this.page.setViewportSize({ width: 1920, height: 1080 })
    await this.page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9'
    })

    // Create output directory structure
    await this.ensureOutputDirectories()
  }

  async ensureOutputDirectories() {
    const categories = Object.keys(antDesignConfig.categories)

    await fs.mkdir(this.outputDir, { recursive: true })

    for (const category of categories) {
      await fs.mkdir(path.join(this.outputDir, category.toLowerCase().replace(' ', '-')), {
        recursive: true
      })
    }

    await fs.mkdir(path.join(this.outputDir, 'raw'), { recursive: true })
    await fs.mkdir(path.join(this.outputDir, 'metadata'), { recursive: true })
  }

  async crawl() {
    if (!this.page) throw new Error('Browser not initialized')

    console.log('Starting Ant Design component extraction...')

    // Create component URLs from categories
    const componentUrls: Array<{ name: string; category: string; url: string }> = []

    for (const [category, components] of Object.entries(antDesignConfig.categories)) {
      for (const component of components) {
        componentUrls.push({
          name: component,
          category,
          url: `${antDesignConfig.baseUrls.docs}/components/${component}`
        })
      }
    }

    console.log(`Found ${componentUrls.length} components to extract`)

    // Process components with rate limiting
    const results: ComponentData[] = []
    const { maxConcurrent, delayMs } = antDesignConfig.rateLimit

    for (let i = 0; i < componentUrls.length; i += maxConcurrent) {
      const batch = componentUrls.slice(i, i + maxConcurrent)
      const batchPromises = batch.map(comp => this.extractComponent(comp))

      const batchResults = await Promise.allSettled(batchPromises)

      for (const result of batchResults) {
        if (result.status === 'fulfilled' && result.value) {
          results.push(result.value)
        } else if (result.status === 'rejected') {
          console.error('Failed to extract component:', result.reason)
        }
      }

      // Rate limiting delay
      if (i + maxConcurrent < componentUrls.length) {
        await this.delay(delayMs)
      }

      console.log(`Progress: ${Math.min(i + maxConcurrent, componentUrls.length)}/${componentUrls.length}`)
    }

    // Save metadata
    await this.saveMetadata(results)

    console.log(`Extraction complete. Processed ${results.length} components`)
  }

  async extractComponent(component: { name: string; category: string; url: string }): Promise<ComponentData | null> {
    if (!this.page) throw new Error('Browser not initialized')

    try {
      console.log(`Extracting: ${component.name} (${component.category})`)

      // Navigate to component page
      await this.page.goto(component.url, {
        waitUntil: 'networkidle',
        timeout: 30000
      })

      // Wait for content to load
      await this.page.waitForSelector('h1', { timeout: 10000 })

      // Extract component data
      const data: ComponentData = {
        name: component.name,
        category: component.category,
        url: component.url,
        title: await this.extractTitle(),
        description: await this.extractDescription(),
        examples: await this.extractExamples(),
        api: await this.extractApiTable(),
        whenToUse: await this.extractWhenToUse(),
        code: await this.extractCodeSnippets(),
        imports: await this.extractImports()
      }

      // Save component data
      await this.saveComponent(data)

      this.processedComponents.add(component.name)

      return data
    } catch (error) {
      console.error(`Failed to extract ${component.name}:`, error)
      return null
    }
  }

  async extractTitle(): Promise<string> {
    if (!this.page) return ''

    try {
      const title = await this.page.textContent(antDesignConfig.selectors.componentTitle || 'h1')
      return title?.trim() || ''
    } catch {
      return ''
    }
  }

  async extractDescription(): Promise<string> {
    if (!this.page) return ''

    try {
      const desc = await this.page.textContent(antDesignConfig.selectors.componentDescription || '.markdown > p:first-child')
      return desc?.trim() || ''
    } catch {
      return ''
    }
  }

  async extractExamples(): Promise<Example[]> {
    if (!this.page) return []

    const examples: Example[] = []

    try {
      const exampleElements = await this.page.$$(antDesignConfig.selectors.examples || '.code-box')

      for (const element of exampleElements) {
        try {
          // Extract example title
          const titleElement = await element.$(antDesignConfig.selectors.demoTitle || '.code-box-title')
          const title = await titleElement?.textContent() || ''

          // Extract example description
          const descElement = await element.$(antDesignConfig.selectors.demoDescription || '.code-box-description')
          const description = await descElement?.textContent() || ''

          // Extract preview HTML
          const previewElement = await element.$(antDesignConfig.selectors.componentPreview || '.code-box-demo')
          const preview = await previewElement?.innerHTML() || ''

          // Extract code
          const codeButton = await element.$('.code-box-actions button[aria-label*="code"]')
          if (codeButton) {
            await codeButton.click()
            await this.page.waitForTimeout(500)
          }

          const codeElement = await element.$('.highlight pre code')
          const code = await codeElement?.textContent() || ''

          examples.push({
            title: title.trim(),
            description: description.trim(),
            preview: preview.trim(),
            code: code.trim()
          })
        } catch (err) {
          console.warn('Failed to extract example:', err)
        }
      }
    } catch (error) {
      console.warn('Failed to extract examples:', error)
    }

    return examples
  }

  async extractApiTable(): Promise<ApiTable | null> {
    if (!this.page) return null

    try {
      const apiTable = await this.page.$(antDesignConfig.selectors.apiProps || '.component-api table')
      if (!apiTable) return null

      const props: ApiProp[] = []
      const rows = await apiTable.$$('tbody tr')

      for (const row of rows) {
        const cells = await row.$$('td')
        if (cells.length >= 4) {
          const property = await cells[0].textContent() || ''
          const description = await cells[1].textContent() || ''
          const type = await cells[2].textContent() || ''
          const defaultValue = await cells[3].textContent() || ''

          props.push({
            property: property.trim(),
            description: description.trim(),
            type: type.trim(),
            default: defaultValue.trim()
          })
        }
      }

      return { props }
    } catch (error) {
      console.warn('Failed to extract API table:', error)
      return null
    }
  }

  async extractWhenToUse(): Promise<string | null> {
    if (!this.page) return null

    try {
      // Find "When To Use" section
      const whenToUseHeading = await this.page.$('h2:has-text("When To Use")')
      if (!whenToUseHeading) return null

      // Get the next sibling element (usually a ul or p)
      const content = await this.page.evaluate((el) => {
        const heading = el as HTMLElement
        const nextElement = heading.nextElementSibling
        return nextElement?.textContent || ''
      }, whenToUseHeading)

      return content.trim()
    } catch {
      return null
    }
  }

  async extractCodeSnippets(): Promise<string[]> {
    if (!this.page) return []

    const snippets: string[] = []

    try {
      const codeElements = await this.page.$$(antDesignConfig.selectors.componentCode || '.highlight pre code')

      for (const element of codeElements) {
        const code = await element.textContent()
        if (code) {
          snippets.push(code.trim())
        }
      }
    } catch (error) {
      console.warn('Failed to extract code snippets:', error)
    }

    return snippets
  }

  async extractImports(): Promise<string[]> {
    if (!this.page) return []

    const imports = new Set<string>()

    try {
      // Extract from code snippets
      const codeElements = await this.page.$$('.highlight pre code')

      for (const element of codeElements) {
        const code = await element.textContent() || ''
        const importMatches = code.match(/import\s+.*?from\s+['"].*?['"]/g) || []
        importMatches.forEach(imp => imports.add(imp))
      }
    } catch (error) {
      console.warn('Failed to extract imports:', error)
    }

    return Array.from(imports)
  }

  async saveComponent(data: ComponentData) {
    const categoryDir = path.join(
      this.outputDir,
      data.category.toLowerCase().replace(' ', '-')
    )

    const componentFile = path.join(categoryDir, `${data.name}.json`)

    await fs.writeFile(
      componentFile,
      JSON.stringify(data, null, 2),
      'utf-8'
    )

    // Save raw examples as separate files
    if (data.examples.length > 0) {
      const examplesDir = path.join(categoryDir, data.name)
      await fs.mkdir(examplesDir, { recursive: true })

      for (let i = 0; i < data.examples.length; i++) {
        const example = data.examples[i]
        const exampleFile = path.join(examplesDir, `example-${i + 1}.tsx`)
        await fs.writeFile(exampleFile, example.code || '', 'utf-8')
      }
    }
  }

  async saveMetadata(components: ComponentData[]) {
    const metadata = {
      timestamp: new Date().toISOString(),
      totalComponents: components.length,
      categories: {} as Record<string, number>,
      components: components.map(c => ({
        name: c.name,
        category: c.category,
        examplesCount: c.examples.length,
        hasApi: c.api !== null,
        url: c.url
      }))
    }

    // Count components per category
    for (const component of components) {
      metadata.categories[component.category] = (metadata.categories[component.category] || 0) + 1
    }

    await fs.writeFile(
      path.join(this.outputDir, 'metadata', 'extraction-metadata.json'),
      JSON.stringify(metadata, null, 2),
      'utf-8'
    )

    // Save component index
    const index = {
      version: antDesignConfig.metadata.version,
      framework: antDesignConfig.metadata.framework,
      components: {} as Record<string, string[]>
    }

    for (const [category, componentNames] of Object.entries(antDesignConfig.categories)) {
      index.components[category] = componentNames
    }

    await fs.writeFile(
      path.join(this.outputDir, 'metadata', 'component-index.json'),
      JSON.stringify(index, null, 2),
      'utf-8'
    )
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close()
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Main execution
async function main() {
  const crawler = new AntDesignCrawler()

  try {
    await crawler.initialize()
    await crawler.crawl()

    console.log('\n✅ Ant Design component extraction completed successfully!')
    console.log(`📁 Output saved to: ${crawler['outputDir']}`)
  } catch (error) {
    console.error('❌ Crawler failed:', error)
    process.exit(1)
  } finally {
    await crawler.cleanup()
  }
}

// Run the crawler
if (require.main === module) {
  main().catch(console.error)
}

export { AntDesignCrawler }