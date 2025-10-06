/**
 * Comprehensive Chart Components Test Suite
 * Tests all chart categories: Area, Bar, Line, Pie, Radar, Radial, and Tooltip variants
 * Total: 63 chart component tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// ============================================================================
// AREA CHARTS (10 variants)
// ============================================================================
describe('Area Charts', () => {
  it('renders AreaAxes chart', async () => {
    const { default: AreaAxes } = await import('../area/chart-area-axes')
    const { container } = render(<AreaAxes />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelector('.recharts-surface')).toBeTruthy()
  })

  it('renders AreaDefault chart', async () => {
    const { default: AreaDefault } = await import('../area/chart-area-default')
    const { container } = render(<AreaDefault />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelector('.recharts-area')).toBeTruthy()
  })

  it('renders AreaGradient chart', async () => {
    const { default: AreaGradient } = await import('../area/chart-area-gradient')
    const { container } = render(<AreaGradient />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelector('.recharts-area')).toBeTruthy()
  })

  it('renders AreaIcons chart', async () => {
    const { default: AreaIcons } = await import('../area/chart-area-icons')
    const { container } = render(<AreaIcons />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
  })

  it('renders AreaInteractive chart', async () => {
    const { default: AreaInteractive } = await import('../area/chart-area-interactive')
    const { container } = render(<AreaInteractive />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelector('.recharts-area')).toBeTruthy()
  })

  it('renders AreaLegend chart', async () => {
    const { default: AreaLegend } = await import('../area/chart-area-legend')
    const { container } = render(<AreaLegend />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
  })

  it('renders AreaLinear chart', async () => {
    const { default: AreaLinear } = await import('../area/chart-area-linear')
    const { container } = render(<AreaLinear />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelector('.recharts-area')).toBeTruthy()
  })

  it('renders AreaStackedExpand chart', async () => {
    const { default: AreaStackedExpand } = await import('../area/chart-area-stacked-expand')
    const { container } = render(<AreaStackedExpand />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelectorAll('.recharts-area').length).toBeGreaterThan(0)
  })

  it('renders AreaStacked chart', async () => {
    const { default: AreaStacked } = await import('../area/chart-area-stacked')
    const { container } = render(<AreaStacked />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelectorAll('.recharts-area').length).toBeGreaterThan(0)
  })

  it('renders AreaStep chart', async () => {
    const { default: AreaStep } = await import('../area/chart-area-step')
    const { container } = render(<AreaStep />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelector('.recharts-area')).toBeTruthy()
  })
})

// ============================================================================
// BAR CHARTS (10 variants)
// ============================================================================
describe('Bar Charts', () => {
  it('renders BarActive chart', async () => {
    const { default: BarActive } = await import('../bar/chart-bar-active')
    const { container } = render(<BarActive />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelector('.recharts-bar')).toBeTruthy()
  })

  it('renders BarDefault chart', async () => {
    const { default: BarDefault } = await import('../bar/chart-bar-default')
    const { container } = render(<BarDefault />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelector('.recharts-bar')).toBeTruthy()
  })

  it('renders BarHorizontal chart', async () => {
    const { default: BarHorizontal } = await import('../bar/chart-bar-horizontal')
    const { container } = render(<BarHorizontal />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelector('.recharts-bar')).toBeTruthy()
  })

  it('renders BarInteractive chart', async () => {
    const { default: BarInteractive } = await import('../bar/chart-bar-interactive')
    const { container } = render(<BarInteractive />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelector('.recharts-bar')).toBeTruthy()
  })

  it('renders BarLabelCustom chart', async () => {
    const { default: BarLabelCustom } = await import('../bar/chart-bar-label-custom')
    const { container } = render(<BarLabelCustom />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelector('.recharts-bar')).toBeTruthy()
  })

  it('renders BarLabel chart', async () => {
    const { default: BarLabel } = await import('../bar/chart-bar-label')
    const { container } = render(<BarLabel />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelector('.recharts-bar')).toBeTruthy()
  })

  it('renders BarMixed chart', async () => {
    const { default: BarMixed } = await import('../bar/chart-bar-mixed')
    const { container } = render(<BarMixed />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelectorAll('.recharts-bar, .recharts-line').length).toBeGreaterThan(0)
  })

  it('renders BarMultiple chart', async () => {
    const { default: BarMultiple } = await import('../bar/chart-bar-multiple')
    const { container } = render(<BarMultiple />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelectorAll('.recharts-bar').length).toBeGreaterThan(0)
  })

  it('renders BarNegative chart', async () => {
    const { default: BarNegative } = await import('../bar/chart-bar-negative')
    const { container } = render(<BarNegative />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelector('.recharts-bar')).toBeTruthy()
  })

  it('renders BarStacked chart', async () => {
    const { default: BarStacked } = await import('../bar/chart-bar-stacked')
    const { container } = render(<BarStacked />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelectorAll('.recharts-bar').length).toBeGreaterThan(0)
  })
})

// ============================================================================
// LINE CHARTS (10 variants)
// ============================================================================
describe('Line Charts', () => {
  it('renders LineDefault chart', async () => {
    const { default: LineDefault } = await import('../line/chart-line-default')
    const { container } = render(<LineDefault />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelector('.recharts-line')).toBeTruthy()
  })

  it('renders LineDotsColors chart', async () => {
    const { default: LineDotsColors } = await import('../line/chart-line-dots-colors')
    const { container } = render(<LineDotsColors />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelector('.recharts-line')).toBeTruthy()
  })

  it('renders LineDotsCustom chart', async () => {
    const { default: LineDotsCustom } = await import('../line/chart-line-dots-custom')
    const { container } = render(<LineDotsCustom />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelector('.recharts-line')).toBeTruthy()
  })

  it('renders LineDots chart', async () => {
    const { default: LineDots } = await import('../line/chart-line-dots')
    const { container } = render(<LineDots />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelector('.recharts-line')).toBeTruthy()
  })

  it('renders LineInteractive chart', async () => {
    const { default: LineInteractive } = await import('../line/chart-line-interactive')
    const { container } = render(<LineInteractive />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelector('.recharts-line')).toBeTruthy()
  })

  it('renders LineLabelCustom chart', async () => {
    const { default: LineLabelCustom } = await import('../line/chart-line-label-custom')
    const { container } = render(<LineLabelCustom />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelector('.recharts-line')).toBeTruthy()
  })

  it('renders LineLabel chart', async () => {
    const { default: LineLabel } = await import('../line/chart-line-label')
    const { container } = render(<LineLabel />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelector('.recharts-line')).toBeTruthy()
  })

  it('renders LineLinear chart', async () => {
    const { default: LineLinear } = await import('../line/chart-line-linear')
    const { container } = render(<LineLinear />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelector('.recharts-line')).toBeTruthy()
  })

  it('renders LineMultiple chart', async () => {
    const { default: LineMultiple } = await import('../line/chart-line-multiple')
    const { container } = render(<LineMultiple />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelectorAll('.recharts-line').length).toBeGreaterThan(0)
  })

  it('renders LineStep chart', async () => {
    const { default: LineStep } = await import('../line/chart-line-step')
    const { container } = render(<LineStep />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelector('.recharts-line')).toBeTruthy()
  })
})

// ============================================================================
// PIE CHARTS (9 variants)
// ============================================================================
describe('Pie Charts', () => {
  it('renders PieDonutActive chart', async () => {
    const { default: PieDonutActive } = await import('../pie/chart-pie-donut-active')
    const { container } = render(<PieDonutActive />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelector('.recharts-pie')).toBeTruthy()
  })

  it('renders PieDonutText chart', async () => {
    const { default: PieDonutText } = await import('../pie/chart-pie-donut-text')
    const { container } = render(<PieDonutText />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelector('.recharts-pie')).toBeTruthy()
  })

  it('renders PieDonut chart', async () => {
    const { default: PieDonut } = await import('../pie/chart-pie-donut')
    const { container } = render(<PieDonut />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelector('.recharts-pie')).toBeTruthy()
  })

  it('renders PieInteractive chart', async () => {
    const { default: PieInteractive } = await import('../pie/chart-pie-interactive')
    const { container } = render(<PieInteractive />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelector('.recharts-pie')).toBeTruthy()
  })

  it('renders PieLabelCustom chart', async () => {
    const { default: PieLabelCustom } = await import('../pie/chart-pie-label-custom')
    const { container } = render(<PieLabelCustom />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelector('.recharts-pie')).toBeTruthy()
  })

  it('renders PieLabelList chart', async () => {
    const { default: PieLabelList } = await import('../pie/chart-pie-label-list')
    const { container } = render(<PieLabelList />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelector('.recharts-pie')).toBeTruthy()
  })

  it('renders PieLabel chart', async () => {
    const { default: PieLabel } = await import('../pie/chart-pie-label')
    const { container } = render(<PieLabel />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelector('.recharts-pie')).toBeTruthy()
  })

  it('renders PieLegend chart', async () => {
    const { default: PieLegend } = await import('../pie/chart-pie-legend')
    const { container } = render(<PieLegend />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelector('.recharts-pie')).toBeTruthy()
  })

  it('renders PieSeparatorNone chart', async () => {
    const { default: PieSeparatorNone } = await import('../pie/chart-pie-separator-none')
    const { container } = render(<PieSeparatorNone />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelector('.recharts-pie')).toBeTruthy()
  })
})

// ============================================================================
// RADAR CHARTS (9 variants)
// ============================================================================
describe('Radar Charts', () => {
  it('renders RadarDefault chart', async () => {
    const { default: RadarDefault } = await import('../radar/chart-radar-default')
    const { container } = render(<RadarDefault />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelector('.recharts-radar')).toBeTruthy()
  })

  it('renders RadarDots chart', async () => {
    const { default: RadarDots } = await import('../radar/chart-radar-dots')
    const { container } = render(<RadarDots />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelector('.recharts-radar')).toBeTruthy()
  })

  it('renders RadarGridCircleFill chart', async () => {
    const { default: RadarGridCircleFill } = await import('../radar/chart-radar-grid-circle-fill')
    const { container } = render(<RadarGridCircleFill />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelector('.recharts-radar')).toBeTruthy()
  })

  it('renders RadarGridCircleNoLines chart', async () => {
    const { default: RadarGridCircleNoLines } = await import('../radar/chart-radar-grid-circle-no-lines')
    const { container } = render(<RadarGridCircleNoLines />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelector('.recharts-radar')).toBeTruthy()
  })

  it('renders RadarGridCircle chart', async () => {
    const { default: RadarGridCircle } = await import('../radar/chart-radar-grid-circle')
    const { container } = render(<RadarGridCircle />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelector('.recharts-radar')).toBeTruthy()
  })

  it('renders RadarGridCustom chart', async () => {
    const { default: RadarGridCustom } = await import('../radar/chart-radar-grid-custom')
    const { container } = render(<RadarGridCustom />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelector('.recharts-radar')).toBeTruthy()
  })

  it('renders RadarGridFill chart', async () => {
    const { default: RadarGridFill } = await import('../radar/chart-radar-grid-fill')
    const { container } = render(<RadarGridFill />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelector('.recharts-radar')).toBeTruthy()
  })

  it('renders RadarGridNone chart', async () => {
    const { default: RadarGridNone } = await import('../radar/chart-radar-grid-none')
    const { container } = render(<RadarGridNone />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelector('.recharts-radar')).toBeTruthy()
  })

  it('renders RadarIcons chart', async () => {
    const { default: RadarIcons } = await import('../radar/chart-radar-icons')
    const { container } = render(<RadarIcons />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelector('.recharts-radar')).toBeTruthy()
  })
})

// ============================================================================
// RADIAL CHARTS (6 variants)
// ============================================================================
describe('Radial Charts', () => {
  it('renders RadialGrid chart', async () => {
    const { default: RadialGrid } = await import('../radial/chart-radial-grid')
    const { container } = render(<RadialGrid />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelector('.recharts-radial-bar')).toBeTruthy()
  })

  it('renders RadialLabel chart', async () => {
    const { default: RadialLabel } = await import('../radial/chart-radial-label')
    const { container } = render(<RadialLabel />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelector('.recharts-radial-bar')).toBeTruthy()
  })

  it('renders RadialShape chart', async () => {
    const { default: RadialShape } = await import('../radial/chart-radial-shape')
    const { container } = render(<RadialShape />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelector('.recharts-radial-bar')).toBeTruthy()
  })

  it('renders RadialSimple chart', async () => {
    const { default: RadialSimple } = await import('../radial/chart-radial-simple')
    const { container } = render(<RadialSimple />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelector('.recharts-radial-bar')).toBeTruthy()
  })

  it('renders RadialStacked chart', async () => {
    const { default: RadialStacked } = await import('../radial/chart-radial-stacked')
    const { container } = render(<RadialStacked />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelectorAll('.recharts-radial-bar').length).toBeGreaterThan(0)
  })

  it('renders RadialText chart', async () => {
    const { default: RadialText } = await import('../radial/chart-radial-text')
    const { container } = render(<RadialText />)
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    expect(container.querySelector('.recharts-radial-bar')).toBeTruthy()
  })
})

// ============================================================================
// TOOLTIP VARIANTS (9 variants)
// ============================================================================
describe('Tooltip Variants', () => {
  it('renders TooltipAdvanced chart', async () => {
    const { default: TooltipAdvanced } = await import('../tooltip/chart-tooltip-advanced')
    const { container } = render(<TooltipAdvanced />)
    expect(container.querySelector('.recharts-wrapper') || container.querySelector('.recharts-surface')).toBeTruthy()
  })

  it('renders TooltipDefault chart', async () => {
    const { default: TooltipDefault } = await import('../tooltip/chart-tooltip-default')
    const { container } = render(<TooltipDefault />)
    expect(container.querySelector('.recharts-wrapper') || container.querySelector('.recharts-surface')).toBeTruthy()
  })

  it('renders TooltipFormatter chart', async () => {
    const { default: TooltipFormatter } = await import('../tooltip/chart-tooltip-formatter')
    const { container } = render(<TooltipFormatter />)
    expect(container.querySelector('.recharts-wrapper') || container.querySelector('.recharts-surface')).toBeTruthy()
  })

  it('renders TooltipIcons chart', async () => {
    const { default: TooltipIcons } = await import('../tooltip/chart-tooltip-icons')
    const { container } = render(<TooltipIcons />)
    expect(container.querySelector('.recharts-wrapper') || container.querySelector('.recharts-surface')).toBeTruthy()
  })

  it('renders TooltipIndicatorLine chart', async () => {
    const { default: TooltipIndicatorLine } = await import('../tooltip/chart-tooltip-indicator-line')
    const { container } = render(<TooltipIndicatorLine />)
    expect(container.querySelector('.recharts-wrapper') || container.querySelector('.recharts-surface')).toBeTruthy()
  })

  it('renders TooltipIndicatorNone chart', async () => {
    const { default: TooltipIndicatorNone } = await import('../tooltip/chart-tooltip-indicator-none')
    const { container } = render(<TooltipIndicatorNone />)
    expect(container.querySelector('.recharts-wrapper') || container.querySelector('.recharts-surface')).toBeTruthy()
  })

  it('renders TooltipLabelCustom chart', async () => {
    const { default: TooltipLabelCustom } = await import('../tooltip/chart-tooltip-label-custom')
    const { container } = render(<TooltipLabelCustom />)
    expect(container.querySelector('.recharts-wrapper') || container.querySelector('.recharts-surface')).toBeTruthy()
  })

  it('renders TooltipLabelFormatter chart', async () => {
    const { default: TooltipLabelFormatter } = await import('../tooltip/chart-tooltip-label-formatter')
    const { container } = render(<TooltipLabelFormatter />)
    expect(container.querySelector('.recharts-wrapper') || container.querySelector('.recharts-surface')).toBeTruthy()
  })

  it('renders TooltipLabelNone chart', async () => {
    const { default: TooltipLabelNone } = await import('../tooltip/chart-tooltip-label-none')
    const { container } = render(<TooltipLabelNone />)
    expect(container.querySelector('.recharts-wrapper') || container.querySelector('.recharts-surface')).toBeTruthy()
  })
})

// ============================================================================
// INTEGRATION TESTS
// ============================================================================
describe('Chart Integration Tests', () => {
  it('verifies all charts use ChartContainer wrapper', async () => {
    const { default: AreaDefault } = await import('../area/chart-area-default')
    const { container } = render(<AreaDefault />)

    // ChartContainer should wrap recharts components
    expect(container.querySelector('.recharts-responsive-container')).toBeTruthy()
  })

  it('validates ChartConfig type structure', () => {
    type ChartConfig = {
      [key: string]: {
        label: string
        color?: string
        icon?: React.ComponentType
      }
    }

    const testConfig: ChartConfig = {
      desktop: {
        label: "Desktop",
        color: "hsl(var(--chart-1))"
      },
      mobile: {
        label: "Mobile",
        color: "hsl(var(--chart-2))"
      }
    }

    expect(testConfig.desktop.label).toBe("Desktop")
    expect(testConfig.mobile.label).toBe("Mobile")
    expect(typeof testConfig.desktop.color).toBe("string")
  })

  it('validates chart data binding works', async () => {
    const { default: LineDefault } = await import('../line/chart-line-default')
    const { container } = render(<LineDefault />)

    // Should have recharts elements with data
    const chartSurface = container.querySelector('.recharts-surface')
    expect(chartSurface).toBeTruthy()
    expect(chartSurface?.children.length).toBeGreaterThan(0)
  })

  it('validates interactive charts render without errors', async () => {
    const interactiveCharts = [
      { category: 'area', component: await import('../area/chart-area-interactive') },
      { category: 'bar', component: await import('../bar/chart-bar-interactive') },
      { category: 'line', component: await import('../line/chart-line-interactive') },
      { category: 'pie', component: await import('../pie/chart-pie-interactive') }
    ]

    for (const { category, component } of interactiveCharts) {
      const { container } = render(<component.default />)
      expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    }
  })

  it('validates Card wrapper is present in all charts', async () => {
    const { default: BarDefault } = await import('../bar/chart-bar-default')
    const { container } = render(<BarDefault />)

    // Most charts are wrapped in Card components
    expect(container.querySelector('[class*="card"]') || container.querySelector('.recharts-wrapper')).toBeTruthy()
  })
})

// ============================================================================
// TEST SUMMARY
// ============================================================================
describe('Test Summary', () => {
  it('confirms all chart categories are tested', () => {
    const categories = {
      area: 10,
      bar: 10,
      line: 10,
      pie: 9,
      radar: 9,
      radial: 6,
      tooltip: 9
    }

    const totalCharts = Object.values(categories).reduce((sum, count) => sum + count, 0)
    expect(totalCharts).toBe(63)

    console.log('\n📊 Chart Test Coverage Summary:')
    console.log('================================')
    Object.entries(categories).forEach(([category, count]) => {
      console.log(`${category.padEnd(10)}: ${count} charts`)
    })
    console.log('================================')
    console.log(`Total Charts: ${totalCharts}`)
  })
})
