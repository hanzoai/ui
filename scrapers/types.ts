export interface ScraperConfig {
  name: string
  displayName: string
  description: string

  baseUrls: {
    docs?: string
    components?: string
    api?: string
    github?: string
    registry?: string
    templates?: string
    themes?: string
    playground?: string
    pro?: string
    mobile?: string
    form?: string
    dates?: string
    charts?: string
    colors?: string
    primitives?: string
    recipes?: string
    hooks?: string
    customization?: string
  }

  componentPaths: string[]

  selectors: {
    componentCode?: string
    componentPreview?: string
    componentTitle?: string
    componentDescription?: string
    apiReference?: string
    apiProps?: string
    props?: string
    slots?: string
    events?: string
    examples?: string
    usage?: string
    accessibility?: string
    dependencies?: string
    installCommand?: string
    variants?: string
    responsivePreview?: string
    darkModeToggle?: string
    codeSnippet?: string
    demoTitle?: string
    demoDescription?: string
    designSpec?: string
    whenToUse?: string
    cssApi?: string
    playground?: string
    themeCustomization?: string
    theming?: string
    keyboardInteractions?: string
    renderProp?: string
    styles?: string
    polymorphic?: string
    classes?: string
    modifiers?: string
    responsive?: string
  }

  categories: Record<string, string[]>

  authentication: {
    required: boolean
    type?: 'license' | 'api-key' | 'oauth' | 'basic'
    envVars?: string[]
    headers?: Record<string, string>
  }

  rateLimit: {
    maxRequestsPerSecond: number
    delayMs: number
    maxConcurrent: number
    respectRobotsTxt?: boolean
  }

  specialRules: {
    extractRegistry?: boolean
    parseTypeScript?: boolean
    extractTailwindClasses?: boolean
    preserveImports?: boolean
    extractDependencies?: boolean
    requiresAuth?: boolean
    extractVariants?: boolean
    extractResponsive?: boolean
    extractDarkMode?: boolean
    preserveComments?: boolean
    extractAnimations?: boolean
    extractPrimitives?: boolean
    extractThemes?: boolean
    extractColors?: boolean
    parseAccessibility?: boolean
    extractKeyboardNav?: boolean
    extractDataAttributes?: boolean
    preserveAriaAttributes?: boolean
    extractReactVersion?: boolean
    extractVueVersion?: boolean
    extractRenderProps?: boolean
    extractSlots?: boolean
    preserveTypeScript?: boolean
    extractTransitions?: boolean
    extractA11yFeatures?: boolean
    extractThemeTokens?: boolean
    extractSystemProps?: boolean
    extractSxProps?: boolean
    extractSizes?: boolean
    extractBreakpoints?: boolean
    preserveJSX?: boolean
    extractDataGrid?: boolean
    extractLocale?: boolean
    extractDesignTokens?: boolean
    extractProComponents?: boolean
    extractMobileComponents?: boolean
    extractCharts?: boolean
    extractForms?: boolean
    extractTables?: boolean
    extractLess?: boolean
    preserveConfigProvider?: boolean
    extractStyleProps?: boolean
    extractColorMode?: boolean
    extractHooks?: boolean
    extractRecipes?: boolean
    preserveChakraFactory?: boolean
    extractStylesAPI?: boolean
    extractPolymorphic?: boolean
    extractForm?: boolean
    extractDates?: boolean
    extractNotifications?: boolean
    extractModals?: boolean
    extractSpotlight?: boolean
    preserveMantineProvider?: boolean
    extractRadius?: boolean
    extractShadows?: boolean
    preserveFramerMotion?: boolean
    extractUtilityClasses?: boolean
    extractColorSchemes?: boolean
    extractModifiers?: boolean
    extractStates?: boolean
    extractCSSVariables?: boolean
  }

  transformers: {
    componentName: (name: string) => string
    fileName: (name: string, framework?: string) => string
    importPath: (name: string, framework?: string) => string
    className?: (name: string) => string
    utilityClass?: (name: string) => string
    themeVariable?: (name: string) => string
    convertToFramework?: (code: string, framework: 'react' | 'vue' | 'svelte') => string
    importDataGrid?: (name: string) => string
    importProPath?: (name: string) => string
    localeImport?: (locale: string) => string
    hookImport?: (name: string) => string
    themeImport?: () => string
    hooksImport?: (name: string) => string
    formImport?: () => string
    datesImport?: () => string
    chartsImport?: () => string
    themesImportPath?: (name: string) => string
    individualImport?: (name: string) => string
  }

  metadata: {
    framework: string
    styling: string
    baseLibrary: string
    typescript: boolean
    license: string
    version?: string
    darkMode?: string
    responsive?: string
    a11y?: string
    accessibility?: string
    ssr?: string
    animation?: string
    theming?: string
    i18n?: string
    enterprise?: boolean
    hooks?: string
    forms?: string
    themes?: string
    semantic?: string
    cssOnly?: string
    requiresPurchase?: boolean
    maintainedBy?: string
  }
}