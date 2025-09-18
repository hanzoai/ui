#!/usr/bin/env node

/**
 * This script updates the registry.json file based on components
 * found in the registry directory. It's similar to the approach used by hanzo/ui.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration
const REGISTRY_DIR = path.resolve(__dirname, '../registry');
const PUBLIC_DIR = path.resolve(__dirname, '../public');
const OUTPUT_FILE = path.resolve(__dirname, '../registry.json');
const REGISTRY_STYLES = ['default', 'new-york']; // Add other styles as needed

// Schema for registry.json
const registrySchema = {
  "$schema": "https://ui.hanzo.com/schema/registry.json",
  "name": "hanzo",
  "homepage": "https://ui.hanzo.ai",
  "items": []
};

/**
 * Main function to update the registry
 */
async function updateRegistry() {
  try {
    console.log('Updating registry.json...');
    
    // Find all registry components
    const items = [];
    
    // Process each style directory
    for (const style of REGISTRY_STYLES) {
      const styleDir = path.join(REGISTRY_DIR, style);
      
      // Skip if style directory doesn't exist
      if (!fs.existsSync(styleDir)) {
        console.log(`Style directory not found: ${style}`);
        continue;
      }
      
      // Process UI components
      const uiDir = path.join(styleDir, 'ui');
      if (fs.existsSync(uiDir)) {
        const uiComponents = glob.sync(`${uiDir}/**/!(*.test|*.spec).{ts,tsx,js,jsx}`);
        
        for (const filePath of uiComponents) {
          const relativePath = path.relative(REGISTRY_DIR, filePath);
          const dirName = path.basename(path.dirname(filePath));
          const fileName = path.basename(filePath);
          
          // Skip index files and non-component files
          if (fileName === 'index.ts' || fileName === 'index.tsx') continue;
          
          // Component name is usually the directory name
          const name = dirName;
          
          // Check if component already exists in the registry
          if (!items.find(item => item.name === name && item.type === 'registry:component')) {
            const componentMeta = {
              name,
              type: 'registry:component',
              description: `A ${name} component for your UI.`,
              files: [
                {
                  path: relativePath,
                  type: 'registry:component'
                }
              ],
              registryDependencies: []
            };
            
            // Try to parse dependencies from the file content
            try {
              const content = fs.readFileSync(filePath, 'utf8');
              
              // Find import statements for other components
              const dependencies = [];
              const importRegex = /import.*from ['"]@\/components\/ui\/([^'"]+)['"]/g;
              let match;
              
              while ((match = importRegex.exec(content)) !== null) {
                const dependency = match[1];
                if (!dependencies.includes(dependency)) {
                  dependencies.push(dependency);
                }
              }
              
              if (dependencies.length > 0) {
                componentMeta.registryDependencies = dependencies;
              }
            } catch (error) {
              console.warn(`Error parsing dependencies for ${name}:`, error.message);
            }
            
            items.push(componentMeta);
          }
        }
      }
      
      // Process other component types (blocks, etc.)
      const blockDir = path.join(styleDir, 'block');
      if (fs.existsSync(blockDir)) {
        const blocks = glob.sync(`${blockDir}/**/!(*.test|*.spec).{ts,tsx,js,jsx}`);
        
        for (const filePath of blocks) {
          const relativePath = path.relative(REGISTRY_DIR, filePath);
          const dirName = path.basename(path.dirname(filePath));
          
          // Skip helper files
          if (dirName === 'utils' || dirName === 'helpers') continue;
          
          // Block name is usually the directory name
          const name = dirName;
          
          // Check if block already exists in the registry
          if (!items.find(item => item.name === name && item.type === 'registry:block')) {
            items.push({
              name,
              type: 'registry:block',
              description: `A ${name} block for your UI.`,
              files: [
                {
                  path: relativePath,
                  type: 'registry:block'
                }
              ]
            });
          }
        }
      }
    }
    
    // Add style definition
    for (const style of REGISTRY_STYLES) {
      items.push({
        name: style,
        type: 'registry:style',
        description: `The ${style} style for Hanzo UI components.`,
        files: []
      });
    }
    
    // Update registry.json
    registrySchema.items = items;
    
    // Create output directory if it doesn't exist
    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write registry.json
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(registrySchema, null, 2), 'utf8');
    console.log(`Registry updated with ${items.length} items.`);
    
    // Create public/r directory if it doesn't exist
    const publicRDir = path.join(PUBLIC_DIR, 'r');
    if (!fs.existsSync(publicRDir)) {
      fs.mkdirSync(publicRDir, { recursive: true });
    }
    
    // Generate individual component JSON files
    console.log('Generating individual component JSON files...');
    for (const item of items) {
      const componentFile = path.join(publicRDir, `${item.name}.json`);
      
      // Add content to files if they exist
      if (item.files && item.files.length > 0) {
        for (const file of item.files) {
          const filePath = path.join(REGISTRY_DIR, file.path);
          if (fs.existsSync(filePath)) {
            file.content = fs.readFileSync(filePath, 'utf8');
          }
        }
      }
      
      // Write component JSON file
      fs.writeFileSync(componentFile, JSON.stringify(item, null, 2), 'utf8');
    }
    
    console.log(`Generated ${items.length} component JSON files.`);
    console.log('Registry update complete!');
    
  } catch (error) {
    console.error('Error updating registry:', error);
    process.exit(1);
  }
}

// Run the update
updateRegistry();
