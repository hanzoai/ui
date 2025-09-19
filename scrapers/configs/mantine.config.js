"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mantineConfig = void 0;
exports.mantineConfig = {
    name: 'mantine',
    displayName: 'Mantine',
    description: 'Full-featured React components library with TypeScript support',
    baseUrls: {
        docs: 'https://mantine.dev',
        components: 'https://mantine.dev/core/*',
        hooks: 'https://mantine.dev/hooks/*',
        form: 'https://mantine.dev/form/*',
        dates: 'https://mantine.dev/dates/*',
        charts: 'https://mantine.dev/charts/*'
    },
    componentPaths: [
        '/core/*',
        '/hooks/*',
        '/form/*',
        '/dates/*',
        '/charts/*',
        '/x/*'
    ],
    selectors: {
        componentCode: '.mantine-Code-root pre',
        componentPreview: '[data-mantine-demo]',
        componentTitle: 'h1',
        componentDescription: '.mantine-Text-root.description',
        props: '[data-props-table]',
        styles: 'h2:contains("Styles API") + div',
        examples: '.mantine-Demo-root',
        usage: 'h2:contains("Usage") + div',
        accessibility: 'h2:contains("Accessibility") + div',
        polymorphic: 'h2:contains("Polymorphic") + div'
    },
    categories: {
        'Layout': ['app-shell', 'aspect-ratio', 'center', 'container', 'divider', 'flex', 'grid', 'group', 'paper', 'scroll-area', 'simple-grid', 'space', 'stack'],
        'Inputs': ['autocomplete', 'button', 'checkbox', 'chip', 'color-input', 'color-picker', 'file-button', 'file-input', 'input', 'json-input', 'multi-select', 'native-select', 'number-input', 'password-input', 'pin-input', 'radio', 'range-slider', 'rating', 'segmented-control', 'select', 'slider', 'switch', 'tags-input', 'textarea', 'text-input'],
        'Navigation': ['anchor', 'breadcrumbs', 'burger', 'nav-link', 'pagination', 'stepper', 'tabs'],
        'Data Display': ['avatar', 'background-image', 'badge', 'card', 'image', 'indicator', 'kbd', 'list', 'table', 'timeline', 'tree'],
        'Feedback': ['alert', 'loader', 'notification', 'progress', 'ring-progress', 'skeleton'],
        'Overlays': ['affix', 'dialog', 'drawer', 'hover-card', 'loading-overlay', 'menu', 'modal', 'overlay', 'popover', 'tooltip'],
        'Typography': ['blockquote', 'code', 'highlight', 'mark', 'text', 'title'],
        'Misc': ['action-icon', 'close-button', 'copy-button', 'fieldset', 'floating-indicator', 'focus-trap', 'pill', 'spoiler', 'theme-icon', 'transition']
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
        extractStylesAPI: true,
        extractPolymorphic: true,
        extractHooks: true,
        extractForm: true,
        extractDates: true,
        extractCharts: true,
        extractNotifications: true,
        extractModals: true,
        extractSpotlight: true,
        preserveMantineProvider: true
    },
    transformers: {
        componentName: (name) => name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(''),
        fileName: (name) => `${name}.tsx`,
        importPath: (name) => `@mantine/core`,
        hooksImport: (name) => `@mantine/hooks`,
        formImport: () => `@mantine/form`,
        datesImport: () => `@mantine/dates`,
        chartsImport: () => `@mantine/charts`
    },
    metadata: {
        framework: 'React',
        styling: 'CSS Modules/emotion',
        baseLibrary: 'Mantine',
        typescript: true,
        license: 'MIT',
        version: '7.x',
        darkMode: 'Built-in dark theme',
        responsive: 'Responsive components',
        hooks: '50+ custom hooks',
        forms: 'Advanced form management'
    }
};
