/**
 * Visual Chart Component Test Page
 * Renders all chart components for visual verification
 */

'use client'

import React from 'react';

// Import all chart categories
import * as AreaCharts from '../primitives/charts/area';
import * as BarCharts from '../primitives/charts/bar';
import * as LineCharts from '../primitives/charts/line';
import * as PieCharts from '../primitives/charts/pie';
import * as RadarCharts from '../primitives/charts/radar';
import * as RadialCharts from '../primitives/charts/radial';
import * as TooltipCharts from '../primitives/charts/tooltip';

interface ChartCategory {
  name: string;
  charts: { [key: string]: React.ComponentType };
}

const chartCategories: ChartCategory[] = [
  { name: 'Area Charts', charts: AreaCharts },
  { name: 'Bar Charts', charts: BarCharts },
  { name: 'Line Charts', charts: LineCharts },
  { name: 'Pie Charts', charts: PieCharts },
  { name: 'Radar Charts', charts: RadarCharts },
  { name: 'Radial Charts', charts: RadialCharts },
  { name: 'Tooltip Charts', charts: TooltipCharts },
];

export default function ChartVisualTest() {
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [renderErrors, setRenderErrors] = React.useState<{ [key: string]: string }>({});

  const handleChartError = (categoryName: string, chartName: string, error: Error) => {
    setRenderErrors(prev => ({
      ...prev,
      [`${categoryName}-${chartName}`]: error.message
    }));
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Chart Component Visual Tests</h1>
          <p className="text-muted-foreground">
            Visual verification of all 63 migrated chart components
          </p>
        </header>

        {/* Category Navigation */}
        <nav className="mb-8 flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-md transition-colors ${
              selectedCategory === null
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            All Charts
          </button>
          {chartCategories.map(category => (
            <button
              key={category.name}
              onClick={() => setSelectedCategory(category.name)}
              className={`px-4 py-2 rounded-md transition-colors ${
                selectedCategory === category.name
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {category.name} ({Object.keys(category.charts).length})
            </button>
          ))}
        </nav>

        {/* Error Summary */}
        {Object.keys(renderErrors).length > 0 && (
          <div className="mb-8 p-4 bg-destructive/10 border border-destructive rounded-md">
            <h3 className="font-semibold text-destructive mb-2">
              ⚠️ Render Errors ({Object.keys(renderErrors).length})
            </h3>
            <ul className="list-disc list-inside text-sm text-destructive/80">
              {Object.entries(renderErrors).map(([key, error]) => (
                <li key={key}>
                  {key}: {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Chart Grid */}
        <div className="space-y-12">
          {chartCategories
            .filter(category =>
              selectedCategory === null || category.name === selectedCategory
            )
            .map(category => (
              <section key={category.name} className="space-y-4">
                <h2 className="text-2xl font-semibold border-b pb-2">
                  {category.name}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(category.charts).map(([name, ChartComponent]) => (
                    <div key={name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-muted-foreground">
                          {name}
                        </h3>
                        {renderErrors[`${category.name}-${name}`] ? (
                          <span className="text-xs text-destructive">❌ Error</span>
                        ) : (
                          <span className="text-xs text-green-600">✓ OK</span>
                        )}
                      </div>

                      <div className="border rounded-lg p-4 bg-card">
                        <ErrorBoundary
                          fallback={
                            <div className="p-4 text-center text-destructive text-sm">
                              Failed to render {name}
                            </div>
                          }
                          onError={(error) =>
                            handleChartError(category.name, name, error)
                          }
                        >
                          <ChartComponent />
                        </ErrorBoundary>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
        </div>

        {/* Footer Stats */}
        <footer className="mt-12 pt-8 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-primary">
                {chartCategories.reduce((acc, cat) => acc + Object.keys(cat.charts).length, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Charts</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">
                {chartCategories.reduce((acc, cat) => acc + Object.keys(cat.charts).length, 0) - Object.keys(renderErrors).length}
              </div>
              <div className="text-sm text-muted-foreground">Rendering OK</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-destructive">
                {Object.keys(renderErrors).length}
              </div>
              <div className="text-sm text-muted-foreground">Errors</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">
                {chartCategories.length}
              </div>
              <div className="text-sm text-muted-foreground">Categories</div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

/**
 * Error Boundary Component
 */
class ErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    fallback: React.ReactNode;
    onError?: (error: Error) => void;
  },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chart render error:', error, errorInfo);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}
