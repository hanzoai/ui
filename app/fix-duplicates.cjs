const fs = require('fs');
const path = require('path');

// Fix login blocks
for (let i = 1; i <= 5; i++) {
  const file = `registry/default/block/login-0${i}.tsx`;
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    // Replace LoginForm with LoginForm0X
    content = content.replace(/export function LoginForm\(/g, `export function LoginForm0${i}(`);
    content = content.replace(/LoginForm\.displayName/g, `LoginForm0${i}.displayName`);
    // Also update the default export if it exists
    content = content.replace(/export default LoginForm/g, `export default LoginForm0${i}`);
    fs.writeFileSync(file, content);
    console.log(`Fixed ${file}`);
  }
}

// Fix OTP blocks
for (let i = 1; i <= 5; i++) {
  const file = `registry/default/block/otp-0${i}.tsx`;
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/export function OTPForm\(/g, `export function OTPForm0${i}(`);
    content = content.replace(/OTPForm\.displayName/g, `OTPForm0${i}.displayName`);
    content = content.replace(/export default OTPForm/g, `export default OTPForm0${i}`);
    fs.writeFileSync(file, content);
    console.log(`Fixed ${file}`);
  }
}

// Fix sidebar blocks - these have multiple functions
for (let i = 1; i <= 4; i++) {
  const file = `registry/default/block/sidebar-0${i}.tsx`;
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    // Replace each function with numbered version
    content = content.replace(/export function AppSidebar\(/g, `export function AppSidebar0${i}(`);
    content = content.replace(/export function SearchForm\(/g, `export function SearchForm0${i}(`);
    content = content.replace(/export function VersionSwitcher\(/g, `export function VersionSwitcher0${i}(`);
    
    // Update display names and default exports
    content = content.replace(/AppSidebar\.displayName/g, `AppSidebar0${i}.displayName`);
    content = content.replace(/SearchForm\.displayName/g, `SearchForm0${i}.displayName`);
    content = content.replace(/VersionSwitcher\.displayName/g, `VersionSwitcher0${i}.displayName`);
    
    // Update the default export to use the renamed main component
    content = content.replace(/export default AppSidebar/g, `export default AppSidebar0${i}`);
    
    fs.writeFileSync(file, content);
    console.log(`Fixed ${file}`);
  }
}

console.log('All duplicate function names fixed!');
