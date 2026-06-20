# Chart Components Usage Guide

## 🚀 Quick Start

All 63 chart components have been migrated and are ready to use. This guide helps you get started quickly.

---

## 📦 Import Charts

### Method 1: Direct Import (Recommended)
```typescript
// Import specific chart
import AreaDefault from '@hanzo/ui/primitives/charts/area/chart-area-default'
import BarInteractive from '@hanzo/ui/primitives/charts/bar/chart-bar-interactive'
```

### Method 2: Category Import
```typescript
// Import all area charts
import * as AreaCharts from '@hanzo/ui/primitives/charts/area'

// Use specific chart
<AreaCharts.AreaDefault />
<AreaCharts.AreaInteractive />
```

### Method 3: Named Exports
```typescript
// Import from category index
import { AreaDefault, AreaInteractive } from '@hanzo/ui/primitives/charts/area'
import { BarDefault, BarInteractive } from '@hanzo/ui/primitives/charts/bar'
```

---

## 🎨 Available Chart Types

### Area Charts (10)
- `AreaDefault` - Simple area chart
- `AreaAxes` - Area chart with X and Y axes
- `AreaGradient` - Area chart with gradient fill
- `AreaIcons` - Area chart with legend icons
- `AreaInteractive` - Interactive area chart with state
- `AreaLegend` - Area chart with legend
- `AreaLinear` - Linear interpolation area chart
- `AreaStacked` - Stacked area chart
- `AreaStackedExpand` - Expanded stacked area chart
- `AreaStep` - Step interpolation area chart

### Bar Charts (10)
- `BarDefault` - Simple bar chart
- `BarActive` - Bar chart with active bar highlighting
- `BarHorizontal` - Horizontal bar chart
- `BarInteractive` - Interactive bar chart
- `BarLabel` - Bar chart with labels
- `BarLabelCustom` - Bar chart with custom labels
- `BarMixed` - Mixed bar chart
- `BarMultiple` - Multiple series bar chart
- `BarNegative` - Bar chart with negative values
- `BarStacked` - Stacked bar chart

### Line Charts (10)
- `LineDefault` - Simple line chart
- `LineDots` - Line chart with dots
- `LineDotsColors` - Line chart with colored dots
- `LineDotsCustom` - Line chart with custom dots
- `LineInteractive` - Interactive line chart
- `LineLabel` - Line chart with labels
- `LineLabelCustom` - Line chart with custom labels
- `LineLinear` - Linear interpolation line chart
- `LineMultiple` - Multiple series line chart
- `LineStep` - Step interpolation line chart

### Pie Charts (9)
- `PieDonut` - Simple donut chart
- `PieDonutActive` - Donut chart with active segment
- `PieDonutText` - Donut chart with center text
- `PieInteractive` - Interactive pie chart
- `PieLabel` - Pie chart with labels
- `PieLabelCustom` - Pie chart with custom labels
- `PieLabelList` - Pie chart with label list
- `PieLegend` - Pie chart with legend
- `PieSeparatorNone` - Pie chart without separators

### Radar Charts (9)
- `RadarDefault` - Simple radar chart
- `RadarDots` - Radar chart with dots
- `RadarGridCircle` - Radar with circular grid
- `RadarGridCircleFill` - Radar with filled circular grid
- `RadarGridCircleNoLines` - Radar with circle grid, no lines
- `RadarGridCustom` - Radar with custom grid
- `RadarGridFill` - Radar with filled grid
- `RadarGridNone` - Radar without grid
- `RadarIcons` - Radar chart with icons

### Radial Charts (6)
- `RadialSimple` - Simple radial chart
- `RadialGrid` - Radial chart with grid
- `RadialLabel` - Radial chart with labels
- `RadialShape` - Radial chart with custom shape
- `RadialStacked` - Stacked radial chart
- `RadialText` - Radial chart with text

### Tooltip Charts (9)
- `TooltipDefault` - Chart with default tooltip
- `TooltipAdvanced` - Chart with advanced tooltip
- `TooltipFormatter` - Chart with formatted tooltip
- `TooltipIcons` - Chart with icon tooltips
- `TooltipIndicatorLine` - Chart with line indicator
- `TooltipIndicatorNone` - Chart without indicator
- `TooltipLabelCustom` - Chart with custom label
- `TooltipLabelFormatter` - Chart with formatted label
- `TooltipLabelNone` - Chart without label

---

## 💡 Usage Examples

### Basic Chart
```tsx
import AreaDefault from '@hanzo/ui/primitives/charts/area/chart-area-default'

export default function MyPage() {
  return (
    <div>
      <h1>Sales Dashboard</h1>
      <AreaDefault />
    </div>
  )
}
```

### Interactive Chart
```tsx
import BarInteractive from '@hanzo/ui/primitives/charts/bar/chart-bar-interactive'

export default function MyPage() {
  return (
    <div>
      <h1>Interactive Analytics</h1>
      <BarInteractive />
    </div>
  )
}
```

### Multiple Charts
```tsx
import { AreaDefault, AreaStacked } from '@hanzo/ui/primitives/charts/area'
import { BarDefault, BarMultiple } from '@hanzo/ui/primitives/charts/bar'

export default function Dashboard() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <AreaDefault />
      <AreaStacked />
      <BarDefault />
      <BarMultiple />
    </div>
  )
}
```

### With Custom Data
Each chart component comes with sample data, but you can customize by copying the component and modifying the `chartData` and `chartConfig`:

```tsx
// Copy chart-area-default.tsx and customize
const customChartData = [
  { month: "Jan", revenue: 1000 },
  { month: "Feb", revenue: 1500 },
  { month: "Mar", revenue: 1200 },
]

const customChartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig
```

---

## 🔧 Chart Primitives

All charts use these primitives (already imported in each chart):

```typescript
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@hanzo/ui/primitives/chart'
```

### ChartConfig Type
```typescript
type ChartConfig = {
  [key: string]: {
    label: string
    color?: string
    icon?: React.ComponentType
  }
}
```

---

## 🎯 Interactive Charts

4 charts support user interaction:

### 1. Area Interactive
- Location: `charts/area/chart-area-interactive.tsx`
- Features: Click to toggle data series
- State: Uses `useState` for active chart

### 2. Bar Interactive
- Location: `charts/bar/chart-bar-interactive.tsx`
- Features: Click bars for details
- State: Manages active bar state

### 3. Line Interactive
- Location: `charts/line/chart-line-interactive.tsx`
- Features: Hover and click interactions
- State: Track active data points

### 4. Pie Interactive
- Location: `charts/pie/chart-pie-interactive.tsx`
- Features: Click segments to view details
- State: Active segment tracking

---

## 📊 Data Patterns

### Monthly Data (38 charts)
```typescript
const chartData = [
  { month: "January", value: 186 },
  { month: "February", value: 305 },
  // ...
]
```

### Multi-Series Data (19 charts)
```typescript
const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  // ...
]
```

### Time Series Data (12 charts)
```typescript
const chartData = [
  { date: "2024-01-01", value: 186 },
  { date: "2024-01-02", value: 305 },
  // ...
]
```

---

## 🛠️ Customization

### Modify Colors
```typescript
const chartConfig = {
  series1: {
    label: "Series 1",
    color: "hsl(var(--chart-1))", // Use CSS variables
  },
  series2: {
    label: "Series 2",
    color: "#3b82f6", // Or direct colors
  },
} satisfies ChartConfig
```

### Add Icons
```typescript
import { TrendingUp, TrendingDown } from 'lucide-react'

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
    icon: TrendingUp, // Add icon
  },
} satisfies ChartConfig
```

### Custom Tooltips
```typescript
<ChartTooltip
  cursor={false}
  content={<ChartTooltipContent indicator="line" />}
/>
```

### Custom Axes
```typescript
<XAxis
  dataKey="month"
  tickLine={false}
  axisLine={false}
  tickMargin={8}
  tickFormatter={(value) => value.slice(0, 3)} // Jan, Feb, Mar
/>
```

---

## ✅ Best Practices

1. **Use TypeScript** - All charts have full type safety
   ```typescript
   const config: ChartConfig = { ... }
   ```

2. **Use satisfies** - Better type inference
   ```typescript
   const config = { ... } satisfies ChartConfig
   ```

3. **Client Components** - Interactive charts need "use client"
   ```typescript
   "use client"
   import { useState } from 'react'
   ```

4. **Accessibility** - Charts include `accessibilityLayer`
   ```typescript
   <AreaChart accessibilityLayer data={chartData}>
   ```

5. **Responsive** - Use ChartContainer for responsiveness
   ```typescript
   <ChartContainer config={chartConfig}>
     <AreaChart data={chartData}>
       {/* ... */}
     </AreaChart>
   </ChartContainer>
   ```

---

## 🐛 Troubleshooting

### Chart Not Rendering
- Ensure `recharts` is installed: `npm install recharts`
- Check that chart primitive imports are correct
- Verify data structure matches chart requirements

### TypeScript Errors
- Use `satisfies ChartConfig` for type safety
- Ensure all required imports are present
- Check that data types match chart expectations

### Interactive Charts Not Working
- Add `"use client"` directive at top of file
- Import `useState` from React
- Ensure event handlers are properly bound

---

## 📚 Additional Resources

- **Test Files:** `/pkg/ui/test/charts.test.js`
- **Visual Tests:** `/pkg/ui/test/charts-visual-test.tsx`
- **Full Report:** `/pkg/ui/test/charts-migration-report.json`
- **Recharts Docs:** https://recharts.org/

---

## 🎉 Quick Reference

| Category | Count | Interactive | Notes |
|----------|-------|-------------|-------|
| Area     | 10    | 1           | Gradient, stacked variants |
| Bar      | 10    | 1           | Horizontal, negative values |
| Line     | 10    | 1           | Dots, step variants |
| Pie      | 9     | 1           | Donut, labels |
| Radar    | 9     | 0           | Grid variants |
| Radial   | 6     | 0           | Progress style |
| Tooltip  | 9     | 0           | Tooltip demos |

**Total: 63 charts ready to use! 🚀**
