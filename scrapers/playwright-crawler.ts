import { chromium, Browser, BrowserContext, Page, Locator } from 'playwright';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';

// Configuration interfaces
export interface AuthenticationConfig {
  type: 'basic' | 'oauth' | 'token' | 'cookie';
  credentials?: {
    username?: string;
    password?: string;
    token?: string;
    cookies?: Array<{
      name: string;
      value: string;
      domain?: string;
      path?: string;
    }>;
  };
  loginUrl?: string;
  selectors?: {
    username?: string;
    password?: string;
    submitButton?: string;
  };
}

export interface SelectorsConfig {
  componentList?: string;
  componentCard?: string;
  componentName?: string;
  componentDescription?: string;
  codeBlocks?: string;
  propsTable?: string;
  propsRow?: string;
  propName?: string;
  propType?: string;
  propDefault?: string;
  propRequired?: string;
  propDescription?: string;
  installationCode?: string;
  dependencies?: string;
  sandboxLink?: string;
  categoryName?: string;
  navigationMenu?: string;
  nextPageButton?: string;
  loadMoreButton?: string;
}

export interface CrawlerConfig {
  name: string;
  baseUrl: string;
  selectors: SelectorsConfig;
  authentication?: AuthenticationConfig;
  rateLimit?: {
    requestsPerSecond?: number;
    concurrent?: number;
  };
  viewport?: {
    width?: number;
    height?: number;
  };
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  waitForSelector?: string;
  waitForTimeout?: number;
  userAgent?: string;
  headless?: boolean;
  screenshotOnError?: boolean;
  outputDir?: string;
  resumeFromCheckpoint?: boolean;
  maxPages?: number;
  urlPatterns?: {
    include?: RegExp[];
    exclude?: RegExp[];
  };
  customExtractors?: {
    [key: string]: (page: Page) => Promise<any>;
  };
}

// Data models
export interface ComponentProp {
  name: string;
  type: string;
  defaultValue?: string;
  required?: boolean;
  description?: string;
}

export interface CodeExample {
  language: string;
  code: string;
  title?: string;
  description?: string;
}

export interface Component {
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

export interface CrawlResult {
  success: boolean;
  components: Component[];
  metadata: {
    crawlStartTime: string;
    crawlEndTime: string;
    totalComponents: number;
    totalPages: number;
    errors: Error[];
    source: string;
    version?: string;
  };
}

export interface CrawlProgress {
  currentPage: number;
  totalPages: number;
  componentsFound: number;
  errorsCount: number;
  currentUrl: string;
  status: 'crawling' | 'paused' | 'completed' | 'error';
}

// Error types
export class CrawlerError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'CrawlerError';
  }
}

// Main Crawler Class
export class PlaywrightCrawler {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private config: CrawlerConfig;
  private visitedUrls: Set<string> = new Set();
  private components: Map<string, Component> = new Map();
  private errors: CrawlerError[] = [];
  private progress: CrawlProgress;
  private checkpointFile: string;
  private rateLimiter: RateLimiter;

  constructor(config: CrawlerConfig) {
    this.config = this.validateConfig(config);
    this.progress = {
      currentPage: 0,
      totalPages: 0,
      componentsFound: 0,
      errorsCount: 0,
      currentUrl: '',
      status: 'crawling'
    };
    this.checkpointFile = path.join(
      this.config.outputDir || './output',
      `${this.config.name}-checkpoint.json`
    );
    this.rateLimiter = new RateLimiter(
      this.config.rateLimit?.requestsPerSecond || 2,
      this.config.rateLimit?.concurrent || 3
    );
  }

  private validateConfig(config: CrawlerConfig): CrawlerConfig {
    if (!config.name || !config.baseUrl) {
      throw new CrawlerError(
        'Missing required config fields: name and baseUrl',
        'CONFIG_INVALID'
      );
    }

    // Set defaults
    return {
      ...config,
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
      viewport: {
        width: config.viewport?.width || 1920,
        height: config.viewport?.height || 1080
      },
      headless: config.headless !== undefined ? config.headless : true,
      screenshotOnError: config.screenshotOnError !== undefined ? config.screenshotOnError : true,
      outputDir: config.outputDir || './output'
    };
  }

  async initialize(): Promise<void> {
    try {
      this.browser = await chromium.launch({
        headless: this.config.headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const contextOptions: any = {
        viewport: this.config.viewport,
        userAgent: this.config.userAgent
      };

      this.context = await this.browser.newContext(contextOptions);

      // Set default timeout
      this.context.setDefaultTimeout(this.config.timeout!);

      // Handle authentication
      if (this.config.authentication) {
        await this.authenticate();
      }

      // Load checkpoint if resuming
      if (this.config.resumeFromCheckpoint) {
        await this.loadCheckpoint();
      }

      console.log(`✅ Crawler initialized for ${this.config.name}`);
    } catch (error) {
      throw new CrawlerError(
        'Failed to initialize crawler',
        'INIT_FAILED',
        error
      );
    }
  }

  private async authenticate(): Promise<void> {
    if (!this.config.authentication || !this.context) return;

    const auth = this.config.authentication;

    switch (auth.type) {
      case 'cookie':
        if (auth.credentials?.cookies) {
          await this.context.addCookies(auth.credentials.cookies);
        }
        break;

      case 'basic':
        if (auth.credentials?.username && auth.credentials?.password) {
          await this.context.setHTTPCredentials({
            username: auth.credentials.username,
            password: auth.credentials.password
          });
        }
        break;

      case 'token':
        if (auth.credentials?.token) {
          await this.context.setExtraHTTPHeaders({
            'Authorization': `Bearer ${auth.credentials.token}`
          });
        }
        break;

      case 'oauth':
        if (auth.loginUrl && auth.selectors) {
          const page = await this.context.newPage();
          await page.goto(auth.loginUrl);

          if (auth.selectors.username && auth.credentials?.username) {
            await page.fill(auth.selectors.username, auth.credentials.username);
          }
          if (auth.selectors.password && auth.credentials?.password) {
            await page.fill(auth.selectors.password, auth.credentials.password);
          }
          if (auth.selectors.submitButton) {
            await page.click(auth.selectors.submitButton);
            await page.waitForLoadState('networkidle');
          }

          await page.close();
        }
        break;
    }
  }

  async crawl(): Promise<CrawlResult> {
    const startTime = new Date().toISOString();

    try {
      if (!this.browser || !this.context) {
        await this.initialize();
      }

      // Start crawling from base URL
      await this.crawlUrl(this.config.baseUrl);

      // Crawl discovered URLs
      const urlsToCrawl = this.getUrlsToCrawl();
      for (const url of urlsToCrawl) {
        if (this.config.maxPages && this.progress.currentPage >= this.config.maxPages) {
          break;
        }
        await this.crawlUrl(url);
      }

      this.progress.status = 'completed';

      return {
        success: true,
        components: Array.from(this.components.values()),
        metadata: {
          crawlStartTime: startTime,
          crawlEndTime: new Date().toISOString(),
          totalComponents: this.components.size,
          totalPages: this.visitedUrls.size,
          errors: this.errors,
          source: this.config.baseUrl,
          version: await this.extractVersion()
        }
      };

    } catch (error) {
      this.progress.status = 'error';
      throw new CrawlerError(
        'Crawl failed',
        'CRAWL_FAILED',
        error
      );
    } finally {
      await this.cleanup();
    }
  }

  private async crawlUrl(url: string): Promise<void> {
    if (this.visitedUrls.has(url)) return;

    // Check URL patterns
    if (!this.shouldCrawlUrl(url)) return;

    await this.rateLimiter.acquire();

    const page = await this.context!.newPage();
    this.progress.currentUrl = url;
    this.progress.currentPage++;

    try {
      console.log(`🔍 Crawling: ${url}`);

      await this.navigateWithRetry(page, url);
      this.visitedUrls.add(url);

      // Wait for content to load
      if (this.config.waitForSelector) {
        await page.waitForSelector(this.config.waitForSelector, {
          timeout: this.config.timeout
        });
      } else if (this.config.waitForTimeout) {
        await page.waitForTimeout(this.config.waitForTimeout);
      }

      // Extract components from the page
      const components = await this.extractComponents(page);

      for (const component of components) {
        const id = this.generateComponentId(component);
        this.components.set(id, {
          ...component,
          id,
          url,
          metadata: {
            ...component.metadata,
            source: url,
            timestamp: new Date().toISOString()
          }
        });
      }

      this.progress.componentsFound = this.components.size;

      // Discover new URLs
      const newUrls = await this.discoverUrls(page);
      for (const newUrl of newUrls) {
        if (!this.visitedUrls.has(newUrl)) {
          this.visitedUrls.add(newUrl);
        }
      }

      // Save checkpoint
      await this.saveCheckpoint();

    } catch (error: any) {
      console.error(`❌ Error crawling ${url}:`, error.message);
      this.errors.push(new CrawlerError(
        `Failed to crawl ${url}`,
        'PAGE_CRAWL_FAILED',
        error
      ));
      this.progress.errorsCount++;

      if (this.config.screenshotOnError) {
        await this.captureErrorScreenshot(page, url);
      }
    } finally {
      await page.close();
      this.rateLimiter.release();
    }
  }

  private async navigateWithRetry(page: Page, url: string): Promise<void> {
    let lastError: any;

    for (let attempt = 0; attempt < this.config.retryAttempts!; attempt++) {
      try {
        await page.goto(url, {
          waitUntil: 'networkidle',
          timeout: this.config.timeout
        });
        return;
      } catch (error) {
        lastError = error;
        console.log(`⚠️ Retry ${attempt + 1}/${this.config.retryAttempts} for ${url}`);
        await page.waitForTimeout(this.config.retryDelay!);
      }
    }

    throw lastError;
  }

  private async extractComponents(page: Page): Promise<Component[]> {
    const components: Component[] = [];
    const selectors = this.config.selectors;

    try {
      // Extract component list
      if (selectors.componentList) {
        const componentElements = await page.$$(selectors.componentList);

        for (const element of componentElements) {
          const component = await this.extractComponentData(element, page);
          if (component.name) {
            components.push(component);
          }
        }
      }

      // Run custom extractors
      if (this.config.customExtractors) {
        for (const [key, extractor] of Object.entries(this.config.customExtractors)) {
          try {
            const customData = await extractor(page);
            if (Array.isArray(customData)) {
              components.push(...customData);
            } else if (customData) {
              components.push(customData);
            }
          } catch (error) {
            console.error(`Custom extractor '${key}' failed:`, error);
          }
        }
      }

    } catch (error) {
      console.error('Component extraction failed:', error);
    }

    return components;
  }

  private async extractComponentData(element: Locator | any, page: Page): Promise<Component> {
    const selectors = this.config.selectors;
    const component: Component = { name: '' };

    try {
      // Extract name
      if (selectors.componentName) {
        component.name = await this.safeExtractText(element, selectors.componentName);
      }

      // Extract description
      if (selectors.componentDescription) {
        component.description = await this.safeExtractText(element, selectors.componentDescription);
      }

      // Extract category
      if (selectors.categoryName) {
        component.category = await this.safeExtractText(page, selectors.categoryName);
      }

      // Extract code examples
      if (selectors.codeBlocks) {
        component.codeExamples = await this.extractCodeExamples(element, selectors.codeBlocks);
      }

      // Extract props
      if (selectors.propsTable) {
        component.props = await this.extractProps(element);
      }

      // Extract installation
      if (selectors.installationCode) {
        component.installation = await this.safeExtractText(element, selectors.installationCode);
      }

      // Extract dependencies
      if (selectors.dependencies) {
        const depsText = await this.safeExtractText(element, selectors.dependencies);
        component.dependencies = depsText ? depsText.split(/[,\s]+/).filter(Boolean) : [];
      }

      // Extract sandbox link
      if (selectors.sandboxLink) {
        const sandboxElement = await element.$(selectors.sandboxLink);
        if (sandboxElement) {
          component.sandboxUrl = await sandboxElement.getAttribute('href');
        }
      }

    } catch (error) {
      console.error('Error extracting component data:', error);
    }

    return component;
  }

  private async extractCodeExamples(element: any, selector: string): Promise<CodeExample[]> {
    const examples: CodeExample[] = [];

    try {
      const codeBlocks = await element.$$(selector);

      for (const block of codeBlocks) {
        const code = await block.textContent();
        if (code) {
          const language = await this.detectLanguage(block, code);
          examples.push({
            language,
            code: code.trim()
          });
        }
      }
    } catch (error) {
      console.error('Error extracting code examples:', error);
    }

    return examples;
  }

  private async detectLanguage(element: any, code: string): Promise<string> {
    // Try to get language from class attribute
    const className = await element.getAttribute('class');
    if (className) {
      const langMatch = className.match(/language-(\w+)/);
      if (langMatch) return langMatch[1];
    }

    // Try to detect from data attributes
    const dataLang = await element.getAttribute('data-language');
    if (dataLang) return dataLang;

    // Simple heuristic detection
    if (code.includes('import React') || code.includes('jsx')) return 'jsx';
    if (code.includes('import { Component }') || code.includes('export default')) return 'typescript';
    if (code.includes('<!DOCTYPE') || code.includes('<html')) return 'html';
    if (code.includes('{') && code.includes('}')) return 'javascript';
    if (code.includes('$') || code.includes('npm install')) return 'bash';

    return 'plaintext';
  }

  private async extractProps(element: any): Promise<ComponentProp[]> {
    const props: ComponentProp[] = [];
    const selectors = this.config.selectors;

    try {
      if (selectors.propsTable && selectors.propsRow) {
        const table = await element.$(selectors.propsTable);
        if (table) {
          const rows = await table.$$(selectors.propsRow);

          for (const row of rows) {
            const prop: ComponentProp = {
              name: '',
              type: ''
            };

            if (selectors.propName) {
              prop.name = await this.safeExtractText(row, selectors.propName);
            }
            if (selectors.propType) {
              prop.type = await this.safeExtractText(row, selectors.propType);
            }
            if (selectors.propDefault) {
              prop.defaultValue = await this.safeExtractText(row, selectors.propDefault);
            }
            if (selectors.propRequired) {
              const requiredText = await this.safeExtractText(row, selectors.propRequired);
              prop.required = requiredText === 'true' || requiredText === 'yes';
            }
            if (selectors.propDescription) {
              prop.description = await this.safeExtractText(row, selectors.propDescription);
            }

            if (prop.name) {
              props.push(prop);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error extracting props:', error);
    }

    return props;
  }

  private async discoverUrls(page: Page): Promise<string[]> {
    const urls: string[] = [];

    try {
      // Find all links on the page
      const links = await page.$$eval('a[href]', elements =>
        elements.map(el => (el as HTMLAnchorElement).href)
      );

      for (const link of links) {
        const absoluteUrl = new URL(link, page.url()).href;
        if (this.shouldCrawlUrl(absoluteUrl)) {
          urls.push(absoluteUrl);
        }
      }

      // Check for pagination
      if (this.config.selectors.nextPageButton) {
        const nextButton = await page.$(this.config.selectors.nextPageButton);
        if (nextButton) {
          const href = await nextButton.getAttribute('href');
          if (href) {
            urls.push(new URL(href, page.url()).href);
          }
        }
      }

    } catch (error) {
      console.error('Error discovering URLs:', error);
    }

    return urls;
  }

  private shouldCrawlUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const baseUrlObj = new URL(this.config.baseUrl);

      // Check if same domain
      if (urlObj.hostname !== baseUrlObj.hostname) {
        return false;
      }

      // Check include patterns
      if (this.config.urlPatterns?.include) {
        const included = this.config.urlPatterns.include.some(pattern =>
          pattern.test(url)
        );
        if (!included) return false;
      }

      // Check exclude patterns
      if (this.config.urlPatterns?.exclude) {
        const excluded = this.config.urlPatterns.exclude.some(pattern =>
          pattern.test(url)
        );
        if (excluded) return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  private async safeExtractText(element: any, selector?: string): Promise<string> {
    try {
      if (selector) {
        const child = await element.$(selector);
        if (child) {
          return (await child.textContent()) || '';
        }
      } else {
        return (await element.textContent()) || '';
      }
    } catch {
      return '';
    }
  }

  private generateComponentId(component: Component): string {
    const data = `${component.name}-${component.category}-${component.description}`;
    return createHash('md5').update(data).digest('hex');
  }

  private async extractVersion(): Promise<string | undefined> {
    try {
      const page = await this.context!.newPage();
      await page.goto(this.config.baseUrl);

      // Try common version selectors
      const versionSelectors = [
        '.version',
        '[data-version]',
        'meta[name="version"]',
        '.footer .version'
      ];

      for (const selector of versionSelectors) {
        const element = await page.$(selector);
        if (element) {
          const version = await element.textContent();
          if (version) {
            await page.close();
            return version.trim();
          }
        }
      }

      await page.close();
    } catch (error) {
      console.error('Error extracting version:', error);
    }

    return undefined;
  }

  private getUrlsToCrawl(): string[] {
    return Array.from(this.visitedUrls).filter(url =>
      !this.visitedUrls.has(url) && this.shouldCrawlUrl(url)
    );
  }

  async saveResults(filepath?: string): Promise<void> {
    const outputPath = filepath || path.join(
      this.config.outputDir!,
      `${this.config.name}-results.json`
    );

    const results: CrawlResult = {
      success: true,
      components: Array.from(this.components.values()),
      metadata: {
        crawlStartTime: new Date().toISOString(),
        crawlEndTime: new Date().toISOString(),
        totalComponents: this.components.size,
        totalPages: this.visitedUrls.size,
        errors: this.errors,
        source: this.config.baseUrl
      }
    };

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(results, null, 2));

    console.log(`📁 Results saved to: ${outputPath}`);
  }

  async saveAsMarkdown(filepath?: string): Promise<void> {
    const outputPath = filepath || path.join(
      this.config.outputDir!,
      `${this.config.name}-documentation.md`
    );

    let markdown = `# ${this.config.name} Components Documentation\n\n`;
    markdown += `Generated: ${new Date().toISOString()}\n`;
    markdown += `Source: ${this.config.baseUrl}\n\n`;
    markdown += `## Table of Contents\n\n`;

    // Group components by category
    const categorized = new Map<string, Component[]>();
    for (const component of this.components.values()) {
      const category = component.category || 'Uncategorized';
      if (!categorized.has(category)) {
        categorized.set(category, []);
      }
      categorized.get(category)!.push(component);
    }

    // Generate TOC
    for (const [category, components] of categorized) {
      markdown += `### ${category}\n`;
      for (const component of components) {
        markdown += `- [${component.name}](#${component.name.toLowerCase().replace(/\s+/g, '-')})\n`;
      }
      markdown += '\n';
    }

    markdown += '---\n\n';

    // Generate component documentation
    for (const [category, components] of categorized) {
      markdown += `## ${category}\n\n`;

      for (const component of components) {
        markdown += `### ${component.name}\n\n`;

        if (component.description) {
          markdown += `${component.description}\n\n`;
        }

        if (component.installation) {
          markdown += `#### Installation\n\n`;
          markdown += '```bash\n';
          markdown += component.installation;
          markdown += '\n```\n\n';
        }

        if (component.codeExamples && component.codeExamples.length > 0) {
          markdown += `#### Examples\n\n`;
          for (const example of component.codeExamples) {
            if (example.title) {
              markdown += `##### ${example.title}\n\n`;
            }
            markdown += `\`\`\`${example.language}\n`;
            markdown += example.code;
            markdown += '\n```\n\n';
          }
        }

        if (component.props && component.props.length > 0) {
          markdown += `#### Props\n\n`;
          markdown += '| Prop | Type | Default | Required | Description |\n';
          markdown += '|------|------|---------|----------|-------------|\n';

          for (const prop of component.props) {
            markdown += `| ${prop.name} | ${prop.type} | ${prop.defaultValue || '-'} | ${prop.required ? 'Yes' : 'No'} | ${prop.description || '-'} |\n`;
          }
          markdown += '\n';
        }

        if (component.sandboxUrl) {
          markdown += `#### Live Demo\n\n`;
          markdown += `[View in Sandbox](${component.sandboxUrl})\n\n`;
        }

        markdown += '---\n\n';
      }
    }

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, markdown);

    console.log(`📝 Markdown documentation saved to: ${outputPath}`);
  }

  private async saveCheckpoint(): Promise<void> {
    if (!this.config.resumeFromCheckpoint) return;

    const checkpoint = {
      visitedUrls: Array.from(this.visitedUrls),
      components: Array.from(this.components.entries()),
      errors: this.errors,
      progress: this.progress,
      timestamp: new Date().toISOString()
    };

    await fs.mkdir(path.dirname(this.checkpointFile), { recursive: true });
    await fs.writeFile(this.checkpointFile, JSON.stringify(checkpoint, null, 2));
  }

  private async loadCheckpoint(): Promise<void> {
    try {
      const checkpointData = await fs.readFile(this.checkpointFile, 'utf-8');
      const checkpoint = JSON.parse(checkpointData);

      this.visitedUrls = new Set(checkpoint.visitedUrls);
      this.components = new Map(checkpoint.components);
      this.errors = checkpoint.errors;
      this.progress = checkpoint.progress;

      console.log(`📂 Resumed from checkpoint (${checkpoint.timestamp})`);
    } catch (error) {
      console.log('No checkpoint found, starting fresh crawl');
    }
  }

  private async captureErrorScreenshot(page: Page, url: string): Promise<void> {
    try {
      const screenshotDir = path.join(this.config.outputDir!, 'screenshots');
      await fs.mkdir(screenshotDir, { recursive: true });

      const filename = `error-${Date.now()}-${url.replace(/[^a-z0-9]/gi, '_')}.png`;
      const filepath = path.join(screenshotDir, filename);

      await page.screenshot({ path: filepath, fullPage: true });
      console.log(`📸 Error screenshot saved: ${filepath}`);
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
    }
  }

  async cleanup(): Promise<void> {
    if (this.context) {
      await this.context.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
    console.log('🧹 Crawler cleaned up');
  }

  getProgress(): CrawlProgress {
    return { ...this.progress };
  }

  async pause(): Promise<void> {
    this.progress.status = 'paused';
    await this.saveCheckpoint();
  }

  async resume(): Promise<void> {
    this.progress.status = 'crawling';
  }
}

// Rate Limiter helper class
class RateLimiter {
  private queue: (() => void)[] = [];
  private running = 0;
  private lastRequestTime = 0;

  constructor(
    private requestsPerSecond: number,
    private maxConcurrent: number
  ) {}

  async acquire(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
      this.process();
    });
  }

  release(): void {
    this.running--;
    this.process();
  }

  private process(): void {
    if (this.queue.length === 0 || this.running >= this.maxConcurrent) {
      return;
    }

    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minInterval = 1000 / this.requestsPerSecond;

    if (timeSinceLastRequest < minInterval) {
      setTimeout(() => this.process(), minInterval - timeSinceLastRequest);
      return;
    }

    const resolve = this.queue.shift();
    if (resolve) {
      this.running++;
      this.lastRequestTime = now;
      resolve();
    }
  }
}

// Export utility function for quick crawling
export async function crawlUILibrary(
  config: CrawlerConfig,
  options?: {
    saveJson?: boolean;
    saveMarkdown?: boolean;
    outputPath?: string;
  }
): Promise<CrawlResult> {
  const crawler = new PlaywrightCrawler(config);

  try {
    await crawler.initialize();
    const result = await crawler.crawl();

    if (options?.saveJson) {
      await crawler.saveResults(options.outputPath);
    }

    if (options?.saveMarkdown) {
      const mdPath = options.outputPath?.replace('.json', '.md');
      await crawler.saveAsMarkdown(mdPath);
    }

    return result;
  } finally {
    await crawler.cleanup();
  }
}