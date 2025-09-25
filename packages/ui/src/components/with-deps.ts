/**
 * Component wrapper for optional dependencies
 * This ensures components that require heavy dependencies fail gracefully
 */

import React from 'react'

export function withOptionalDep<T extends object>(
  componentName: string,
  dependencies: string[],
  loader: () => Promise<{ default: React.ComponentType<T> }>
): React.LazyExoticComponent<React.ComponentType<T>> {
  return React.lazy(async () => {
    // Check if dependencies are available
    for (const dep of dependencies) {
      try {
        await import(dep)
      } catch (error) {
        console.error(`Missing dependency for ${componentName}: ${dep}`)
        return {
          default: (props: T) => {
            return React.createElement('div', {
              className: 'p-4 border border-red-500 bg-red-50 dark:bg-red-950 rounded',
              children: [
                React.createElement('p', {
                  className: 'font-semibold text-red-700 dark:text-red-300',
                  children: `Missing dependency for ${componentName}`
                }),
                React.createElement('p', {
                  className: 'text-sm text-red-600 dark:text-red-400 mt-2',
                  children: `Please install: ${dependencies.join(', ')}`
                }),
                React.createElement('pre', {
                  className: 'text-xs bg-black/10 dark:bg-white/10 p-2 mt-2 rounded',
                  children: `pnpm add ${dependencies.join(' ')}`
                })
              ]
            })
          }
        }
      }
    }
    
    // All dependencies available, load the component
    return loader()
  })
}

// Export helper for checking if a dependency is available
export async function isDependencyAvailable(dep: string): Promise<boolean> {
  try {
    await import(dep)
    return true
  } catch {
    return false
  }
}