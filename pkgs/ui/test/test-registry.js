// Small test for the registry functionality
// This script checks if the registry is accessible
const https = require('https');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      
      // Handle HTTP errors
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP error: ${res.statusCode} ${res.statusMessage}`));
        return;
      }
      
      // Collect data chunks
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      // Process complete response
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (error) {
          reject(new Error(`Invalid JSON: ${error.message}`));
        }
      });
      
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  try {
    // Define registry URL
    const registryUrl = "https://ui.hanzo.ai/registry/registry.json";
    
    // Fetch the registry
    console.log(`Fetching registry from ${registryUrl}...`);
    const registry = await fetchJson(registryUrl);
    
    console.log(`Successfully fetched registry with ${registry.items.length} items`);
    
    // Display some basic information
    console.log(`Registry name: ${registry.name}`);
    console.log(`Homepage: ${registry.homepage || 'Not specified'}`);
    
    // Count items by type
    const typeCount = {};
    registry.items.forEach(item => {
      const type = item.type;
      typeCount[type] = (typeCount[type] || 0) + 1;
    });
    
    console.log("Items by type:");
    Object.entries(typeCount).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} items`);
    });
    
    // Test complete
    console.log("Registry test completed successfully!");
  } catch (error) {
    console.error("Error testing registry:", error);
    process.exit(1);
  }
}

// Run the test
main();