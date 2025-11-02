# Changelog

All notable changes to the Hanzo UI component library will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Slot support for Badge component with `asChild` prop for composition flexibility
- Modern focus-visible states for Badge component with ring styling
- SVG icon support in Badge component with automatic sizing
- Aria-invalid states for Badge form validation
- Data-slot attributes for better styling hooks

### Changed
- **THEME**: Restored electric blue primary color (`oklch(0.653 0.269 252.44)`) as default
- **THEME**: Updated to use shadcn/ui's neutral gray color scheme for backgrounds and text
- **THEME**: Maintained configurable theme system via theme generator
- Badge component now uses `<span>` instead of `<div>` for better semantics
- Badge font weight changed from `font-semibold` to `font-medium`
- Badge padding adjusted from `px-2.5` to `px-2`
- Badge hover states now only apply within anchor tags (`[a&]:hover`)
- Updated both default (rounded-full) and new-york (rounded-md) badge variants

### Fixed
- Badge component styling now matches shadcn/ui v4 implementation
- Improved accessibility with proper focus-visible states
- Better form integration with aria-invalid support

### Removed
- Removed hanzo-compatibility documentation page (redundant with main docs)

## [5.0.0] - 2025-10-18

### Added
- Next.js 16.0.0 with Turbopack support
- React 19.2.0 support
- 150+ components in registry
- AI-specific components (ai-chat, ai-playground, ai-assistant, ai-vision, etc.)
- 3D components (3d-button, 3d-card, 3d-carousel, 3d-grid, etc.)
- Animation components (animated-beam, animated-text, animated-cursor, etc.)
- Page builder with drag-drop functionality
- White-label system for Zoo UI and Lux UI forks
- External registry support (35+ sources)
- 24+ full-page block templates

### Changed
- Migrated from Contentlayer to Fumadocs for MDX processing
- Updated documentation structure
- Improved build process with registry-first approach

### Technical
- Tailwind CSS v4.1.14
- TypeScript 5.9.3
- pnpm 9.0.6+ workspace support
- Turborepo build system

---

## Version Comparison

**Hanzo UI vs shadcn/ui:**
- **161 components** vs shadcn's 58 components (3x more)
- **Unique to Hanzo UI**: AI components (12), 3D components (9), Animation components (13), specialized navigation variants (15+)
- **100% compatible** with shadcn/ui CLI and registry system
- **Multi-framework support**: React (100%), Vue (~90%), Svelte (~85%), React Native (~70%)

## Component Status

- **Implemented**: ~127 fully functional components
- **Stub Components**: ~34 need implementation
- **Blocks**: 24+ viewport-sized templates
- **AI Components**: 12 specialized AI/ML components
- **3D Components**: 9 three-dimensional UI elements
- **Animation Components**: 13 motion and transition components

## Migration Notes

### From shadcn/ui
Hanzo UI is a drop-in replacement for shadcn/ui with additional components:
```bash
# Instead of
npx shadcn-ui@latest add button

# Use
npx @hanzo/ui@latest add button
```

All shadcn/ui components work identically in Hanzo UI, plus you get access to 100+ additional components.

## Links

- **Website**: https://ui.hanzo.ai
- **Documentation**: https://ui.hanzo.ai/docs
- **GitHub**: https://github.com/hanzoai/ui
- **npm Package**: https://www.npmjs.com/package/@hanzo/ui

## License

MIT License - see [LICENSE](LICENSE) for details
