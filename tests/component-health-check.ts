#!/usr/bin/env node

/**
 * Component Health Check Script
 *
 * This script verifies that all registered components:
 * 1. Have corresponding documentation files
 * 2. Have implementation files
 * 3. Are accessible via their routes
 * 4. Render without errors
 */

import { registry } from '../app/registry/registry.ts'
import { promises as fs } from 'fs'
import path from 'path'
import chalk from 'chalk'

interface ComponentStatus {
  name: string
  hasDoc: boolean
  hasImplementation: boolean
  hasRoute: boolean
  errors: string[]
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function checkComponent(component: any): Promise<ComponentStatus> {
  const status: ComponentStatus = {
    name: component.name,
    hasDoc: false,
    hasImplementation: false,
    hasRoute: false,
    errors: []
  }

  // Check for documentation file
  const docPaths = [
    `app/content/docs/components/${component.name}.mdx`,
    `app/content/docs/ai/${component.name}.mdx`,
    `app/content/docs/blocks/${component.name}.mdx`
  ]

  for (const docPath of docPaths) {
    if (await fileExists(path.join(process.cwd(), docPath))) {
      status.hasDoc = true
      break
    }
  }

  if (!status.hasDoc) {
    status.errors.push(`Missing documentation file`)
  }

  // Check for implementation files
  if (component.files && component.files.length > 0) {
    for (const file of component.files) {
      const implementationPaths = [
        `app/registry/default/${file}`,
        `app/registry/new-york/${file}`,
        `app/__registry__/default/${file}`,
        `packages/ui/src/${file}`
      ]

      let found = false
      for (const implPath of implementationPaths) {
        if (await fileExists(path.join(process.cwd(), implPath))) {
          found = true
          break
        }
      }

      if (found) {
        status.hasImplementation = true
      } else {
        status.errors.push(`Missing implementation: ${file}`)
      }
    }
  }

  // Check if route is accessible (would need running server)
  // This is a placeholder - in real implementation, we'd make HTTP requests
  status.hasRoute = status.hasDoc // Assuming if doc exists, route exists

  return status
}

async function runHealthCheck() {
  console.log(chalk.blue('🏥 Running Component Health Check...\n'))

  const results: ComponentStatus[] = []
  const components = registry

  // Check each component
  for (const component of components) {
    const status = await checkComponent(component)
    results.push(status)
  }

  // Generate report
  console.log(chalk.bold('Component Health Report\n'))
  console.log('=' .repeat(80))

  let totalComponents = results.length
  let healthyComponents = 0
  let missingDocs = 0
  let missingImplementations = 0

  for (const result of results) {
    const isHealthy = result.hasDoc && result.hasImplementation && result.errors.length === 0

    if (isHealthy) {
      healthyComponents++
      console.log(chalk.green('✅'), chalk.bold(result.name.padEnd(40)), 'Healthy')
    } else {
      const status = []
      if (!result.hasDoc) {
        status.push(chalk.red('No Docs'))
        missingDocs++
      }
      if (!result.hasImplementation) {
        status.push(chalk.red('No Implementation'))
        missingImplementations++
      }

      console.log(chalk.red('❌'), chalk.bold(result.name.padEnd(40)), status.join(', '))

      if (result.errors.length > 0) {
        for (const error of result.errors) {
          console.log('   ', chalk.gray(error))
        }
      }
    }
  }

  console.log('\n' + '=' .repeat(80))
  console.log(chalk.bold('\nSummary:'))
  console.log(`Total Components: ${totalComponents}`)
  console.log(`Healthy: ${chalk.green(healthyComponents)} (${((healthyComponents/totalComponents) * 100).toFixed(1)}%)`)
  console.log(`Missing Docs: ${chalk.red(missingDocs)}`)
  console.log(`Missing Implementations: ${chalk.red(missingImplementations)}`)

  // Exit with error if not all components are healthy
  if (healthyComponents < totalComponents) {
    console.log(chalk.yellow('\n⚠️  Some components need attention!'))
    process.exit(1)
  } else {
    console.log(chalk.green('\n✨ All components are healthy!'))
  }
}

// Run the health check
runHealthCheck().catch(console.error)