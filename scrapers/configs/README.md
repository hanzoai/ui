# UI Library Scraper Configurations

This directory contains crawler configuration files for all major UI component libraries.

## Configured Libraries

### 1. **shadcn/ui** (`shadcn-ui.config.ts`)
- **Framework**: React
- **Styling**: Tailwind CSS + Radix UI
- **Features**: Registry-based components, TypeScript support
- **Authentication**: Not required

### 2. **Tailwind UI** (`tailwind-ui.config.ts`)
- **Framework**: React/Vue/HTML
- **Styling**: Tailwind CSS
- **Features**: Premium components, multiple variants
- **Authentication**: Required (license key)

### 3. **Radix UI** (`radix-ui.config.ts`)
- **Framework**: React
- **Styling**: Unstyled primitives
- **Features**: Accessible components, keyboard navigation
- **Authentication**: Not required

### 4. **Headless UI** (`headless-ui.config.ts`)
- **Framework**: React/Vue
- **Styling**: Unstyled (bring your own)
- **Features**: Fully accessible, render props
- **Authentication**: Not required

### 5. **Material UI (MUI)** (`material-ui.config.ts`)
- **Framework**: React
- **Styling**: emotion/styled-components
- **Features**: Material Design, theming system
- **Authentication**: Not required

### 6. **Ant Design** (`ant-design.config.ts`)
- **Framework**: React
- **Styling**: Less/CSS-in-JS
- **Features**: Enterprise components, i18n support
- **Authentication**: Not required

### 7. **Chakra UI** (`chakra-ui.config.ts`)
- **Framework**: React
- **Styling**: emotion/styled-system
- **Features**: Dark mode, responsive, accessible
- **Authentication**: Not required

### 8. **Mantine** (`mantine.config.ts`)
- **Framework**: React
- **Styling**: CSS Modules/emotion
- **Features**: 50+ hooks, form management, charts
- **Authentication**: Not required

### 9. **NextUI** (`nextui.config.ts`)
- **Framework**: React
- **Styling**: Tailwind CSS
- **Features**: Dark mode, Framer Motion animations
- **Authentication**: Not required

### 10. **DaisyUI** (`daisyui.config.ts`)
- **Framework**: Framework agnostic
- **Styling**: Tailwind CSS
- **Features**: 32 themes, semantic classes, CSS-only
- **Authentication**: Not required

## Configuration Structure

Each configuration file includes:

```typescript
{
  name: string              // Internal identifier
  displayName: string       // Human-readable name
  description: string       // Brief description

  baseUrls: {              // Documentation and API URLs
    docs: string
    components: string
    // ...
  }

  componentPaths: []       // URL patterns for components

  selectors: {            // CSS selectors for content extraction
    componentCode: string
    componentPreview: string
    // ...
  }

  categories: {}          // Component categorization

  authentication: {       // Auth requirements
    required: boolean
    type?: string
    envVars?: []
  }

  rateLimit: {           // Rate limiting settings
    maxRequestsPerSecond: number
    delayMs: number
    maxConcurrent: number
  }

  specialRules: {}       // Library-specific extraction rules

  transformers: {}       // Code transformation functions

  metadata: {}           // Additional library information
}
```

## Usage

```typescript
import { UI_LIBRARY_CONFIGS } from './configs'

// Get a specific configuration
const shadcnConfig = UI_LIBRARY_CONFIGS['shadcn-ui']

// Get all configurations
import { getAllConfigs } from './configs'
const allConfigs = getAllConfigs()

// Filter by framework
import { getConfigsByFramework } from './configs'
const reactLibraries = getConfigsByFramework('React')

// Check authentication requirements
import { validateAuthentication } from './configs'
const isValid = validateAuthentication(config)
```

## Environment Variables

For libraries requiring authentication:

### Tailwind UI
```bash
export TAILWIND_UI_LICENSE_KEY="your-license-key"
```

## Rate Limiting

Each configuration includes rate limiting settings to respect service limits:

- **shadcn/ui**: 2 req/s, 500ms delay
- **Tailwind UI**: 1 req/s, 1000ms delay (auth required)
- **Radix UI**: 3 req/s, 333ms delay
- **Headless UI**: 3 req/s, 333ms delay
- **Material UI**: 2 req/s, 500ms delay
- **Ant Design**: 2 req/s, 500ms delay
- **Chakra UI**: 3 req/s, 333ms delay
- **Mantine**: 3 req/s, 333ms delay
- **NextUI**: 3 req/s, 333ms delay
- **DaisyUI**: 3 req/s, 333ms delay

## Special Rules

Each library has specific extraction rules:

- **extractRegistry**: For registry-based components (shadcn/ui)
- **extractVariants**: For multiple component variants
- **extractDarkMode**: For dark mode implementations
- **extractAccessibility**: For ARIA attributes and keyboard navigation
- **extractThemeTokens**: For design token systems
- **extractResponsive**: For responsive utilities

## Testing

Run the verification script:
```bash
node scrapers/verify-configs.cjs
```

Or use the TypeScript test (requires compilation):
```bash
npx ts-node scrapers/test-configs.ts
```