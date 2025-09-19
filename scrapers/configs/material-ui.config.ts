import { ScraperConfig } from '../types'

export const materialUIConfig: ScraperConfig = {
  name: 'material-ui',
  displayName: 'Material UI (MUI)',
  description: 'React components that implement Google\'s Material Design',

  baseUrls: {
    docs: 'https://mui.com',
    components: 'https://mui.com/material-ui/react-*',
    api: 'https://mui.com/material-ui/api/*',
    templates: 'https://mui.com/material-ui/getting-started/templates'
  },

  componentPaths: [
    '/material-ui/react-*',
    '/material-ui/api/*',
    '/x/react-*'
  ],

  selectors: {
    componentCode: '.MuiCode-root',
    componentPreview: '[data-mui-demo]',
    componentTitle: 'h1',
    componentDescription: '.description',
    apiProps: '.MuiApi-table',
    cssApi: 'h2:contains("CSS") + div table',
    slots: 'h2:contains("Slots") + div',
    examples: '.demo-container',
    playground: '[data-mui-playground]',
    themeCustomization: 'h2:contains("Theme") + div'
  },

  categories: {
    'Inputs': ['autocomplete', 'button', 'button-group', 'checkbox', 'fab', 'radio-button', 'rating', 'select', 'slider', 'switch', 'text-field', 'toggle-button'],
    'Data Display': ['avatar', 'badge', 'chip', 'divider', 'icon', 'list', 'table', 'tooltip', 'typography'],
    'Feedback': ['alert', 'backdrop', 'dialog', 'progress', 'skeleton', 'snackbar'],
    'Surfaces': ['accordion', 'app-bar', 'card', 'paper'],
    'Navigation': ['bottom-navigation', 'breadcrumbs', 'drawer', 'link', 'menu', 'pagination', 'speed-dial', 'stepper', 'tabs'],
    'Layout': ['box', 'container', 'grid', 'grid2', 'hidden', 'image-list', 'stack'],
    'Utils': ['click-away-listener', 'css-baseline', 'modal', 'no-ssr', 'popover', 'popper', 'portal', 'transitions']
  },

  authentication: {
    required: false
  },

  rateLimit: {
    maxRequestsPerSecond: 2,
    delayMs: 500,
    maxConcurrent: 3
  },

  specialRules: {
    extractThemeTokens: true,
    extractSystemProps: true,
    extractSxProps: true,
    extractVariants: true,
    extractSizes: true,
    extractColors: true,
    extractBreakpoints: true,
    preserveJSX: true,
    extractDataGrid: true
  },

  transformers: {
    componentName: (name: string) => name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(''),
    fileName: (name: string) => `${name}.tsx`,
    importPath: (name: string) => `@mui/material/${name}`,
    importDataGrid: (name: string) => `@mui/x-data-grid`
  },

  metadata: {
    framework: 'React',
    styling: 'emotion/styled-components',
    baseLibrary: 'Material Design',
    typescript: true,
    license: 'MIT',
    version: '5.x',
    theming: 'Advanced theming system'
  }
}