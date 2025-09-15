#!/usr/bin/env node

import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import pngToIco from 'png-to-ico'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// SVG content for Hanzo logo with black background and white shapes
const svgContent = `<svg viewBox="0 0 67 67" xmlns="http://www.w3.org/2000/svg">
  <rect width="67" height="67" fill="#000000" />
  <path d="M22.21 67V44.6369H0V67H22.21Z" fill="#ffffff"/>
  <path d="M0 44.6369L22.21 46.8285V44.6369H0Z" fill="#DDDDDD"/>
  <path d="M66.7038 22.3184H22.2534L0.0878906 44.6367H44.4634L66.7038 22.3184Z" fill="#ffffff"/>
  <path d="M22.21 0H0V22.3184H22.21V0Z" fill="#ffffff"/>
  <path d="M66.7198 0H44.5098V22.3184H66.7198V0Z" fill="#ffffff"/>
  <path d="M66.6753 22.3185L44.5098 20.0822V22.3185H66.6753Z" fill="#DDDDDD"/>
  <path d="M66.7198 67V44.6369H44.5098V67H66.7198Z" fill="#ffffff"/>
</svg>`

const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'favicon-48x48.png', size: 48 },
  { name: 'favicon-64x64.png', size: 64 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
]

async function generateFavicons() {
  const publicDir = path.join(__dirname, '..', 'public')
  
  console.log('🎨 Generating favicons from Hanzo logo...')
  
  // Generate PNG favicons
  const pngFiles = []
  for (const { name, size } of sizes) {
    const outputPath = path.join(publicDir, name)
    
    await sharp(Buffer.from(svgContent))
      .resize(size, size)
      .png()
      .toFile(outputPath)
    
    console.log(`✅ Generated ${name} (${size}x${size})`)
    
    // Collect files for ICO generation
    if (size <= 64) {
      pngFiles.push(outputPath)
    }
  }
  
  // Generate proper ICO file with multiple resolutions
  console.log('🔧 Generating favicon.ico with multiple resolutions...')
  try {
    const icoBuffer = await pngToIco([
      path.join(publicDir, 'favicon-16x16.png'),
      path.join(publicDir, 'favicon-32x32.png'),
      path.join(publicDir, 'favicon-48x48.png'),
      path.join(publicDir, 'favicon-64x64.png')
    ])
    
    await fs.writeFile(path.join(publicDir, 'favicon.ico'), icoBuffer)
    console.log('✅ Generated favicon.ico with 16x16, 32x32, 48x48, and 64x64 resolutions')
  } catch (error) {
    console.error('❌ Error generating ICO file:', error)
  }
  
  // Update the SVG logo file
  const svgPath = path.join(publicDir, 'hanzo-logo.svg')
  await fs.writeFile(svgPath, svgContent)
  console.log('✅ Updated hanzo-logo.svg')
  
  console.log('✨ All favicons generated successfully!')
}

generateFavicons().catch(console.error)