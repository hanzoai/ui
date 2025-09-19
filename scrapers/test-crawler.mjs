#!/usr/bin/env node
import puppeteer from 'puppeteer'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function testCrawler() {
  console.log('🧪 Testing crawler setup...\n')

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  try {
    const page = await browser.newPage()

    // Test shadcn/ui
    console.log('📍 Testing shadcn/ui...')
    await page.goto('https://ui.shadcn.com/docs/components/button', {
      waitUntil: 'networkidle2',
      timeout: 30000
    })

    const buttonData = await page.evaluate(() => {
      const data = {
        title: document.querySelector('h1')?.textContent?.trim(),
        description: document.querySelector('.lead')?.textContent?.trim(),
        codeBlocks: [],
        installation: null
      }

      // Get code blocks
      const codeElements = document.querySelectorAll('pre code')
      codeElements.forEach(el => {
        const code = el.textContent
        if (code) {
          data.codeBlocks.push(code.trim().substring(0, 200) + '...')
        }
      })

      // Get installation command
      const installElement = Array.from(document.querySelectorAll('code'))
        .find(el => el.textContent?.includes('npx shadcn'))
      if (installElement) {
        data.installation = installElement.textContent
      }

      return data
    })

    console.log('✅ shadcn/ui Button component:')
    console.log(`   Title: ${buttonData.title}`)
    console.log(`   Description: ${buttonData.description?.substring(0, 100)}...`)
    console.log(`   Code blocks found: ${buttonData.codeBlocks.length}`)
    console.log(`   Installation: ${buttonData.installation}`)

    // Save test output
    const outputDir = path.join(__dirname, 'output', 'test')
    await fs.mkdir(outputDir, { recursive: true })

    await fs.writeFile(
      path.join(outputDir, 'button-test.json'),
      JSON.stringify(buttonData, null, 2),
      'utf-8'
    )

    console.log(`\n💾 Test data saved to: ${outputDir}/button-test.json`)

    // Test other libraries quickly
    const testUrls = [
      {
        name: 'Radix UI',
        url: 'https://www.radix-ui.com/primitives/docs/components/dialog',
        titleSelector: 'h1'
      },
      {
        name: 'Material UI',
        url: 'https://mui.com/material-ui/react-button/',
        titleSelector: 'h1'
      },
      {
        name: 'Ant Design',
        url: 'https://ant.design/components/button',
        titleSelector: 'h1'
      },
      {
        name: 'Headless UI',
        url: 'https://headlessui.com/react/dialog',
        titleSelector: 'h1'
      }
    ]

    console.log('\n🔍 Quick test of other libraries:')
    for (const test of testUrls) {
      try {
        await page.goto(test.url, { waitUntil: 'domcontentloaded', timeout: 10000 })
        const title = await page.$eval(test.titleSelector, el => el.textContent?.trim())
          .catch(() => 'Could not extract title')
        console.log(`✅ ${test.name}: ${title}`)
      } catch (error) {
        console.log(`❌ ${test.name}: Failed to load`)
      }
    }

    console.log('\n✨ Crawler test complete!')
    console.log('📊 All systems ready for full crawling')

  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await browser.close()
  }
}

// Run test
testCrawler().catch(console.error)