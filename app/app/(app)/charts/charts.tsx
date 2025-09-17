// Export available chart components
// We'll start with basic charts and add more as we implement them

export { default as ChartAreaDefault } from "@/registry/new-york/charts/chart-area-default"
export { default as ChartBarDefault } from "@/registry/new-york/charts/chart-bar-default"
export { default as ChartLineDefault } from "@/registry/new-york/charts/chart-line-default"
export { default as ChartPieSimple } from "@/registry/new-york/charts/chart-pie-simple"

// Placeholder exports for charts we haven't implemented yet
// These will be replaced with actual implementations
export const ChartAreaStacked = () => null
export const ChartBarMultiple = () => null
export const ChartPieDonutText = () => null