#!/usr/bin/env node

/**
 * Simple registry builder for @hanzo/ui
 * Creates the necessary structure for the MCP registry
 */

const fs = require('fs');
const path = require('path');

// Configuration
const REGISTRY_DIR = path.resolve(__dirname, '../registry');
const PUBLIC_DIR = path.resolve(__dirname, '../public');
const OUTPUT_FILE = path.resolve(__dirname, '../registry.json');
const REGISTRY_STYLES = ['default', 'new-york']; 

// Registry schema
const registrySchema = {
  "$schema": "https://ui.hanzo.com/schema/registry.json",
  "name": "hanzo",
  "homepage": "https://ui.hanzo.ai",
  "items": []
};

// Create the basic registry structure
function createRegistry() {
  console.log('Creating registry structure...');
  
  const items = [];
  
  // Ensure registry directory exists
  if (!fs.existsSync(REGISTRY_DIR)) {
    fs.mkdirSync(REGISTRY_DIR, { recursive: true });
  }
  
  // Create style directories and add them to registry items
  for (const style of REGISTRY_STYLES) {
    const styleDir = path.join(REGISTRY_DIR, style);
    if (!fs.existsSync(styleDir)) {
      fs.mkdirSync(styleDir, { recursive: true });
      
      // Create ui and block directories
      fs.mkdirSync(path.join(styleDir, 'ui'), { recursive: true });
      fs.mkdirSync(path.join(styleDir, 'block'), { recursive: true });
    }
    
    // Add style to registry
    items.push({
      name: style,
      type: 'registry:style',
      description: `The ${style} style for Hanzo UI components.`,
      files: []
    });
  }
  
  // Add primitive components as empty placeholders
  const primitives = [
    'accordion', 'alert', 'avatar', 'badge', 'button', 'card', 
    'checkbox', 'dialog', 'input', 'label', 'popover', 'select', 
    'table', 'tabs', 'toast'
  ];
  
  for (const component of primitives) {
    items.push({
      name: component,
      type: 'registry:component',
      description: `A ${component} component for your UI.`,
      files: [
        {
          path: `default/ui/${component}/${component}.tsx`,
          type: 'registry:component'
        }
      ]
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
    fs.writeFileSync(componentFile, JSON.stringify(item, null, 2), 'utf8');
  }
  
  console.log(`Generated ${items.length} component JSON files.`);
  console.log('Registry creation complete!');
}

// Run the registry creation
createRegistry();
