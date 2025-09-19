# @hanzo/ui Multi-Framework Component Library Report

## Executive Summary

A comprehensive multi-framework UI library system has been designed for @hanzo/ui that supports React, Vue, Svelte, and React Native. The system includes automated component tracking, framework adapters, and a unified build pipeline.

## 1. Component Coverage Analysis

### Framework Coverage Statistics
- **Total Unique Components**: 70
- **React/Next.js**: 45/70 (64%)
- **Svelte**: 49/70 (70%)
- **Vue**: 57/70 (81%)
- **React Native**: 30/70 (43%)

### Top Missing Components by Framework

#### React (Missing 25)
- auto-form, calendar, carousel, chart components, collapsible
- combobox, command, data-table, date-picker, drawer
- form, hover-card, menubar, navigation-menu, pagination
- pin-input, resizable, sonner, stepper, toggle-group

#### Svelte (Missing 21)
- alert-dialog, aspect-ratio, breadcrumb, calendar, chart
- context-menu, menubar, navigation-menu, pagination
- resizable, slider, sonner, toggle-group

#### Vue (Missing 13)
- input-otp, menubar, resizable, sidebar
- Some chart variants and specialized components

#### React Native (Missing 40)
- Most complex components like calendar, charts, data-table
- Advanced interactions: resizable, drawer, command palette
- Form components: combobox, date-picker, auto-form

## 2. Proposed Directory Structure

```
/Users/z/work/hanzo/ui/pkg/ui/
├── frameworks/
│   ├── react/              # React/Next.js components
│   │   ├── components/      # Component implementations
│   │   ├── hooks/          # React hooks
│   │   └── utils/          # React-specific utilities
│   ├── svelte/             # Svelte components
│   │   ├── components/      # Svelte components
│   │   ├── stores/         # Svelte stores
│   │   └── utils/          # Svelte utilities
│   ├── vue/                # Vue components
│   │   ├── components/      # Vue SFCs
│   │   ├── composables/    # Vue composables
│   │   └── utils/          # Vue utilities
│   ├── react-native/       # React Native components
│   │   ├── components/      # RN components
│   │   ├── hooks/          # RN hooks
│   │   └── utils/          # RN utilities
│   ├── core/               # Framework-agnostic code
│   │   ├── types/          # Shared TypeScript types
│   │   ├── utils/          # Shared utilities (cn, etc.)
│   │   └── styles/         # Shared style tokens
│   ├── adapters/           # Framework conversion tools
│   │   ├── react-to-svelte/
│   │   ├── react-to-vue/
│   │   ├── react-to-rn/
│   │   └── shared/
│   ├── tracker.json        # Component tracking metadata
│   └── registry.json       # Enhanced registry with multi-framework support
```

## 3. Build Configuration

### Multi-Framework Build Strategy

The system uses separate build pipelines for each framework:

- **React**: ESM + CJS with TypeScript declarations
- **Vue**: ESM modules with Vue SFC compilation
- **Svelte**: ESM with Svelte preprocessing
- **React Native**: CommonJS for Metro bundler compatibility
- **Core**: Framework-agnostic utilities in ESM + CJS
- **Adapters**: Node.js tools for component conversion

### Package Exports Map

```json
{
  "@hanzo/ui": "Default React export",
  "@hanzo/ui/react": "React components",
  "@hanzo/ui/vue": "Vue components",
  "@hanzo/ui/svelte": "Svelte components",
  "@hanzo/ui/react-native": "React Native components",
  "@hanzo/ui/core": "Framework-agnostic utilities",
  "@hanzo/ui/adapters": "Conversion tools"
}
```

## 4. Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [x] Clone and analyze all shadcn framework repositories
- [x] Create component tracking system (tracker.json)
- [x] Set up directory structure
- [x] Configure multi-framework build pipeline
- [ ] Copy existing React components to new structure

### Phase 2: Core Components (Week 2-3)
- [ ] Implement framework adapter utilities
- [ ] Create React-to-Vue converter
- [ ] Create React-to-Svelte converter
- [ ] Create React-to-RN converter
- [ ] Convert 10 most-used components to all frameworks

### Phase 3: Component Library (Week 4-6)
- [ ] Port remaining React components
- [ ] Import Svelte components from shadcn-svelte
- [ ] Import Vue components from shadcn-vue
- [ ] Adapt React Native components
- [ ] Ensure consistent APIs across frameworks

### Phase 4: Testing & Documentation (Week 7-8)
- [ ] Create framework-specific test suites
- [ ] Build interactive documentation site
- [ ] Create migration guides
- [ ] Performance benchmarking

### Phase 5: Advanced Features (Week 9-10)
- [ ] Implement automatic component syncing
- [ ] Create CLI for component installation
- [ ] Build visual regression testing
- [ ] Optimize bundle sizes

## 5. Technical Decisions

### Component API Consistency
All components will maintain consistent prop interfaces across frameworks:
- Same prop names and types
- Consistent event handler naming
- Shared TypeScript interfaces in core

### Styling Strategy
- Tailwind CSS classes for all frameworks
- CSS-in-JS avoided for better cross-framework compatibility
- Shared style tokens in core/styles

### Dependency Management
- Minimal framework-specific dependencies
- Radix UI for React, Radix Vue for Vue, Melt UI for Svelte
- Native implementations for React Native

## 6. Next Steps

### Immediate Actions
1. **Copy existing React components** to `frameworks/react/components/`
2. **Create component index files** for each framework
3. **Implement basic React-to-Vue converter**
4. **Test build pipeline** with a few components

### Scripts to Create
- `sync-components.js` - Sync components from upstream repos
- `convert-react-to-vue.js` - Automated React to Vue conversion
- `convert-react-to-svelte.js` - Automated React to Svelte conversion
- `validate-coverage.js` - Validate component coverage

### Testing Strategy
- Unit tests per framework using native testing tools
- Visual regression tests with Playwright
- Cross-framework API consistency tests
- Bundle size monitoring

## 7. Benefits

### For Developers
- **Single source of truth** for UI components
- **Consistent APIs** across frameworks
- **Automatic updates** from upstream shadcn
- **Type safety** with TypeScript

### For Users
- **Framework flexibility** - use components in any project
- **Smaller bundles** - only import needed framework
- **Consistent behavior** across frameworks
- **Regular updates** with new components

## 8. Risks & Mitigations

### Risks
1. **Maintenance burden** - 4 frameworks to maintain
2. **API divergence** - frameworks may require different APIs
3. **Build complexity** - multiple build pipelines
4. **Testing overhead** - 4x test suites

### Mitigations
1. **Automated syncing** from upstream repos
2. **Shared core logic** reduces duplication
3. **Automated testing** catches regressions
4. **Component adapters** handle API differences

## Conclusion

The multi-framework @hanzo/ui library will provide unprecedented flexibility for developers while maintaining consistency and quality. The automated tracking and conversion systems will minimize maintenance overhead while maximizing component availability across all supported frameworks.

The system is ready for implementation with clear structure, build configuration, and roadmap in place.