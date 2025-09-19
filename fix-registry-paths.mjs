#!/usr/bin/env node
import fs from 'fs/promises'
import path from 'path'

async function fixRegistryPaths() {
  console.log('🔧 Fixing registry import paths...')

  const registryFile = './app/__registry__/index.tsx'

  try {
    let content = await fs.readFile(registryFile, 'utf-8')

    // Fix AI component paths
    content = content.replace(/@\/registry\/default\/ai\//g, '@/registry/default/ui/')

    // Fix 3D component paths
    content = content.replace(/@\/registry\/default\/3d\//g, '@/registry/default/ui/')

    // Fix animation component paths
    content = content.replace(/@\/registry\/default\/animation\//g, '@/registry/default/ui/')

    // Fix code component paths
    content = content.replace(/@\/registry\/default\/code\//g, '@/registry/default/ui/')

    // Count replacements
    const aiCount = (content.match(/@\/registry\/default\/ui\/ai-/g) || []).length
    const threeDCount = (content.match(/@\/registry\/default\/ui\/3d-/g) || []).length
    const animCount = (content.match(/@\/registry\/default\/ui\/animated-/g) || []).length
    const codeCount = (content.match(/@\/registry\/default\/ui\/code-/g) || []).length

    await fs.writeFile(registryFile, content, 'utf-8')

    console.log('✅ Fixed registry paths:')
    console.log(`  - AI components: ${aiCount}`)
    console.log(`  - 3D components: ${threeDCount}`)
    console.log(`  - Animation components: ${animCount}`)
    console.log(`  - Code components: ${codeCount}`)

    // Also fix the example files
    console.log('\n🔧 Fixing example imports...')

    const exampleFiles = [
      './app/registry/default/example/terminal-demo.tsx'
    ]

    for (const file of exampleFiles) {
      try {
        let content = await fs.readFile(file, 'utf-8')
        content = content.replace('@/app/registry/default/ui/', '@/registry/default/ui/')
        await fs.writeFile(file, content, 'utf-8')
        console.log(`  ✅ Fixed ${file}`)
      } catch (e) {
        console.log(`  ⚠️  Couldn't fix ${file}: ${e.message}`)
      }
    }

    console.log('\n✨ Registry paths fixed!')

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

fixRegistryPaths()