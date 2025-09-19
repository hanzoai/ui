#!/usr/bin/env node

/**
 * Simple demo of the Playwright Crawler
 * This script demonstrates basic crawling without TypeScript compilation
 */

import { chromium } from 'playwright';

async function simpleCrawl(url, selectors) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log(`🔍 Crawling: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle' });

    const results = {
      url,
      timestamp: new Date().toISOString(),
      data: {}
    };

    // Extract title
    results.data.title = await page.title();

    // Extract main heading
    if (selectors.heading) {
      const heading = await page.$(selectors.heading);
      if (heading) {
        results.data.heading = await heading.textContent();
      }
    }

    // Extract description
    if (selectors.description) {
      const desc = await page.$(selectors.description);
      if (desc) {
        results.data.description = await desc.textContent();
      }
    }

    // Extract code blocks
    if (selectors.codeBlocks) {
      const codeBlocks = await page.$$(selectors.codeBlocks);
      results.data.codeExamples = [];

      for (const block of codeBlocks.slice(0, 3)) { // Limit to first 3
        const code = await block.textContent();
        if (code) {
          results.data.codeExamples.push(code.trim());
        }
      }
    }

    // Extract links to other components
    if (selectors.componentLinks) {
      const links = await page.$$eval(selectors.componentLinks, elements =>
        elements.map(el => ({
          text: el.textContent,
          href: el.href
        }))
      );
      results.data.relatedComponents = links.slice(0, 10); // Limit to 10
    }

    return results;

  } catch (error) {
    console.error(`❌ Error crawling ${url}:`, error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

// Demo: Crawl shadcn/ui accordion component
async function demo() {
  console.log('🚀 Playwright Crawler Demo\n');

  const testCases = [
    {
      name: 'shadcn/ui Accordion',
      url: 'https://ui.shadcn.com/docs/components/accordion',
      selectors: {
        heading: 'h1',
        description: 'p.text-lg',
        codeBlocks: 'pre code',
        componentLinks: 'a[href*="/docs/components/"]'
      }
    },
    {
      name: 'shadcn/ui Button',
      url: 'https://ui.shadcn.com/docs/components/button',
      selectors: {
        heading: 'h1',
        description: 'p.text-lg',
        codeBlocks: 'pre code',
        componentLinks: 'a[href*="/docs/components/"]'
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📦 Testing: ${testCase.name}`);
    console.log(`URL: ${testCase.url}`);

    try {
      const result = await simpleCrawl(testCase.url, testCase.selectors);

      console.log('\n✅ Results:');
      console.log(`  Title: ${result.data.title}`);
      console.log(`  Heading: ${result.data.heading}`);
      console.log(`  Description: ${result.data.description?.substring(0, 100)}...`);
      console.log(`  Code Examples Found: ${result.data.codeExamples?.length || 0}`);
      console.log(`  Related Components: ${result.data.relatedComponents?.length || 0}`);

      if (result.data.codeExamples && result.data.codeExamples.length > 0) {
        console.log('\n  First Code Example (truncated):');
        console.log(`  ${result.data.codeExamples[0].substring(0, 200)}...`);
      }

    } catch (error) {
      console.error(`❌ Failed: ${error.message}`);
    }
  }

  console.log('\n✨ Demo completed!\n');
  console.log('The full TypeScript crawler at ./playwright-crawler.ts provides:');
  console.log('  - Comprehensive component extraction');
  console.log('  - Props and API documentation parsing');
  console.log('  - Rate limiting and respectful crawling');
  console.log('  - Resume capability for large crawls');
  console.log('  - Multiple output formats (JSON, Markdown)');
  console.log('  - Authentication support');
  console.log('  - Custom data extractors');
  console.log('\nSee README.md for full documentation and usage examples.');
}

// Run the demo
demo().catch(console.error);