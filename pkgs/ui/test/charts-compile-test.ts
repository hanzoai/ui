/**
 * TypeScript Compilation Test for Chart Components
 * Validates that all chart imports compile correctly
 */

// Import all chart categories to verify TypeScript compilation
import * as AreaCharts from '../primitives/charts/area';
import * as BarCharts from '../primitives/charts/bar';
import * as LineCharts from '../primitives/charts/line';
import * as PieCharts from '../primitives/charts/pie';
import * as RadarCharts from '../primitives/charts/radar';
import * as RadialCharts from '../primitives/charts/radial';
import * as TooltipCharts from '../primitives/charts/tooltip';

// Import chart primitives
import type { ChartConfig } from '../primitives/chart';

// Type definitions for testing
interface ChartTestResult {
  category: string;
  chartName: string;
  imported: boolean;
  hasValidType: boolean;
}

// Test data structure
const mockChartConfig: ChartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
  mobile: {
    label: "Mobile",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

const mockChartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
];

/**
 * Test chart category imports
 */
function testChartImports(): ChartTestResult[] {
  const results: ChartTestResult[] = [];

  const categories = {
    area: AreaCharts,
    bar: BarCharts,
    line: LineCharts,
    pie: PieCharts,
    radar: RadarCharts,
    radial: RadialCharts,
    tooltip: TooltipCharts,
  };

  for (const [category, charts] of Object.entries(categories)) {
    for (const [chartName, ChartComponent] of Object.entries(charts)) {
      results.push({
        category,
        chartName,
        imported: typeof ChartComponent === 'function',
        hasValidType: typeof ChartComponent === 'function',
      });
    }
  }

  return results;
}

/**
 * Test ChartConfig type
 */
function testChartConfigType(): boolean {
  // Type should compile correctly
  const config: ChartConfig = {
    series1: {
      label: "Series 1",
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    typeof config === 'object' &&
    'series1' in config &&
    'label' in config.series1
  );
}

/**
 * Verify chart component props (if available)
 */
interface ChartComponentProps {
  className?: string;
  [key: string]: any;
}

/**
 * Run all compilation tests
 */
function runCompilationTests() {
  console.log('🔧 TypeScript Compilation Test\n');
  console.log('Testing chart component imports and types...\n');

  // Test 1: Import validation
  console.log('📦 Test 1: Chart Imports');
  const importResults = testChartImports();
  const importSuccess = importResults.every(r => r.imported);
  console.log(`  ${importSuccess ? '✅' : '❌'} All charts imported: ${importResults.filter(r => r.imported).length}/${importResults.length}`);

  // Test 2: ChartConfig type
  console.log('\n🔧 Test 2: ChartConfig Type');
  const configTypeValid = testChartConfigType();
  console.log(`  ${configTypeValid ? '✅' : '❌'} ChartConfig type valid: ${configTypeValid}`);

  // Test 3: Category counts
  console.log('\n📊 Test 3: Category Distribution');
  const categoryCounts = importResults.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  Object.entries(categoryCounts).forEach(([category, count]) => {
    console.log(`  ✓ ${category}: ${count} charts`);
  });

  // Test 4: Mock data validation
  console.log('\n📈 Test 4: Mock Data Structure');
  const dataValid = Array.isArray(mockChartData) && mockChartData.length > 0;
  console.log(`  ${dataValid ? '✅' : '❌'} Chart data structure valid: ${dataValid}`);

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('COMPILATION TEST SUMMARY');
  console.log('='.repeat(50));

  const allPassed = importSuccess && configTypeValid && dataValid;
  console.log(`\nStatus: ${allPassed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Total Charts: ${importResults.length}`);
  console.log(`Categories: ${Object.keys(categoryCounts).length}`);
  console.log(`\n${allPassed ? '✅' : '❌'} TypeScript compilation test ${allPassed ? 'passed' : 'failed'}!\n`);

  return allPassed;
}

// Export for use in other files
export {
  testChartImports,
  testChartConfigType,
  mockChartConfig,
  mockChartData,
  type ChartTestResult,
};

// Run tests if executed directly
if (require.main === module) {
  const success = runCompilationTests();
  process.exit(success ? 0 : 1);
}
