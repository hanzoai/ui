const fs = require('fs');
const path = require('path');

// Fix remaining sidebar blocks (05-16)
for (let i = 5; i <= 16; i++) {
  const num = i.toString().padStart(2, '0');
  const file = `registry/default/block/sidebar-${num}.tsx`;
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    // Replace each function with numbered version
    content = content.replace(/export function AppSidebar\(/g, `export function AppSidebar${num}(`);
    content = content.replace(/export function SearchForm\(/g, `export function SearchForm${num}(`);
    content = content.replace(/export function VersionSwitcher\(/g, `export function VersionSwitcher${num}(`);
    content = content.replace(/export function TeamSwitcher\(/g, `export function TeamSwitcher${num}(`);
    
    // Update display names and default exports
    content = content.replace(/AppSidebar\.displayName/g, `AppSidebar${num}.displayName`);
    content = content.replace(/SearchForm\.displayName/g, `SearchForm${num}.displayName`);
    content = content.replace(/VersionSwitcher\.displayName/g, `VersionSwitcher${num}.displayName`);
    content = content.replace(/TeamSwitcher\.displayName/g, `TeamSwitcher${num}.displayName`);
    
    // Update the default export to use the renamed main component
    content = content.replace(/export default AppSidebar/g, `export default AppSidebar${num}`);
    
    fs.writeFileSync(file, content);
    console.log(`Fixed ${file}`);
  }
}

// Check for any other block files with duplicate functions
const blockFiles = fs.readdirSync('registry/default/block/').filter(f => f.endsWith('.tsx'));
for (const file of blockFiles) {
  if (!file.startsWith('sidebar-') && !file.startsWith('login-') && !file.startsWith('otp-')) {
    const filepath = `registry/default/block/${file}`;
    const content = fs.readFileSync(filepath, 'utf8');
    
    // Check for common duplicate function names
    const commonFunctions = ['SignUpForm', 'SignInForm', 'ResetForm', 'VerifyForm'];
    for (const func of commonFunctions) {
      if (content.includes(`export function ${func}(`)) {
        const suffix = file.replace('.tsx', '').replace(/-/g, '_');
        let newContent = content;
        newContent = newContent.replace(new RegExp(`export function ${func}\\(`, 'g'), `export function ${func}_${suffix}(`);
        newContent = newContent.replace(new RegExp(`${func}\\.displayName`, 'g'), `${func}_${suffix}.displayName`);
        newContent = newContent.replace(new RegExp(`export default ${func}`, 'g'), `export default ${func}_${suffix}`);
        if (newContent !== content) {
          fs.writeFileSync(filepath, newContent);
          console.log(`Fixed ${func} in ${file}`);
        }
      }
    }
  }
}

console.log('All duplicate function names fixed!');
