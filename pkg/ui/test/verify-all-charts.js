#!/usr/bin/env node

/**
 * Chart Verification Script
 * Quick verification of all chart components
 */

const fs = require('fs');
const path = require('path');

const CHARTS_DIR = path.join(__dirname, '../primitives/charts');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, ...args) {
  console.log(color + args.join(' ') + colors.reset);
}

console.log('\n' + colors.bright + colors.cyan + '╔════════════════════════════════════════════════════════════════════╗');
console.log('║           CHART COMPONENTS VERIFICATION REPORT                    ║');
console.log('╚════════════════════════════════════════════════════════════════════╝' + colors.reset + '\n');

// Get all chart files
const categories = fs.readdirSync(CHARTS_DIR).filter(dir => {
  const stat = fs.statSync(path.join(CHARTS_DIR, dir));
  return stat.isDirectory();
});

const allCharts = [];
categories.forEach(category => {
  const categoryDir = path.join(CHARTS_DIR, category);
  const files = fs.readdirSync(categoryDir)
    .filter(f => f.endsWith('.tsx'))
    .map(f => ({
      category,
      file: f,
      name: f.replace('.tsx', '').replace('chart-' + category + '-', ''),
      path: path.join(categoryDir, f)
    }));
  allCharts.push(...files);
});

console.log(colors.blue + '📊 Total Charts Found: ' + colors.bright + allCharts.length + colors.reset);
console.log(colors.blue + '📁 Categories: ' + colors.bright + categories.join(', ') + colors.reset + '\n');

// Verify each chart
const results = {
  total: allCharts.length,
  validStructure: 0,
  hasDefaultExport: 0,
  hasDescription: 0,
  hasChartData: 0,
  hasChartConfig: 0,
  usesRecharts: 0,
  usesChartPrimitives: 0,
  isInteractive: 0,
  issues: []
};

allCharts.forEach(chart => {
  const content = fs.readFileSync(chart.path, 'utf8');

  // Check structure
  if (content.includes('export default')) {
    results.hasDefaultExport++;
  } else {
    results.issues.push(`${chart.category}/${chart.file}: Missing default export`);
  }

  if (content.includes('export const description')) {
    results.hasDescription++;
  }

  if (content.includes('chartData') || content.match(/const \w*[Dd]ata\s*=/)) {
    results.hasChartData++;
  }

  if (content.includes('chartConfig') || content.includes('satisfies ChartConfig')) {
    results.hasChartConfig++;
  }

  if (content.includes('from "recharts"') || content.includes("from 'recharts'")) {
    results.usesRecharts++;
  }

  if (content.includes('ChartContainer') || content.includes('ChartTooltip')) {
    results.usesChartPrimitives++;
  }

  if (content.includes('useState') || content.includes('React.useState')) {
    results.isInteractive++;
  }

  if (
    content.includes('export default') &&
    content.includes('chartConfig') &&
    content.includes('from "recharts"')
  ) {
    results.validStructure++;
  }
});

// Print results by category
console.log(colors.bright + '\n📂 Charts by Category:\n' + colors.reset);

categories.forEach(category => {
  const categoryCharts = allCharts.filter(c => c.category === category);
  const categoryPath = path.join(CHARTS_DIR, category);

  // Check for index file
  const hasIndex = fs.existsSync(path.join(categoryPath, 'index.ts'));

  log(
    colors.cyan,
    `  ${category.toUpperCase().padEnd(10)} ${categoryCharts.length} charts ${hasIndex ? '✓ index.ts' : '✗ no index'}`
  );

  categoryCharts.forEach(chart => {
    const content = fs.readFileSync(chart.path, 'utf8');
    const hasExport = content.includes('export default');
    const hasConfig = content.includes('satisfies ChartConfig');
    const status = hasExport && hasConfig ? colors.green + '✓' : colors.red + '✗';
    console.log(`    ${status} ${chart.name}${colors.reset}`);
  });
  console.log();
});

// Print statistics
console.log(colors.bright + '\n📈 Component Statistics:\n' + colors.reset);

const stats = [
  { label: 'Valid Structure', value: results.validStructure, total: results.total },
  { label: 'Default Export', value: results.hasDefaultExport, total: results.total },
  { label: 'Description', value: results.hasDescription, total: results.total },
  { label: 'Chart Data', value: results.hasChartData, total: results.total },
  { label: 'Chart Config', value: results.hasChartConfig, total: results.total },
  { label: 'Uses Recharts', value: results.usesRecharts, total: results.total },
  { label: 'Uses Chart Primitives', value: results.usesChartPrimitives, total: results.total },
  { label: 'Interactive (with state)', value: results.isInteractive, total: results.total }
];

stats.forEach(stat => {
  const percentage = ((stat.value / stat.total) * 100).toFixed(1);
  const color = percentage >= 90 ? colors.green : percentage >= 70 ? colors.yellow : colors.red;
  log(
    colors.cyan,
    `  ${stat.label.padEnd(25)} ${color}${stat.value}/${stat.total} (${percentage}%)${colors.reset}`
  );
});

// Print issues
if (results.issues.length > 0) {
  console.log(colors.yellow + '\n⚠️  Issues Found:\n' + colors.reset);
  results.issues.forEach(issue => {
    console.log(colors.yellow + '  - ' + issue + colors.reset);
  });
} else {
  console.log(colors.green + '\n✅ No Issues Found!' + colors.reset);
}

// Summary
const successRate = ((results.validStructure / results.total) * 100).toFixed(1);
console.log('\n' + colors.bright + '═'.repeat(70) + colors.reset);
console.log(colors.bright + '  SUMMARY' + colors.reset);
console.log(colors.bright + '═'.repeat(70) + colors.reset);

console.log(`
  Total Charts:        ${colors.bright}${results.total}${colors.reset}
  Valid Structure:     ${colors.green}${results.validStructure}${colors.reset}
  Success Rate:        ${colors.green}${successRate}%${colors.reset}
  Issues:              ${results.issues.length > 0 ? colors.yellow : colors.green}${results.issues.length}${colors.reset}
`);

// Chart type distribution
console.log(colors.bright + '\n📊 Chart Type Distribution:\n' + colors.reset);

const typeDistribution = {};
allCharts.forEach(chart => {
  // Extract chart type from filename
  const type = chart.file.split('-')[2] || 'other'; // e.g., chart-area-default -> default
  typeDistribution[type] = (typeDistribution[type] || 0) + 1;
});

Object.entries(typeDistribution)
  .sort((a, b) => b[1] - a[1])
  .forEach(([type, count]) => {
    const bar = '█'.repeat(Math.ceil(count / 2));
    log(colors.cyan, `  ${type.padEnd(15)} ${bar} ${count}`);
  });

console.log('\n' + colors.bright + colors.cyan + '═'.repeat(70) + colors.reset);
console.log(colors.green + colors.bright + '\n✅ Verification Complete!\n' + colors.reset);

// Exit with appropriate code
process.exit(results.issues.length > 0 ? 1 : 0);
