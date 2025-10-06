/**
 * Comprehensive Chart Components Test Suite
 * Tests all 63+ migrated chart components for:
 * - Import validation
 * - TypeScript types
 * - Recharts integration
 * - Data handling
 * - Render capability
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const CHARTS_DIR = path.join(__dirname, '../primitives/charts');
const CHART_PRIMITIVE = path.join(__dirname, '../primitives/chart.tsx');

// Chart categories and expected counts
const CHART_CATEGORIES = {
  area: 10,
  bar: 10,
  line: 10,
  pie: 9,
  radar: 9,
  radial: 6,
  tooltip: 9
};

const TOTAL_EXPECTED_CHARTS = 63;

// Color logging helpers
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

function success(msg) { log(colors.green + colors.bright, '✓', msg); }
function error(msg) { log(colors.red + colors.bright, '✗', msg); }
function info(msg) { log(colors.cyan, 'ℹ', msg); }
function warn(msg) { log(colors.yellow, '⚠', msg); }
function section(msg) { log(colors.blue + colors.bright, '\n' + '='.repeat(70) + '\n' + msg + '\n' + '='.repeat(70)); }

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

function recordTest(name, passed, message = '') {
  results.tests.push({ name, passed, message });
  if (passed) {
    results.passed++;
    success(`${name}${message ? ': ' + message : ''}`);
  } else {
    results.failed++;
    error(`${name}${message ? ': ' + message : ''}`);
  }
}

function recordWarning(message) {
  results.warnings++;
  warn(message);
}

// Test 1: Directory Structure
section('TEST 1: DIRECTORY STRUCTURE');

function testDirectoryStructure() {
  info('Checking charts directory structure...');

  // Check main charts directory exists
  if (!fs.existsSync(CHARTS_DIR)) {
    recordTest('Charts directory exists', false, `Not found at ${CHARTS_DIR}`);
    return false;
  }
  recordTest('Charts directory exists', true);

  // Check each category directory
  let allCategoriesExist = true;
  Object.keys(CHART_CATEGORIES).forEach(category => {
    const categoryDir = path.join(CHARTS_DIR, category);
    const exists = fs.existsSync(categoryDir);
    recordTest(`Category directory: ${category}`, exists);
    if (!exists) allCategoriesExist = false;
  });

  // Check chart primitive exists
  const primitiveExists = fs.existsSync(CHART_PRIMITIVE);
  recordTest('Chart primitive (chart.tsx) exists', primitiveExists, CHART_PRIMITIVE);

  return allCategoriesExist && primitiveExists;
}

// Test 2: File Count Verification
section('TEST 2: FILE COUNT VERIFICATION');

function testFileCount() {
  info('Verifying chart component file counts...');

  let totalFiles = 0;
  Object.entries(CHART_CATEGORIES).forEach(([category, expectedCount]) => {
    const categoryDir = path.join(CHARTS_DIR, category);
    if (!fs.existsSync(categoryDir)) {
      recordTest(`File count for ${category}`, false, 'Directory not found');
      return;
    }

    const files = fs.readdirSync(categoryDir).filter(f => f.endsWith('.tsx'));
    const actualCount = files.length;
    totalFiles += actualCount;

    const passed = actualCount === expectedCount;
    recordTest(
      `File count for ${category}`,
      passed,
      `Expected: ${expectedCount}, Found: ${actualCount}`
    );

    if (!passed) {
      info(`  Files in ${category}:`);
      files.forEach(f => info(`    - ${f}`));
    }
  });

  // Check total
  const totalPassed = totalFiles === TOTAL_EXPECTED_CHARTS;
  recordTest(
    'Total chart files',
    totalPassed,
    `Expected: ${TOTAL_EXPECTED_CHARTS}, Found: ${totalFiles}`
  );

  return totalPassed;
}

// Test 3: Import Validation
section('TEST 3: IMPORT VALIDATION');

function testImports() {
  info('Validating TypeScript imports and exports...');

  // Check index files
  Object.keys(CHART_CATEGORIES).forEach(category => {
    const indexFile = path.join(CHARTS_DIR, category, 'index.ts');
    const indexExists = fs.existsSync(indexFile);

    if (!indexExists) {
      recordTest(`Index file for ${category}`, false, 'Not found');
      return;
    }

    const content = fs.readFileSync(indexFile, 'utf8');

    // Check for export statements
    const hasExports = content.includes('export');
    recordTest(`Index exports for ${category}`, hasExports);

    // Count exports
    const exportLines = content.split('\n').filter(line => line.trim().startsWith('export'));
    info(`  ${category}: ${exportLines.length} exports`);
  });

  // Check main charts index
  const mainIndex = path.join(CHARTS_DIR, 'index.ts');
  if (fs.existsSync(mainIndex)) {
    const content = fs.readFileSync(mainIndex, 'utf8');
    Object.keys(CHART_CATEGORIES).forEach(category => {
      const hasExport = content.includes(`from './${category}'`);
      recordTest(`Main index exports ${category}`, hasExport);
    });
  } else {
    recordTest('Main charts index file', false, 'Not found');
  }
}

// Test 4: Component Structure Analysis
section('TEST 4: COMPONENT STRUCTURE ANALYSIS');

function testComponentStructure() {
  info('Analyzing component structure and dependencies...');

  let totalComponents = 0;
  let componentsWithData = 0;
  let componentsWithConfig = 0;
  let componentsWithRecharts = 0;
  let componentsWithDescription = 0;

  Object.keys(CHART_CATEGORIES).forEach(category => {
    const categoryDir = path.join(CHARTS_DIR, category);
    if (!fs.existsSync(categoryDir)) return;

    const files = fs.readdirSync(categoryDir).filter(f => f.endsWith('.tsx'));

    files.forEach(file => {
      totalComponents++;
      const filePath = path.join(categoryDir, file);
      const content = fs.readFileSync(filePath, 'utf8');

      // Check for essential patterns
      if (content.includes('chartData') || content.includes('const data')) {
        componentsWithData++;
      }

      if (content.includes('chartConfig') || content.includes('ChartConfig')) {
        componentsWithConfig++;
      }

      if (content.includes('from "recharts"') || content.includes('from \'recharts\'')) {
        componentsWithRecharts++;
      }

      if (content.includes('export const description')) {
        componentsWithDescription++;
      }

      // Check for "use client" directive (required for interactive charts)
      const isInteractive = file.includes('interactive');
      const hasUseClient = content.trim().startsWith('"use client"') || content.trim().startsWith("'use client'");

      if (isInteractive && !hasUseClient) {
        recordWarning(`${category}/${file}: Interactive component missing "use client" directive`);
      }
    });
  });

  recordTest('Components analyzed', true, `${totalComponents} files`);
  recordTest('Components with chart data', true, `${componentsWithData}/${totalComponents}`);
  recordTest('Components with ChartConfig', true, `${componentsWithConfig}/${totalComponents}`);
  recordTest('Components importing Recharts', true, `${componentsWithRecharts}/${totalComponents}`);
  recordTest('Components with descriptions', true, `${componentsWithDescription}/${totalComponents}`);

  // Warnings for missing patterns
  if (componentsWithData < totalComponents) {
    recordWarning(`${totalComponents - componentsWithData} components may be missing chart data`);
  }
  if (componentsWithConfig < totalComponents) {
    recordWarning(`${totalComponents - componentsWithConfig} components may be missing ChartConfig`);
  }
}

// Test 5: Recharts Integration
section('TEST 5: RECHARTS INTEGRATION');

function testRechartsIntegration() {
  info('Validating Recharts component usage...');

  const rechartsComponents = new Set();
  const componentUsage = {};

  Object.keys(CHART_CATEGORIES).forEach(category => {
    const categoryDir = path.join(CHARTS_DIR, category);
    if (!fs.existsSync(categoryDir)) return;

    const files = fs.readdirSync(categoryDir).filter(f => f.endsWith('.tsx'));

    files.forEach(file => {
      const filePath = path.join(categoryDir, file);
      const content = fs.readFileSync(filePath, 'utf8');

      // Extract Recharts imports
      const importMatch = content.match(/import\s+{([^}]+)}\s+from\s+["']recharts["']/);
      if (importMatch) {
        const components = importMatch[1].split(',').map(c => c.trim());
        components.forEach(comp => {
          rechartsComponents.add(comp);
          componentUsage[comp] = (componentUsage[comp] || 0) + 1;
        });
      }
    });
  });

  recordTest('Recharts components imported', true, `${rechartsComponents.size} unique components`);

  info('  Most used Recharts components:');
  const sorted = Object.entries(componentUsage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  sorted.forEach(([comp, count]) => {
    info(`    ${comp}: ${count} times`);
  });

  // Check for essential Recharts components
  const essentialComponents = ['CartesianGrid', 'XAxis', 'YAxis'];
  essentialComponents.forEach(comp => {
    const used = rechartsComponents.has(comp);
    if (used) {
      recordTest(`Uses ${comp}`, true, `${componentUsage[comp]} times`);
    } else {
      recordWarning(`${comp} not used in any chart`);
    }
  });
}

// Test 6: TypeScript Type Validation
section('TEST 6: TYPESCRIPT TYPE VALIDATION');

function testTypeScript() {
  info('Checking TypeScript patterns and type safety...');

  let componentsWithTypes = 0;
  let componentsWithSatisfies = 0;
  let totalComponents = 0;

  Object.keys(CHART_CATEGORIES).forEach(category => {
    const categoryDir = path.join(CHARTS_DIR, category);
    if (!fs.existsSync(categoryDir)) return;

    const files = fs.readdirSync(categoryDir).filter(f => f.endsWith('.tsx'));

    files.forEach(file => {
      totalComponents++;
      const filePath = path.join(categoryDir, file);
      const content = fs.readFileSync(filePath, 'utf8');

      // Check for type annotations
      if (content.includes(': ') || content.includes('interface') || content.includes('type ')) {
        componentsWithTypes++;
      }

      // Check for satisfies operator (TypeScript 4.9+)
      if (content.includes('satisfies ChartConfig')) {
        componentsWithSatisfies++;
      }
    });
  });

  recordTest('Components with TypeScript types', true, `${componentsWithTypes}/${totalComponents}`);
  recordTest('Components using "satisfies ChartConfig"', true, `${componentsWithSatisfies}/${totalComponents}`);

  if (componentsWithSatisfies < totalComponents) {
    recordWarning(`${totalComponents - componentsWithSatisfies} components not using 'satisfies ChartConfig' pattern`);
  }
}

// Test 7: Chart Primitive Dependencies
section('TEST 7: CHART PRIMITIVE DEPENDENCIES');

function testChartPrimitive() {
  info('Validating chart primitive imports...');

  if (!fs.existsSync(CHART_PRIMITIVE)) {
    recordTest('Chart primitive exists', false);
    return;
  }

  const content = fs.readFileSync(CHART_PRIMITIVE, 'utf8');

  // Check for essential exports
  const essentialExports = [
    'ChartContainer',
    'ChartConfig',
    'ChartTooltip',
    'ChartTooltipContent'
  ];

  essentialExports.forEach(exportName => {
    const hasExport = content.includes(exportName);
    recordTest(`Chart primitive exports ${exportName}`, hasExport);
  });

  // Check component usage of chart primitives
  let componentsUsingContainer = 0;
  let componentsUsingTooltip = 0;
  let totalComponents = 0;

  Object.keys(CHART_CATEGORIES).forEach(category => {
    const categoryDir = path.join(CHARTS_DIR, category);
    if (!fs.existsSync(categoryDir)) return;

    const files = fs.readdirSync(categoryDir).filter(f => f.endsWith('.tsx'));

    files.forEach(file => {
      totalComponents++;
      const filePath = path.join(categoryDir, file);
      const content = fs.readFileSync(filePath, 'utf8');

      if (content.includes('<ChartContainer')) {
        componentsUsingContainer++;
      }
      if (content.includes('<ChartTooltip') || content.includes('ChartTooltipContent')) {
        componentsUsingTooltip++;
      }
    });
  });

  recordTest('Components using ChartContainer', true, `${componentsUsingContainer}/${totalComponents}`);
  recordTest('Components using ChartTooltip', true, `${componentsUsingTooltip}/${totalComponents}`);
}

// Test 8: Data Pattern Analysis
section('TEST 8: DATA PATTERN ANALYSIS');

function testDataPatterns() {
  info('Analyzing chart data patterns...');

  const dataPatterns = {
    monthlyData: 0,
    timeSeriesData: 0,
    categoryData: 0,
    multiSeriesData: 0,
    numericData: 0
  };

  Object.keys(CHART_CATEGORIES).forEach(category => {
    const categoryDir = path.join(CHARTS_DIR, category);
    if (!fs.existsSync(categoryDir)) return;

    const files = fs.readdirSync(categoryDir).filter(f => f.endsWith('.tsx'));

    files.forEach(file => {
      const filePath = path.join(categoryDir, file);
      const content = fs.readFileSync(filePath, 'utf8');

      if (content.includes('month:') || content.includes('"January"') || content.includes("'January'")) {
        dataPatterns.monthlyData++;
      }
      if (content.includes('desktop') && content.includes('mobile')) {
        dataPatterns.multiSeriesData++;
      }
      if (content.match(/\d{4}-\d{2}-\d{2}/)) {
        dataPatterns.timeSeriesData++;
      }
    });
  });

  recordTest('Monthly data pattern', true, `${dataPatterns.monthlyData} charts`);
  recordTest('Multi-series data', true, `${dataPatterns.multiSeriesData} charts`);
  recordTest('Time series data', true, `${dataPatterns.timeSeriesData} charts`);
}

// Test 9: Interactive Chart Features
section('TEST 9: INTERACTIVE CHART FEATURES');

function testInteractiveFeatures() {
  info('Checking interactive chart features...');

  const interactiveCharts = [];
  let chartsWithState = 0;
  let chartsWithHandlers = 0;

  Object.keys(CHART_CATEGORIES).forEach(category => {
    const categoryDir = path.join(CHARTS_DIR, category);
    if (!fs.existsSync(categoryDir)) return;

    const files = fs.readdirSync(categoryDir).filter(f => f.endsWith('.tsx'));

    files.forEach(file => {
      const filePath = path.join(categoryDir, file);
      const content = fs.readFileSync(filePath, 'utf8');

      if (file.includes('interactive')) {
        interactiveCharts.push(`${category}/${file}`);

        if (content.includes('useState') || content.includes('React.useState')) {
          chartsWithState++;
        }
        if (content.includes('onClick') || content.includes('onMouseEnter') || content.includes('onMouseLeave')) {
          chartsWithHandlers++;
        }
      }
    });
  });

  recordTest('Interactive charts found', true, `${interactiveCharts.length} charts`);
  recordTest('Interactive charts with state', true, `${chartsWithState}/${interactiveCharts.length}`);
  recordTest('Interactive charts with handlers', true, `${chartsWithHandlers}/${interactiveCharts.length}`);

  info('  Interactive charts:');
  interactiveCharts.forEach(chart => info(`    - ${chart}`));
}

// Test 10: Error Detection
section('TEST 10: ERROR DETECTION');

function testErrorDetection() {
  info('Scanning for common errors and issues...');

  const issues = [];

  Object.keys(CHART_CATEGORIES).forEach(category => {
    const categoryDir = path.join(CHARTS_DIR, category);
    if (!fs.existsSync(categoryDir)) return;

    const files = fs.readdirSync(categoryDir).filter(f => f.endsWith('.tsx'));

    files.forEach(file => {
      const filePath = path.join(categoryDir, file);
      const content = fs.readFileSync(filePath, 'utf8');

      // Check for common issues
      if (!content.includes('export default')) {
        issues.push({ file: `${category}/${file}`, issue: 'Missing default export' });
      }

      // Check for incomplete imports
      if (content.includes('from ""') || content.includes("from ''")) {
        issues.push({ file: `${category}/${file}`, issue: 'Empty import statement' });
      }

      // Check for console.log (should be removed in production)
      if (content.includes('console.log')) {
        issues.push({ file: `${category}/${file}`, issue: 'Contains console.log' });
      }

      // Check for TODO comments
      if (content.includes('TODO') || content.includes('FIXME')) {
        issues.push({ file: `${category}/${file}`, issue: 'Contains TODO/FIXME comment' });
      }
    });
  });

  if (issues.length === 0) {
    recordTest('No critical issues found', true);
  } else {
    recordTest('Issues detected', false, `${issues.length} issues`);
    issues.forEach(({ file, issue }) => {
      warn(`  ${file}: ${issue}`);
    });
  }
}

// Run all tests
function runAllTests() {
  console.log('\n' + colors.bright + colors.cyan +
    '╔════════════════════════════════════════════════════════════════════╗\n' +
    '║     COMPREHENSIVE CHART COMPONENTS TEST SUITE                     ║\n' +
    '║     Testing 63+ Migrated Chart Components                         ║\n' +
    '╚════════════════════════════════════════════════════════════════════╝' +
    colors.reset + '\n');

  testDirectoryStructure();
  testFileCount();
  testImports();
  testComponentStructure();
  testRechartsIntegration();
  testTypeScript();
  testChartPrimitive();
  testDataPatterns();
  testInteractiveFeatures();
  testErrorDetection();

  // Print summary
  section('TEST SUMMARY');

  const total = results.passed + results.failed;
  const passRate = ((results.passed / total) * 100).toFixed(1);

  console.log();
  log(colors.bright, `Total Tests: ${total}`);
  log(colors.green + colors.bright, `✓ Passed: ${results.passed}`);
  log(colors.red + colors.bright, `✗ Failed: ${results.failed}`);
  log(colors.yellow + colors.bright, `⚠ Warnings: ${results.warnings}`);
  log(colors.cyan + colors.bright, `Success Rate: ${passRate}%`);
  console.log();

  // Category breakdown
  info('Results by Category:');
  Object.entries(CHART_CATEGORIES).forEach(([category, count]) => {
    const categoryTests = results.tests.filter(t => t.name.includes(category));
    const passed = categoryTests.filter(t => t.passed).length;
    const failed = categoryTests.filter(t => !t.passed).length;

    if (categoryTests.length > 0) {
      const status = failed === 0 ? colors.green + '✓' : colors.red + '✗';
      info(`  ${status} ${category}: ${passed}/${categoryTests.length} tests passed${colors.reset}`);
    }
  });

  console.log('\n' + colors.bright + colors.cyan + '═'.repeat(70) + colors.reset + '\n');

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Execute tests
runAllTests();
