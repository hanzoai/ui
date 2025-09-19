# Playwright UI Component Crawler

A comprehensive, production-ready web crawler framework built with Playwright for extracting UI component documentation from any component library website.

## Features

### Core Capabilities
- 🎯 **Universal Component Extraction** - Works with any UI library website (Material-UI, Ant Design, Chakra UI, etc.)
- 🔄 **Dynamic Content Support** - Handles SPAs and dynamically loaded content
- 📊 **Structured Data Extraction** - Extracts components, props, code examples, and documentation
- 🔐 **Authentication Support** - Basic, OAuth, token, and cookie-based authentication
- 🚦 **Smart Rate Limiting** - Respectful crawling with configurable limits
- 💾 **Resume Capability** - Save progress and resume interrupted crawls
- 📸 **Error Screenshots** - Automatic screenshots on failures for debugging

### Data Extraction
- Component names and descriptions
- Code examples with language detection
- Props/API documentation tables
- Installation instructions
- Dependencies and peer dependencies
- Live demo/sandbox links
- Component categories and organization

### Output Formats
- **JSON** - Structured data for programmatic use
- **Markdown** - Human-readable documentation
- **Custom** - Extensible for any format

## Installation

```bash
npm install playwright
# or
pnpm add playwright
```

## Quick Start

```typescript
import { crawlUILibrary } from './playwright-crawler';

// Simple usage
const result = await crawlUILibrary({
  name: 'my-ui-lib',
  baseUrl: 'https://ui-library.com',
  selectors: {
    componentList: '.component-card',
    componentName: 'h2',
    codeBlocks: 'pre code'
  }
}, {
  saveJson: true,
  saveMarkdown: true
});

console.log(`Crawled ${result.metadata.totalComponents} components`);
```

## Configuration

### Basic Configuration

```typescript
const config: CrawlerConfig = {
  name: 'shadcn-ui',
  baseUrl: 'https://ui.shadcn.com',
  selectors: {
    componentList: '[data-component]',
    componentName: 'h1',
    componentDescription: 'p.lead',
    codeBlocks: 'pre code'
  }
};
```

### Advanced Configuration

```typescript
const config: CrawlerConfig = {
  name: 'material-ui',
  baseUrl: 'https://mui.com',

  // Selectors for different elements
  selectors: {
    componentList: 'nav a[href*="/components/"]',
    componentName: 'h1',
    componentDescription: '.component-description',
    codeBlocks: 'pre code',
    propsTable: 'table.props-table',
    propsRow: 'tbody tr',
    propName: 'td:first-child',
    propType: 'td:nth-child(2)',
    propDefault: 'td:nth-child(3)',
    propRequired: 'td:nth-child(4)',
    propDescription: 'td:last-child',
    installationCode: 'pre:contains("npm install")',
    dependencies: '.dependencies-list',
    sandboxLink: 'a[href*="codesandbox"]',
    categoryName: '.category-title',
    navigationMenu: 'nav.sidebar',
    nextPageButton: 'a.next-page',
    loadMoreButton: 'button.load-more'
  },

  // Authentication (if required)
  authentication: {
    type: 'oauth',
    loginUrl: 'https://mui.com/login',
    selectors: {
      username: '#username',
      password: '#password',
      submitButton: 'button[type="submit"]'
    },
    credentials: {
      username: process.env.USERNAME,
      password: process.env.PASSWORD
    }
  },

  // Rate limiting
  rateLimit: {
    requestsPerSecond: 2,
    concurrent: 3
  },

  // Browser settings
  viewport: {
    width: 1920,
    height: 1080
  },
  headless: true,
  userAgent: 'Mozilla/5.0 (compatible; UIComponentCrawler/1.0)',

  // Timeouts and retries
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 2000,
  waitForSelector: 'main',
  waitForTimeout: 1000,

  // Output settings
  outputDir: './output/material-ui',
  screenshotOnError: true,
  resumeFromCheckpoint: true,

  // Crawling limits
  maxPages: 100,

  // URL filtering
  urlPatterns: {
    include: [/\/components\//],
    exclude: [/\/blog\//, /\/about\//]
  },

  // Custom extractors for specific data
  customExtractors: {
    extractVersion: async (page) => {
      const version = await page.$eval('.version', el => el.textContent);
      return { version };
    },
    extractThemeColors: async (page) => {
      const colors = await page.$$eval('.color-palette div', elements =>
        elements.map(el => ({
          name: el.getAttribute('data-color'),
          value: el.style.backgroundColor
        }))
      );
      return { themeColors: colors };
    }
  }
};
```

## Usage Examples

### 1. Crawl shadcn/ui

```typescript
import { crawlUILibrary } from './playwright-crawler';

async function crawlShadcnUI() {
  const result = await crawlUILibrary({
    name: 'shadcn-ui',
    baseUrl: 'https://ui.shadcn.com',
    selectors: {
      componentList: 'a[href*="/docs/components/"]',
      componentName: 'h1',
      codeBlocks: 'pre code',
      installationCode: 'pre:contains("npx shadcn")'
    },
    urlPatterns: {
      include: [/\/docs\/components\//]
    }
  }, {
    saveJson: true,
    saveMarkdown: true
  });

  return result;
}
```

### 2. Crawl with Authentication

```typescript
const result = await crawlUILibrary({
  name: 'private-design-system',
  baseUrl: 'https://design.company.com',
  selectors: {
    componentList: '.component-item',
    componentName: '.component-title'
  },
  authentication: {
    type: 'token',
    credentials: {
      token: process.env.API_TOKEN
    }
  }
});
```

### 3. Progressive Crawling with Checkpoints

```typescript
const crawler = new PlaywrightCrawler({
  name: 'large-library',
  baseUrl: 'https://huge-ui-library.com',
  selectors: { /* ... */ },
  resumeFromCheckpoint: true,
  maxPages: 50
});

await crawler.initialize();

// Monitor progress
const interval = setInterval(() => {
  const progress = crawler.getProgress();
  console.log(`Progress: ${progress.currentPage}/${progress.totalPages}`);

  if (progress.currentPage >= 25) {
    crawler.pause(); // Pause at 25 pages
    clearInterval(interval);
  }
}, 5000);

const result = await crawler.crawl();
```

### 4. Custom Data Extraction

```typescript
const config: CrawlerConfig = {
  name: 'custom-extraction',
  baseUrl: 'https://ui-library.com',
  selectors: {
    componentList: '.component'
  },
  customExtractors: {
    // Extract component sizes
    extractSizes: async (page) => {
      const sizes = await page.$$eval('.size-variant', els =>
        els.map(el => el.textContent)
      );
      return { availableSizes: sizes };
    },

    // Extract theme information
    extractTheme: async (page) => {
      const theme = await page.evaluate(() => {
        return window.getComputedStyle(document.body)
          .getPropertyValue('--primary-color');
      });
      return { primaryColor: theme };
    },

    // Extract accessibility info
    extractA11y: async (page) => {
      const ariaLabels = await page.$$eval('[aria-label]', els =>
        els.map(el => ({
          element: el.tagName,
          label: el.getAttribute('aria-label')
        }))
      );
      return { accessibility: ariaLabels };
    }
  }
};
```

## API Reference

### `PlaywrightCrawler`

Main crawler class for extracting UI component documentation.

#### Constructor

```typescript
new PlaywrightCrawler(config: CrawlerConfig)
```

#### Methods

- `initialize()` - Initialize the browser and context
- `crawl()` - Start crawling and return results
- `saveResults(filepath?)` - Save results as JSON
- `saveAsMarkdown(filepath?)` - Save results as Markdown
- `getProgress()` - Get current crawl progress
- `pause()` - Pause crawling (saves checkpoint)
- `resume()` - Resume paused crawl
- `cleanup()` - Close browser and clean up resources

### `crawlUILibrary`

Utility function for quick crawling.

```typescript
crawlUILibrary(
  config: CrawlerConfig,
  options?: {
    saveJson?: boolean;
    saveMarkdown?: boolean;
    outputPath?: string;
  }
): Promise<CrawlResult>
```

## Data Models

### `Component`

```typescript
interface Component {
  id?: string;
  name: string;
  category?: string;
  description?: string;
  url?: string;
  codeExamples?: CodeExample[];
  props?: ComponentProp[];
  installation?: string;
  dependencies?: string[];
  sandboxUrl?: string;
  metadata?: {
    source?: string;
    timestamp?: string;
    version?: string;
    [key: string]: any;
  };
}
```

### `ComponentProp`

```typescript
interface ComponentProp {
  name: string;
  type: string;
  defaultValue?: string;
  required?: boolean;
  description?: string;
}
```

### `CodeExample`

```typescript
interface CodeExample {
  language: string;
  code: string;
  title?: string;
  description?: string;
}
```

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test playwright-crawler.test.ts

# Run with UI mode
npm run test:ui

# Run in debug mode
npm test -- --debug
```

## Best Practices

### 1. Respectful Crawling
- Always use rate limiting
- Respect robots.txt
- Use appropriate User-Agent
- Don't overload servers

### 2. Selector Strategy
- Use specific, stable selectors
- Prefer data attributes over classes
- Test selectors before full crawl
- Have fallback selectors

### 3. Error Handling
- Enable screenshot on errors
- Use retry logic for transient failures
- Log errors comprehensively
- Save partial results

### 4. Performance
- Use checkpoints for large crawls
- Limit concurrent pages
- Set appropriate timeouts
- Clean up resources properly

### 5. Data Quality
- Validate extracted data
- Handle missing fields gracefully
- Normalize data formats
- Remove duplicates

## Troubleshooting

### Common Issues

1. **Timeout Errors**
   - Increase timeout in config
   - Check if selectors are correct
   - Verify network connectivity

2. **Missing Data**
   - Check selector specificity
   - Ensure dynamic content is loaded
   - Use `waitForSelector` or `waitForTimeout`

3. **Rate Limit Issues**
   - Reduce `requestsPerSecond`
   - Decrease `concurrent` value
   - Add delays between requests

4. **Memory Issues**
   - Use checkpoints for large crawls
   - Process data in batches
   - Clear browser cache periodically

## Contributing

Contributions are welcome! Please ensure:
- Tests pass (`npm test`)
- Code follows existing patterns
- Documentation is updated
- Examples are provided for new features

## License

MIT