#!/usr/bin/env node
import puppeteer from 'puppeteer'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function crawlShadcnComprehensive() {
  console.log('🚀 Starting COMPREHENSIVE shadcn/ui crawler...\n')

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  const outputDir = path.join(__dirname, 'output', 'shadcn-complete')
  await fs.mkdir(outputDir, { recursive: true })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1920, height: 1080 })

    // First, get ALL component links from the docs
    console.log('📋 Getting component list from shadcn/ui...')
    await page.goto('https://ui.shadcn.com/docs/components/accordion', {
      waitUntil: 'networkidle2',
      timeout: 30000
    })

    const componentLinks = await page.evaluate(() => {
      const links = []
      // Get all sidebar links that are components
      const sidebarLinks = document.querySelectorAll('a[href^="/docs/components/"]')
      sidebarLinks.forEach(link => {
        const href = link.getAttribute('href')
        const text = link.textContent?.trim()
        if (href && text && !href.includes('#')) {
          links.push({
            name: text,
            path: href,
            url: `https://ui.shadcn.com${href}`
          })
        }
      })
      return links
    })

    console.log(`✅ Found ${componentLinks.length} components to crawl`)

    const allComponents = []

    // Crawl each component
    for (let i = 0; i < componentLinks.length; i++) {
      const component = componentLinks[i]
      console.log(`\n[${i + 1}/${componentLinks.length}] Crawling: ${component.name}`)

      try {
        await page.goto(component.url, {
          waitUntil: 'networkidle2',
          timeout: 30000
        })

        // Wait a bit for dynamic content
        await new Promise(resolve => setTimeout(resolve, 1000))

        const componentData = await page.evaluate(() => {
          const data = {
            name: '',
            description: '',
            installation: '',
            usage: [],
            examples: [],
            props: [],
            dependencies: [],
            relatedComponents: []
          }

          // Get component name
          const h1 = document.querySelector('h1')
          if (h1) data.name = h1.textContent?.trim() || ''

          // Get description (usually in a p.lead or first paragraph)
          const lead = document.querySelector('.lead') ||
                       document.querySelector('h1 + p') ||
                       document.querySelector('[class*="description"]')
          if (lead) data.description = lead.textContent?.trim() || ''

          // Get installation command
          const installCode = Array.from(document.querySelectorAll('pre code'))
            .find(el => el.textContent?.includes('npx shadcn'))
          if (installCode) {
            data.installation = installCode.textContent.trim()
          }

          // Get all code examples
          const codeBlocks = document.querySelectorAll('pre code')
          codeBlocks.forEach((block, index) => {
            const code = block.textContent?.trim()
            if (code && !code.includes('npx shadcn')) {
              // Try to detect language
              const classes = block.className
              let language = 'tsx'
              if (classes.includes('language-')) {
                const match = classes.match(/language-(\w+)/)
                if (match) language = match[1]
              }

              // Get title from preceding heading if exists
              const prevHeading = block.closest('div')?.querySelector('h3')
              const title = prevHeading?.textContent?.trim() || `Example ${index + 1}`

              data.examples.push({
                title,
                language,
                code: code.substring(0, 5000) // Limit code length
              })
            }
          })

          // Get props/API table if exists
          const tables = document.querySelectorAll('table')
          tables.forEach(table => {
            const headers = Array.from(table.querySelectorAll('thead th'))
              .map(th => th.textContent?.trim())

            // Check if this is a props table
            if (headers.some(h => h?.toLowerCase().includes('prop') || h?.toLowerCase().includes('name'))) {
              const rows = Array.from(table.querySelectorAll('tbody tr')).map(tr => {
                const cells = Array.from(tr.querySelectorAll('td'))
                return {
                  name: cells[0]?.textContent?.trim(),
                  type: cells[1]?.textContent?.trim(),
                  default: cells[2]?.textContent?.trim(),
                  description: cells[3]?.textContent?.trim()
                }
              })
              data.props = rows
            }
          })

          // Get dependencies
          const depElements = Array.from(document.querySelectorAll('code'))
            .filter(el => {
              const text = el.textContent || ''
              return text.includes('npm install') && !text.includes('shadcn')
            })

          depElements.forEach(el => {
            const text = el.textContent || ''
            const match = text.match(/npm install (.+)/)
            if (match) {
              const deps = match[1].split(' ').filter(d => d && !d.startsWith('-'))
              data.dependencies.push(...deps)
            }
          })

          // Get related components (links in the content)
          const relatedLinks = document.querySelectorAll('a[href^="/docs/components/"]')
          const seen = new Set()
          relatedLinks.forEach(link => {
            const href = link.getAttribute('href')
            const name = link.textContent?.trim()
            if (href && name && !seen.has(name)) {
              seen.add(name)
              data.relatedComponents.push(name)
            }
          })

          return data
        })

        // Add URL to data
        componentData.url = component.url
        componentData.path = component.path

        // Save individual component file
        const filename = component.name.toLowerCase().replace(/\s+/g, '-') + '.json'
        await fs.writeFile(
          path.join(outputDir, filename),
          JSON.stringify(componentData, null, 2),
          'utf-8'
        )

        console.log(`  ✅ ${component.name}: ${componentData.examples.length} examples, ${componentData.props.length} props`)

        allComponents.push(componentData)

        // Small delay to be respectful
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (error) {
        console.error(`  ❌ Failed to crawl ${component.name}:`, error.message)
        allComponents.push({
          name: component.name,
          url: component.url,
          error: error.message
        })
      }
    }

    // Also get blocks
    console.log('\n📦 Crawling shadcn/ui blocks...')
    await page.goto('https://ui.shadcn.com/blocks', {
      waitUntil: 'networkidle2',
      timeout: 30000
    })

    const blocks = await page.evaluate(() => {
      const blockData = []
      const blockElements = document.querySelectorAll('[data-block]')
      blockElements.forEach(block => {
        const name = block.getAttribute('data-block')
        const title = block.querySelector('h3')?.textContent?.trim()
        const description = block.querySelector('p')?.textContent?.trim()
        if (name) {
          blockData.push({ name, title, description })
        }
      })
      return blockData
    })

    console.log(`✅ Found ${blocks.length} blocks`)

    // Save blocks
    await fs.writeFile(
      path.join(outputDir, '_blocks.json'),
      JSON.stringify(blocks, null, 2),
      'utf-8'
    )

    // Generate comprehensive summary
    const summary = {
      crawledAt: new Date().toISOString(),
      totalComponents: allComponents.filter(c => !c.error).length,
      totalExamples: allComponents.reduce((sum, c) => sum + (c.examples?.length || 0), 0),
      totalBlocks: blocks.length,
      components: allComponents.map(c => ({
        name: c.name,
        examples: c.examples?.length || 0,
        props: c.props?.length || 0,
        dependencies: c.dependencies?.length || 0
      })),
      blocks: blocks,
      failedComponents: allComponents.filter(c => c.error).map(c => c.name)
    }

    await fs.writeFile(
      path.join(outputDir, '_summary.json'),
      JSON.stringify(summary, null, 2),
      'utf-8'
    )

    // Generate markdown documentation
    let markdown = '# shadcn/ui Components - Comprehensive Documentation\n\n'
    markdown += `Generated: ${new Date().toISOString()}\n\n`
    markdown += `Total Components: ${summary.totalComponents}\n`
    markdown += `Total Examples: ${summary.totalExamples}\n`
    markdown += `Total Blocks: ${summary.totalBlocks}\n\n`

    markdown += '## Components\n\n'
    allComponents.forEach(comp => {
      if (!comp.error) {
        markdown += `### ${comp.name}\n`
        markdown += `${comp.description || 'No description'}\n\n`
        markdown += `- Examples: ${comp.examples?.length || 0}\n`
        markdown += `- Props: ${comp.props?.length || 0}\n`
        markdown += `- Dependencies: ${comp.dependencies?.join(', ') || 'None'}\n\n`
      }
    })

    await fs.writeFile(
      path.join(outputDir, 'README.md'),
      markdown,
      'utf-8'
    )

    console.log('\n' + '='.repeat(60))
    console.log('🎉 CRAWLING COMPLETE!')
    console.log('='.repeat(60))
    console.log(`📊 Successfully crawled: ${summary.totalComponents} components`)
    console.log(`📝 Total examples collected: ${summary.totalExamples}`)
    console.log(`📦 Total blocks found: ${summary.totalBlocks}`)
    console.log(`💾 Output saved to: ${outputDir}`)
    if (summary.failedComponents.length > 0) {
      console.log(`⚠️  Failed components: ${summary.failedComponents.join(', ')}`)
    }
    console.log('='.repeat(60))

  } catch (error) {
    console.error('❌ Crawler failed:', error)
  } finally {
    await browser.close()
  }
}

// Run the comprehensive crawler
crawlShadcnComprehensive().catch(console.error)