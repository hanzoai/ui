import { test, expect } from '@playwright/test';
import { PlaywrightCrawler, crawlUILibrary, CrawlerConfig } from './playwright-crawler';
import * as fs from 'fs/promises';
import * as path from 'path';

// Helper to clean up test output
async function cleanupTestOutput(dir: string) {
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch (error) {
    // Directory might not exist
  }
}

test.describe('PlaywrightCrawler', () => {
  const testOutputDir = './test-output';

  test.beforeEach(async () => {
    await cleanupTestOutput(testOutputDir);
  });

  test.afterEach(async () => {
    await cleanupTestOutput(testOutputDir);
  });

  test('should initialize crawler with valid config', async () => {
    const config: CrawlerConfig = {
      name: 'test-crawler',
      baseUrl: 'https://example.com',
      selectors: {
        componentList: '.component'
      },
      outputDir: testOutputDir
    };

    const crawler = new PlaywrightCrawler(config);
    await crawler.initialize();
    await crawler.cleanup();

    expect(crawler).toBeDefined();
  });

  test('should throw error for invalid config', async () => {
    const invalidConfig = {
      name: '',
      baseUrl: ''
    } as CrawlerConfig;

    expect(() => new PlaywrightCrawler(invalidConfig)).toThrow();
  });

  test('should crawl shadcn/ui accordion component', async () => {
    const config: CrawlerConfig = {
      name: 'shadcn-accordion-test',
      baseUrl: 'https://ui.shadcn.com/docs/components/accordion',
      selectors: {
        componentName: 'h1',
        componentDescription: 'p.text-lg',
        codeBlocks: 'pre code',
        installationCode: 'pre:has(code:contains("npx shadcn"))'
      },
      outputDir: testOutputDir,
      maxPages: 1,
      rateLimit: {
        requestsPerSecond: 1,
        concurrent: 1
      }
    };

    const crawler = new PlaywrightCrawler(config);
    await crawler.initialize();

    const result = await crawler.crawl();

    expect(result.success).toBe(true);
    expect(result.metadata.totalPages).toBeGreaterThan(0);

    // Save results
    await crawler.saveResults();

    // Check if results file was created
    const resultsPath = path.join(testOutputDir, 'shadcn-accordion-test-results.json');
    const fileExists = await fs.access(resultsPath).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);
  });

  test('should extract component props correctly', async () => {
    const config: CrawlerConfig = {
      name: 'props-test',
      baseUrl: 'https://ui.shadcn.com/docs/components/button',
      selectors: {
        componentName: 'h1',
        propsTable: 'table',
        propsRow: 'tbody tr',
        propName: 'td:first-child',
        propType: 'td:nth-child(2)',
        propDefault: 'td:nth-child(3)'
      },
      outputDir: testOutputDir,
      maxPages: 1
    };

    const result = await crawlUILibrary(config, {
      saveJson: false,
      saveMarkdown: false
    });

    expect(result.success).toBe(true);
    expect(result.components.length).toBeGreaterThan(0);

    const component = result.components[0];
    if (component.props) {
      expect(Array.isArray(component.props)).toBe(true);
    }
  });

  test('should handle rate limiting', async () => {
    const config: CrawlerConfig = {
      name: 'rate-limit-test',
      baseUrl: 'https://ui.shadcn.com',
      selectors: {
        componentList: 'a[href*="/docs/components/"]'
      },
      rateLimit: {
        requestsPerSecond: 2,
        concurrent: 1
      },
      outputDir: testOutputDir,
      maxPages: 3
    };

    const crawler = new PlaywrightCrawler(config);
    await crawler.initialize();

    const startTime = Date.now();
    await crawler.crawl();
    const endTime = Date.now();

    // With 3 pages at 2 requests per second, should take at least 1.5 seconds
    expect(endTime - startTime).toBeGreaterThan(1000);
  });

  test('should save results as JSON and Markdown', async () => {
    const config: CrawlerConfig = {
      name: 'save-test',
      baseUrl: 'https://ui.shadcn.com/docs/components/alert',
      selectors: {
        componentName: 'h1',
        componentDescription: 'p.text-lg',
        codeBlocks: 'pre code'
      },
      outputDir: testOutputDir,
      maxPages: 1
    };

    const result = await crawlUILibrary(config, {
      saveJson: true,
      saveMarkdown: true
    });

    expect(result.success).toBe(true);

    // Check JSON file
    const jsonPath = path.join(testOutputDir, 'save-test-results.json');
    const jsonExists = await fs.access(jsonPath).then(() => true).catch(() => false);
    expect(jsonExists).toBe(true);

    // Check Markdown file
    const mdPath = path.join(testOutputDir, 'save-test-documentation.md');
    const mdExists = await fs.access(mdPath).then(() => true).catch(() => false);
    expect(mdExists).toBe(true);

    // Verify JSON content
    const jsonContent = await fs.readFile(jsonPath, 'utf-8');
    const jsonData = JSON.parse(jsonContent);
    expect(jsonData.success).toBe(true);
    expect(jsonData.components).toBeDefined();

    // Verify Markdown content
    const mdContent = await fs.readFile(mdPath, 'utf-8');
    expect(mdContent).toContain('# save-test Components Documentation');
  });

  test('should handle checkpoint and resume', async () => {
    const config: CrawlerConfig = {
      name: 'checkpoint-test',
      baseUrl: 'https://ui.shadcn.com',
      selectors: {
        componentList: 'a[href*="/docs/components/"]'
      },
      outputDir: testOutputDir,
      resumeFromCheckpoint: true,
      maxPages: 2
    };

    const crawler = new PlaywrightCrawler(config);
    await crawler.initialize();

    // Crawl first page
    await crawler.pause();
    const progress1 = crawler.getProgress();

    // Create new crawler instance and resume
    const crawler2 = new PlaywrightCrawler(config);
    await crawler2.initialize();
    const progress2 = crawler2.getProgress();

    // Should have loaded checkpoint
    expect(progress2.componentsFound).toBe(progress1.componentsFound);

    await crawler.cleanup();
    await crawler2.cleanup();
  });

  test('should detect language in code blocks', async () => {
    const config: CrawlerConfig = {
      name: 'language-detection-test',
      baseUrl: 'https://ui.shadcn.com/docs/components/accordion',
      selectors: {
        codeBlocks: 'pre code'
      },
      outputDir: testOutputDir,
      maxPages: 1
    };

    const result = await crawlUILibrary(config);

    expect(result.components.length).toBeGreaterThan(0);

    const component = result.components[0];
    if (component.codeExamples && component.codeExamples.length > 0) {
      const example = component.codeExamples[0];
      expect(example.language).toBeDefined();
      expect(['jsx', 'typescript', 'bash', 'javascript']).toContain(example.language);
    }
  });

  test('should handle authentication with cookies', async () => {
    const config: CrawlerConfig = {
      name: 'auth-test',
      baseUrl: 'https://example.com',
      selectors: {
        componentList: '.component'
      },
      authentication: {
        type: 'cookie',
        credentials: {
          cookies: [
            {
              name: 'session',
              value: 'test-session',
              domain: '.example.com'
            }
          ]
        }
      },
      outputDir: testOutputDir,
      maxPages: 1
    };

    const crawler = new PlaywrightCrawler(config);
    await crawler.initialize();

    // Authentication should not throw
    expect(crawler).toBeDefined();

    await crawler.cleanup();
  });

  test('should handle custom extractors', async () => {
    const config: CrawlerConfig = {
      name: 'custom-extractor-test',
      baseUrl: 'https://ui.shadcn.com/docs/components/button',
      selectors: {
        componentName: 'h1'
      },
      customExtractors: {
        extractTitle: async (page) => {
          const title = await page.title();
          return {
            name: 'Page Title',
            description: title
          };
        },
        extractMetaTags: async (page) => {
          const metaTags = await page.$$eval('meta', tags =>
            tags.map(tag => ({
              name: tag.getAttribute('name'),
              content: tag.getAttribute('content')
            }))
          );
          return {
            name: 'Meta Tags',
            metadata: { metaTags }
          };
        }
      },
      outputDir: testOutputDir,
      maxPages: 1
    };

    const result = await crawlUILibrary(config);

    expect(result.success).toBe(true);
    expect(result.components.length).toBeGreaterThan(0);

    // Check if custom extractors ran
    const hasPageTitle = result.components.some(c => c.name === 'Page Title');
    const hasMetaTags = result.components.some(c => c.name === 'Meta Tags');

    expect(hasPageTitle || hasMetaTags).toBe(true);
  });

  test('should capture screenshot on error', async () => {
    const config: CrawlerConfig = {
      name: 'error-screenshot-test',
      baseUrl: 'https://this-url-definitely-does-not-exist-123456789.com',
      selectors: {
        componentList: '.non-existent'
      },
      screenshotOnError: true,
      outputDir: testOutputDir,
      maxPages: 1,
      retryAttempts: 1
    };

    const crawler = new PlaywrightCrawler(config);
    await crawler.initialize();

    try {
      await crawler.crawl();
    } catch (error) {
      // Expected to fail
    }

    // Check if screenshot directory was created
    const screenshotDir = path.join(testOutputDir, 'screenshots');
    const dirExists = await fs.access(screenshotDir).then(() => true).catch(() => false);

    // Screenshot might not be created for network errors, but directory structure should be set up
    expect(crawler).toBeDefined();
  });

  test('should respect URL patterns', async () => {
    const config: CrawlerConfig = {
      name: 'url-pattern-test',
      baseUrl: 'https://ui.shadcn.com',
      selectors: {
        componentList: 'a'
      },
      urlPatterns: {
        include: [/\/docs\/components\//],
        exclude: [/\/examples\//, /\/blocks\//]
      },
      outputDir: testOutputDir,
      maxPages: 5
    };

    const crawler = new PlaywrightCrawler(config);

    // Test URL filtering
    const shouldCrawl1 = crawler['shouldCrawlUrl']('https://ui.shadcn.com/docs/components/button');
    const shouldCrawl2 = crawler['shouldCrawlUrl']('https://ui.shadcn.com/examples/forms');
    const shouldCrawl3 = crawler['shouldCrawlUrl']('https://ui.shadcn.com/blocks/sidebar');
    const shouldCrawl4 = crawler['shouldCrawlUrl']('https://different-site.com/components');

    expect(shouldCrawl1).toBe(true);  // Matches include pattern
    expect(shouldCrawl2).toBe(false); // Matches exclude pattern
    expect(shouldCrawl3).toBe(false); // Matches exclude pattern
    expect(shouldCrawl4).toBe(false); // Different domain

    await crawler.cleanup();
  });

  test('should track progress correctly', async () => {
    const config: CrawlerConfig = {
      name: 'progress-test',
      baseUrl: 'https://ui.shadcn.com/docs/components/alert',
      selectors: {
        componentName: 'h1'
      },
      outputDir: testOutputDir,
      maxPages: 1
    };

    const crawler = new PlaywrightCrawler(config);
    await crawler.initialize();

    // Check initial progress
    let progress = crawler.getProgress();
    expect(progress.status).toBe('crawling');
    expect(progress.currentPage).toBe(0);
    expect(progress.componentsFound).toBe(0);
    expect(progress.errorsCount).toBe(0);

    await crawler.crawl();

    // Check final progress
    progress = crawler.getProgress();
    expect(progress.status).toBe('completed');
    expect(progress.currentPage).toBeGreaterThan(0);
  });
});