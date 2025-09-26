#!/bin/bash

# Simple documentation build script for Hanzo UI
# Can be run locally or in CI/CD without complex dependencies

set -e

echo "🚀 Building Hanzo UI Documentation..."

# Create output directory
mkdir -p docs-output

# Generate main documentation page
cat > docs-output/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hanzo UI - Modern React Component Library</title>
    <meta name="description" content="A modern, performant UI framework for building AI-powered applications">

    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E🚀%3C/text%3E%3C/svg%3E">

    <style>
        :root {
            --primary: #667eea;
            --primary-dark: #764ba2;
            --bg-light: #f8f9fa;
            --text: #2d3748;
            --text-light: #718096;
            --border: #e2e8f0;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: var(--text);
            background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
            min-height: 100vh;
        }

        .hero {
            padding: 4rem 2rem;
            text-align: center;
            color: white;
        }

        .hero h1 {
            font-size: clamp(2rem, 5vw, 3.5rem);
            margin-bottom: 1rem;
            font-weight: 800;
            letter-spacing: -0.02em;
        }

        .hero p {
            font-size: 1.25rem;
            opacity: 0.95;
            max-width: 600px;
            margin: 0 auto 2rem;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 2rem;
        }

        .content {
            background: white;
            border-radius: 24px 24px 0 0;
            padding: 3rem 2rem;
            margin-top: -2rem;
            box-shadow: 0 -10px 40px rgba(0,0,0,0.1);
            min-height: 60vh;
        }

        .quick-links {
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: wrap;
            margin-bottom: 3rem;
        }

        .quick-links a {
            padding: 0.75rem 2rem;
            background: white;
            color: var(--primary-dark);
            text-decoration: none;
            border-radius: 50px;
            font-weight: 600;
            transition: all 0.3s ease;
            box-shadow: 0 4px 14px rgba(0,0,0,0.1);
        }

        .quick-links a:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0,0,0,0.15);
        }

        .section {
            margin-bottom: 3rem;
        }

        h2 {
            color: var(--primary-dark);
            margin-bottom: 1.5rem;
            font-size: 2rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .code-block {
            background: var(--bg-light);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 1.5rem;
            font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
            font-size: 0.9rem;
            overflow-x: auto;
            position: relative;
        }

        .code-block::before {
            content: 'BASH';
            position: absolute;
            top: 8px;
            right: 12px;
            font-size: 0.75rem;
            color: var(--text-light);
            font-weight: 600;
        }

        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 2rem;
            margin-top: 2rem;
        }

        .feature {
            padding: 1.5rem;
            background: var(--bg-light);
            border-radius: 12px;
            transition: transform 0.3s ease;
        }

        .feature:hover {
            transform: translateY(-4px);
        }

        .feature h3 {
            color: var(--primary);
            margin-bottom: 0.75rem;
            font-size: 1.25rem;
        }

        .feature p {
            color: var(--text-light);
            line-height: 1.8;
        }

        .badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            background: linear-gradient(135deg, var(--primary), var(--primary-dark));
            color: white;
            border-radius: 50px;
            font-size: 0.875rem;
            font-weight: 600;
            margin-right: 0.5rem;
        }

        footer {
            text-align: center;
            padding: 3rem 2rem;
            color: var(--text-light);
            border-top: 1px solid var(--border);
        }

        .tech-stack {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-top: 1rem;
        }

        .tech {
            padding: 0.5rem 1rem;
            background: white;
            border: 2px solid var(--border);
            border-radius: 8px;
            font-weight: 600;
            color: var(--text);
            transition: all 0.2s ease;
        }

        .tech:hover {
            border-color: var(--primary);
            color: var(--primary);
            transform: scale(1.05);
        }

        @media (max-width: 768px) {
            .content {
                padding: 2rem 1rem;
            }
            .features {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="hero">
        <div class="container">
            <h1>🚀 Hanzo UI</h1>
            <p>A modern, performant React component library built for AI-powered applications</p>

            <div class="quick-links">
                <a href="https://github.com/hanzoai/ui">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: -3px; margin-right: 6px;">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    GitHub
                </a>
                <a href="https://hanzo.ai">🌟 Hanzo AI</a>
                <a href="https://www.npmjs.com/package/@hanzo/ui">📦 NPM</a>
            </div>
        </div>
    </div>

    <div class="content">
        <div class="container">
            <div class="section">
                <h2>⚡ Quick Start</h2>
                <div class="code-block">
# Install with your preferred package manager
npm install @hanzo/ui
pnpm add @hanzo/ui
bun add @hanzo/ui

# Install peer dependencies if needed
npm install react react-dom</div>
            </div>

            <div class="section">
                <h2>✨ Key Features</h2>
                <div class="features">
                    <div class="feature">
                        <h3>🎨 Beautiful Components</h3>
                        <p>Meticulously designed React components built with Radix UI primitives and styled with Tailwind CSS for maximum flexibility.</p>
                    </div>
                    <div class="feature">
                        <h3>🤖 AI-First Design</h3>
                        <p>Components optimized for AI applications with built-in support for streaming responses, code highlighting, and markdown rendering.</p>
                    </div>
                    <div class="feature">
                        <h3>⚡ Blazing Fast</h3>
                        <p>Tree-shakable, lazy-loaded components with minimal bundle size. Performance is a first-class citizen.</p>
                    </div>
                    <div class="feature">
                        <h3>🌙 Dark Mode</h3>
                        <p>Beautiful dark mode support out of the box with smooth transitions and proper color contrast.</p>
                    </div>
                    <div class="feature">
                        <h3>♿ Accessible</h3>
                        <p>Built on Radix UI primitives ensuring WCAG compliance and excellent keyboard navigation support.</p>
                    </div>
                    <div class="feature">
                        <h3>📱 Responsive</h3>
                        <p>Mobile-first design approach with components that adapt beautifully to any screen size.</p>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>💻 Usage Example</h2>
                <div class="code-block" style="font-family: 'SF Mono', Monaco, monospace;">
import { Button, Card, Input, Badge } from '@hanzo/ui'

export function MyComponent() {
  return (
    &lt;Card className="p-6"&gt;
      &lt;h2&gt;Welcome to Hanzo UI&lt;/h2&gt;
      &lt;Badge variant="success"&gt;New&lt;/Badge&gt;
      &lt;Input
        placeholder="Enter your email..."
        type="email"
      /&gt;
      &lt;Button
        onClick={() => console.log('Clicked!')}
        variant="primary"
      &gt;
        Get Started
      &lt;/Button&gt;
    &lt;/Card&gt;
  )
}</div>
            </div>

            <div class="section">
                <h2>🛠️ Technology Stack</h2>
                <div class="tech-stack">
                    <div class="tech">React 18+</div>
                    <div class="tech">TypeScript</div>
                    <div class="tech">Radix UI</div>
                    <div class="tech">Tailwind CSS</div>
                    <div class="tech">Framer Motion</div>
                    <div class="tech">Vite</div>
                    <div class="tech">ESBuild</div>
                </div>
            </div>

            <div class="section">
                <h2>📚 Component Library</h2>
                <p style="color: var(--text-light); margin-bottom: 1rem;">
                    Our comprehensive component library includes everything you need to build modern web applications:
                </p>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 0.5rem;">
                    <span class="badge">Button</span>
                    <span class="badge">Card</span>
                    <span class="badge">Dialog</span>
                    <span class="badge">Dropdown</span>
                    <span class="badge">Input</span>
                    <span class="badge">Select</span>
                    <span class="badge">Checkbox</span>
                    <span class="badge">Radio</span>
                    <span class="badge">Switch</span>
                    <span class="badge">Tabs</span>
                    <span class="badge">Tooltip</span>
                    <span class="badge">Toast</span>
                    <span class="badge">Modal</span>
                    <span class="badge">Popover</span>
                    <span class="badge">Accordion</span>
                    <span class="badge">Avatar</span>
                    <span class="badge">Badge</span>
                    <span class="badge">Progress</span>
                    <span class="badge">Skeleton</span>
                    <span class="badge">Table</span>
                </div>
            </div>

            <footer>
                <p>
                    <strong>Hanzo UI</strong> • Built with ❤️ by <a href="https://hanzo.ai" style="color: var(--primary); text-decoration: none;">Hanzo AI</a>
                    <br>
                    © 2025 Hanzo AI. All rights reserved.
                </p>
            </footer>
        </div>
    </div>
</body>
</html>
EOF

# Create .nojekyll file for GitHub Pages
touch docs-output/.nojekyll

echo "✅ Documentation built successfully!"
echo "📁 Output directory: docs-output/"
echo "🌐 Open docs-output/index.html in your browser to preview"