"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.daisyUIConfig = void 0;
exports.daisyUIConfig = {
    name: 'daisyui',
    displayName: 'DaisyUI',
    description: 'The most popular component library for Tailwind CSS',
    baseUrls: {
        docs: 'https://daisyui.com',
        components: 'https://daisyui.com/components/*',
        themes: 'https://daisyui.com/docs/themes',
        playground: 'https://daisyui.com/theme-generator'
    },
    componentPaths: [
        '/components/*',
        '/docs/themes/*',
        '/docs/customize/*'
    ],
    selectors: {
        componentCode: '.mockup-code pre',
        componentPreview: '.component-preview',
        componentTitle: 'h1',
        componentDescription: '.prose > p:first-of-type',
        examples: '.not-prose .flex',
        variants: '[data-theme]',
        classes: '.component-classes',
        modifiers: 'h2:contains("Modifiers") + div',
        responsive: 'h2:contains("Responsive") + div'
    },
    categories: {
        'Actions': ['button', 'dropdown', 'modal', 'swap', 'theme-controller'],
        'Data Display': ['accordion', 'avatar', 'badge', 'card', 'carousel', 'chat', 'collapse', 'countdown', 'diff', 'kbd', 'stat', 'table', 'timeline'],
        'Navigation': ['breadcrumbs', 'bottom-navigation', 'link', 'menu', 'navbar', 'pagination', 'steps', 'tab'],
        'Feedback': ['alert', 'loading', 'progress', 'radial-progress', 'skeleton', 'toast', 'tooltip'],
        'Data Input': ['checkbox', 'file-input', 'radio', 'range', 'rating', 'select', 'text-input', 'textarea', 'toggle'],
        'Layout': ['artboard', 'divider', 'drawer', 'footer', 'hero', 'indicator', 'join', 'mask', 'stack'],
        'Mockup': ['mockup-browser', 'mockup-code', 'mockup-phone', 'mockup-window']
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
        extractUtilityClasses: true,
        extractThemes: true,
        extractColorSchemes: true,
        extractModifiers: true,
        extractResponsive: true,
        extractStates: true,
        preserveTailwindClasses: true,
        extractCSSVariables: true
    },
    transformers: {
        componentName: (name) => name,
        fileName: (name) => `${name}.html`,
        className: (name) => name,
        utilityClass: (name) => name,
        themeVariable: (name) => `--${name}`
    },
    metadata: {
        framework: 'Framework agnostic',
        styling: 'Tailwind CSS',
        baseLibrary: 'CSS Components',
        typescript: false,
        license: 'MIT',
        version: '4.x',
        themes: '32 built-in themes',
        semantic: 'Semantic class names',
        cssOnly: 'Works without JavaScript'
    }
};
