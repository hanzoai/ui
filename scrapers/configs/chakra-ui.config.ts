import { ScraperConfig } from '../types'

export const chakraUIConfig: ScraperConfig = {
  name: 'chakra-ui',
  displayName: 'Chakra UI',
  description: 'Modular and accessible component library for React',

  baseUrls: {
    docs: 'https://chakra-ui.com',
    components: 'https://chakra-ui.com/docs/components/*',
    recipes: 'https://chakra-ui.com/docs/recipes/*',
    pro: 'https://pro.chakra-ui.com'
  },

  componentPaths: [
    '/docs/components/*/*',
    '/docs/styled-system/*',
    '/docs/hooks/*'
  ],

  selectors: {
    componentCode: 'pre code',
    componentPreview: '[data-live-preview]',
    componentTitle: 'h1',
    componentDescription: '.chakra-prose > p:first-of-type',
    props: 'h2:contains("Props") + div table',
    theming: 'h2:contains("Theming") + div',
    examples: '[data-example]',
    playground: '[data-playground]',
    usage: 'h2:contains("Usage") + div',
    accessibility: 'h2:contains("Accessibility") + div'
  },

  categories: {
    'Layout': ['aspect-ratio', 'box', 'center', 'container', 'flex', 'grid', 'simple-grid', 'stack', 'wrap'],
    'Forms': ['button', 'checkbox', 'editable', 'form-control', 'icon-button', 'input', 'number-input', 'pin-input', 'radio', 'range-slider', 'select', 'slider', 'switch', 'textarea'],
    'Data Display': ['badge', 'card', 'code', 'divider', 'kbd', 'list', 'stat', 'table', 'tag'],
    'Feedback': ['alert', 'circular-progress', 'progress', 'skeleton', 'spinner', 'toast'],
    'Typography': ['text', 'heading', 'highlight'],
    'Overlay': ['alert-dialog', 'drawer', 'menu', 'modal', 'popover', 'tooltip'],
    'Disclosure': ['accordion', 'tabs', 'visually-hidden'],
    'Navigation': ['breadcrumb', 'link', 'link-overlay', 'skip-nav', 'stepper'],
    'Media': ['avatar', 'icon', 'image'],
    'Other': ['close-button', 'portal', 'show', 'transitions']
  },

  authentication: {
    required: false
  },

  rateLimit: {
    maxRequestsPerSecond: 3,
    delayMs: 333,
    maxConcurrent: 4
  },

  specialRules: {
    extractStyleProps: true,
    extractResponsive: true,
    extractColorMode: true,
    extractThemeTokens: true,
    extractVariants: true,
    extractSizes: true,
    extractHooks: true,
    extractRecipes: true,
    preserveChakraFactory: true
  },

  transformers: {
    componentName: (name: string) => name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(''),
    fileName: (name: string) => `${name}.tsx`,
    importPath: (name: string) => `@chakra-ui/react`,
    hookImport: (name: string) => `@chakra-ui/hooks`,
    themeImport: () => `@chakra-ui/theme`
  },

  metadata: {
    framework: 'React',
    styling: 'emotion/styled-system',
    baseLibrary: 'Chakra',
    typescript: true,
    license: 'MIT',
    darkMode: 'Built-in color mode',
    responsive: 'Mobile-first responsive',
    a11y: 'WAI-ARIA compliant'
  }
}