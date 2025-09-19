#!/usr/bin/env tsx

/**
 * Example usage of the PlaywrightCrawler for scraping UI component libraries
 */

import { PlaywrightCrawler, crawlUILibrary, CrawlerConfig } from './playwright-crawler';
import * as path from 'path';

// Example 1: Crawl shadcn/ui components
async function crawlShadcnUI() {
  const config: CrawlerConfig = {
    name: 'shadcn-ui',
    baseUrl: 'https://ui.shadcn.com',
    selectors: {
      componentList: 'a[href*="/docs/components/"]',
      componentName: 'h1',
      componentDescription: 'p.text-xl',
      codeBlocks: 'pre code',
      propsTable: 'table',
      propsRow: 'tbody tr',
      propName: 'td:first-child code',
      propType: 'td:nth-child(2)',
      propDefault: 'td:nth-child(3)',
      installationCode: 'pre:has(code:contains("npx shadcn"))',
      dependencies: 'pre:has(code:contains("npm install"))',
      categoryName: 'aside nav h4'
    },
    rateLimit: {
      requestsPerSecond: 2,
      concurrent: 3
    },
    waitForSelector: 'main',
    outputDir: './output/shadcn-ui',
    resumeFromCheckpoint: true,
    urlPatterns: {
      include: [/\/docs\/components\//],
      exclude: [/\/docs\/components\/installation/, /\/examples\//]
    }
  };

  const result = await crawlUILibrary(config, {
    saveJson: true,
    saveMarkdown: true
  });

  console.log(`✅ Crawled ${result.metadata.totalComponents} components`);
  console.log(`📁 Saved to ./output/shadcn-ui/`);
}

// Example 2: Crawl Material-UI components
async function crawlMaterialUI() {
  const config: CrawlerConfig = {
    name: 'material-ui',
    baseUrl: 'https://mui.com',
    selectors: {
      componentList: 'nav a[href*="/material-ui/react-"]',
      componentName: 'h1',
      componentDescription: 'h1 + p',
      codeBlocks: 'div[class*="Demo"] pre',
      propsTable: 'h2:contains("Props") + * table',
      propsRow: 'tbody tr',
      propName: 'td:first-child strong',
      propType: 'td:nth-child(2) code',
      propDefault: 'td:nth-child(3)',
      propDescription: 'td:nth-child(4)',
      installationCode: 'pre:contains("npm install @mui/material")'
    },
    authentication: undefined,
    rateLimit: {
      requestsPerSecond: 1,
      concurrent: 2
    },
    waitForSelector: 'h1',
    outputDir: './output/material-ui',
    urlPatterns: {
      include: [/\/material-ui\/react-/],
      exclude: [/\/material-ui\/getting-started/, /\/material-ui\/discover-more/]
    }
  };

  const crawler = new PlaywrightCrawler(config);
  await crawler.initialize();
  const result = await crawler.crawl();
  await crawler.saveResults();
  await crawler.saveAsMarkdown();

  return result;
}

// Example 3: Crawl Ant Design components
async function crawlAntDesign() {
  const config: CrawlerConfig = {
    name: 'ant-design',
    baseUrl: 'https://ant.design',
    selectors: {
      componentList: 'a[href*="/components/"]',
      componentName: 'h1',
      componentDescription: '.markdown > p:first-of-type',
      codeBlocks: '.code-box-demo + .code-box-meta pre',
      propsTable: '#api ~ table',
      propsRow: 'tbody tr',
      propName: 'td:first-child',
      propType: 'td:nth-child(2)',
      propDefault: 'td:nth-child(3)',
      propDescription: 'td:nth-child(4)',
      installationCode: 'pre:contains("npm install antd")'
    },
    rateLimit: {
      requestsPerSecond: 2,
      concurrent: 3
    },
    viewport: {
      width: 1920,
      height: 1080
    },
    waitForSelector: 'h1',
    outputDir: './output/ant-design',
    urlPatterns: {
      include: [/\/components\/[a-z-]+$/],
      exclude: [/\/components\/overview/]
    },
    // Custom extractor for Ant Design specific features
    customExtractors: {
      extractAPITable: async (page) => {
        const apiTables = await page.$$('#api ~ table');
        const apis = [];

        for (const table of apiTables) {
          const rows = await table.$$('tbody tr');
          for (const row of rows) {
            const cells = await row.$$('td');
            if (cells.length >= 4) {
              apis.push({
                property: await cells[0].textContent(),
                description: await cells[1].textContent(),
                type: await cells[2].textContent(),
                default: await cells[3].textContent()
              });
            }
          }
        }

        return apis;
      }
    }
  };

  return await crawlUILibrary(config, {
    saveJson: true,
    saveMarkdown: true
  });
}

// Example 4: Crawl with authentication (e.g., private design system)
async function crawlWithAuth() {
  const config: CrawlerConfig = {
    name: 'private-design-system',
    baseUrl: 'https://design.company.com',
    selectors: {
      componentList: '.component-card',
      componentName: '.component-name',
      componentDescription: '.component-description',
      codeBlocks: 'pre.highlight',
      propsTable: '.props-table',
      propsRow: '.props-table tbody tr',
      propName: 'td.prop-name',
      propType: 'td.prop-type',
      propDefault: 'td.prop-default'
    },
    authentication: {
      type: 'oauth',
      loginUrl: 'https://design.company.com/login',
      selectors: {
        username: 'input[name="username"]',
        password: 'input[name="password"]',
        submitButton: 'button[type="submit"]'
      },
      credentials: {
        username: process.env.DESIGN_USERNAME || '',
        password: process.env.DESIGN_PASSWORD || ''
      }
    },
    rateLimit: {
      requestsPerSecond: 1,
      concurrent: 1
    },
    outputDir: './output/private-design-system'
  };

  const crawler = new PlaywrightCrawler(config);
  await crawler.initialize();
  const result = await crawler.crawl();
  await crawler.saveResults();

  return result;
}

// Example 5: Progressive crawling with pause/resume
async function progressiveCrawl() {
  const config: CrawlerConfig = {
    name: 'large-library',
    baseUrl: 'https://example-ui.com',
    selectors: {
      componentList: '.component-item',
      componentName: 'h2',
      codeBlocks: 'pre code'
    },
    maxPages: 10, // Limit to 10 pages per session
    resumeFromCheckpoint: true,
    outputDir: './output/progressive'
  };

  const crawler = new PlaywrightCrawler(config);
  await crawler.initialize();

  // Set up progress monitoring
  const progressInterval = setInterval(() => {
    const progress = crawler.getProgress();
    console.log(`📊 Progress: ${progress.currentPage}/${progress.totalPages} pages, ${progress.componentsFound} components found`);

    // Pause after 5 pages for demonstration
    if (progress.currentPage >= 5 && progress.status === 'crawling') {
      crawler.pause();
      console.log('⏸ Crawling paused. Can be resumed later.');
      clearInterval(progressInterval);
    }
  }, 5000);

  const result = await crawler.crawl();
  clearInterval(progressInterval);

  await crawler.saveResults();
  console.log(`✅ Crawl completed: ${result.metadata.totalComponents} components`);

  return result;
}

// Example 6: Crawl multiple UI libraries in parallel
async function crawlMultipleLibraries() {
  const libraries = [
    {
      name: 'radix-ui',
      baseUrl: 'https://www.radix-ui.com',
      selectors: {
        componentList: 'a[href*="/primitives/docs/components/"]',
        componentName: 'h1',
        codeBlocks: 'pre code'
      }
    },
    {
      name: 'headless-ui',
      baseUrl: 'https://headlessui.com',
      selectors: {
        componentList: 'nav a[href*="/"]',
        componentName: 'h1',
        codeBlocks: 'pre code'
      }
    },
    {
      name: 'chakra-ui',
      baseUrl: 'https://v2.chakra-ui.com',
      selectors: {
        componentList: 'a[href*="/docs/components/"]',
        componentName: 'h1',
        codeBlocks: 'pre code'
      }
    }
  ];

  const results = await Promise.all(
    libraries.map(lib =>
      crawlUILibrary(
        {
          ...lib,
          rateLimit: { requestsPerSecond: 1, concurrent: 2 },
          outputDir: `./output/${lib.name}`
        },
        { saveJson: true, saveMarkdown: true }
      )
    )
  );

  console.log('📊 Crawl Summary:');
  results.forEach((result, index) => {
    console.log(`  ${libraries[index].name}: ${result.metadata.totalComponents} components`);
  });

  return results;
}

// Main execution
async function main() {
  console.log('🚀 Starting UI Component Library Crawler Examples\n');

  const args = process.argv.slice(2);
  const example = args[0] || 'shadcn';

  try {
    switch (example) {
      case 'shadcn':
        console.log('📦 Crawling shadcn/ui...');
        await crawlShadcnUI();
        break;

      case 'mui':
        console.log('📦 Crawling Material-UI...');
        await crawlMaterialUI();
        break;

      case 'antd':
        console.log('📦 Crawling Ant Design...');
        await crawlAntDesign();
        break;

      case 'auth':
        console.log('🔐 Crawling with authentication...');
        await crawlWithAuth();
        break;

      case 'progressive':
        console.log('📈 Progressive crawling example...');
        await progressiveCrawl();
        break;

      case 'multiple':
        console.log('🎯 Crawling multiple libraries...');
        await crawlMultipleLibraries();
        break;

      default:
        console.log('Available examples:');
        console.log('  npm run crawl shadcn    - Crawl shadcn/ui');
        console.log('  npm run crawl mui       - Crawl Material-UI');
        console.log('  npm run crawl antd      - Crawl Ant Design');
        console.log('  npm run crawl auth      - Example with authentication');
        console.log('  npm run crawl progressive - Progressive crawl with pause/resume');
        console.log('  npm run crawl multiple  - Crawl multiple libraries');
    }
  } catch (error) {
    console.error('❌ Crawl failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  crawlShadcnUI,
  crawlMaterialUI,
  crawlAntDesign,
  crawlWithAuth,
  progressiveCrawl,
  crawlMultipleLibraries
};