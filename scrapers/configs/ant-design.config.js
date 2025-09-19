"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.antDesignConfig = void 0;
exports.antDesignConfig = {
    name: 'ant-design',
    displayName: 'Ant Design',
    description: 'A design language for enterprise-level products',
    baseUrls: {
        docs: 'https://ant.design',
        components: 'https://ant.design/components/*',
        proComponents: 'https://procomponents.ant.design',
        mobile: 'https://mobile.ant.design'
    },
    componentPaths: [
        '/components/*',
        '/components/*/en',
        '/components/*/cn'
    ],
    selectors: {
        componentCode: '.highlight pre code',
        componentPreview: '.code-box-demo',
        componentTitle: 'h1',
        componentDescription: '.markdown > p:first-child',
        apiProps: '.component-api table',
        examples: '.code-box',
        demoTitle: '.code-box-title',
        demoDescription: '.code-box-description',
        designSpec: '.design-spec',
        whenToUse: 'h2:contains("When To Use") + ul'
    },
    categories: {
        'General': ['button', 'icon', 'typography'],
        'Layout': ['divider', 'grid', 'layout', 'space'],
        'Navigation': ['affix', 'breadcrumb', 'dropdown', 'menu', 'page-header', 'pagination', 'steps'],
        'Data Entry': ['auto-complete', 'cascader', 'checkbox', 'date-picker', 'form', 'input', 'input-number', 'mentions', 'radio', 'rate', 'select', 'slider', 'switch', 'time-picker', 'transfer', 'tree-select', 'upload'],
        'Data Display': ['avatar', 'badge', 'calendar', 'card', 'carousel', 'collapse', 'comment', 'descriptions', 'empty', 'image', 'list', 'popover', 'qr-code', 'segmented', 'statistic', 'table', 'tabs', 'tag', 'timeline', 'tooltip', 'tree'],
        'Feedback': ['alert', 'drawer', 'message', 'modal', 'notification', 'popconfirm', 'progress', 'result', 'skeleton', 'spin', 'watermark'],
        'Other': ['anchor', 'back-top', 'config-provider', 'float-button', 'tour']
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
        extractLocale: true,
        extractDesignTokens: true,
        extractProComponents: true,
        extractMobileComponents: true,
        extractCharts: true,
        extractForms: true,
        extractTables: true,
        extractLess: true,
        preserveConfigProvider: true
    },
    transformers: {
        componentName: (name) => name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(''),
        fileName: (name) => `${name}.tsx`,
        importPath: (name) => `antd`,
        importProPath: (name) => `@ant-design/pro-components`,
        localeImport: (locale) => `antd/locale/${locale}_${locale.toUpperCase()}`
    },
    metadata: {
        framework: 'React',
        styling: 'Less/CSS-in-JS',
        baseLibrary: 'Ant Design',
        typescript: true,
        license: 'MIT',
        version: '5.x',
        i18n: 'Built-in internationalization',
        enterprise: true
    }
};
