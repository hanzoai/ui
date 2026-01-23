/**
 * Hanzo UI - v4 Registry System
 *
 * This is the main entry point for the v4 registry system.
 * It supports both Radix UI and Base UI as primitive providers,
 * multiple visual styles, and Hanzo-specific component extensions.
 *
 * Architecture:
 * - bases/radix/ - Components using Radix UI primitives
 * - bases/base/  - Components using Base UI primitives
 * - hanzo/       - Hanzo-specific extensions (AI, finance, 3D, etc.)
 */

// Schema exports
export * from "./schema"

// Configuration exports
export * from "./config"

// Base definitions
export { BASES, type Base, type BaseName } from "./bases"

// Style definitions
export { STYLES, type Style, type StyleName } from "./styles"

// Theme definitions
export { THEMES, type Theme, type ThemeName } from "./themes"

// Base color definitions
export { BASE_COLORS, type BaseColor, type BaseColorName } from "./base-colors"

// Font definitions
export { fonts, type Font, type FontName } from "./fonts"

// Icon library definitions
export { iconLibraries, type IconLibrary, type IconLibraryName } from "./icons"

// Registry loaders
export * from "./registry"

// Documentation integration
export * from "./docs-integration"
