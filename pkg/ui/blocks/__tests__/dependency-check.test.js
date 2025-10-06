/**
 * Dependency Check Tests
 * Validates that all block dependencies are correctly resolved
 */

const fs = require('fs');
const path = require('path');

const blocksDir = path.join(__dirname, '..');
const primitivesDir = path.join(__dirname, '../../primitives');

// Extract imports from a file
function extractImports(content) {
  const importRegex = /import\s+(?:{[^}]*}|[^from]+)\s+from\s+['"]([^'"]+)['"]/g;
  const imports = [];
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  return imports;
}

// Check if a primitive exists
function primitiveExists(primitiveName) {
  const primitivePath = path.join(primitivesDir, `${primitiveName}.tsx`);
  return fs.existsSync(primitivePath);
}

describe('Block Dependencies', () => {
  describe('Dashboard Dependencies', () => {
    test('dashboard-01 page imports are valid', () => {
      const pagePath = path.join(blocksDir, 'dashboard/dashboard-01/page.tsx');
      const content = fs.readFileSync(pagePath, 'utf8');
      const imports = extractImports(content);

      // Check local imports
      const localImports = imports.filter(imp => imp.startsWith('./'));
      localImports.forEach(imp => {
        const importPath = path.join(blocksDir, 'dashboard/dashboard-01', imp);
        expect(fs.existsSync(importPath) || fs.existsSync(`${importPath}.tsx`)).toBe(true);
      });
    });

    test('dashboard-01 components use valid primitives', () => {
      const componentsDir = path.join(blocksDir, 'dashboard/dashboard-01/components');
      const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));

      files.forEach(file => {
        const filePath = path.join(componentsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const imports = extractImports(content);

        // Check primitive imports
        const primitiveImports = imports.filter(imp => imp.includes('primitives/'));
        primitiveImports.forEach(imp => {
          const primitiveName = imp.split('/').pop();
          expect(primitiveExists(primitiveName)).toBe(true);
        });
      });
    });
  });

  describe('Sidebar Dependencies', () => {
    test('sidebar variants import valid primitives', () => {
      for (let i = 1; i <= 3; i++) { // Test first 3 variants
        const variant = String(i).padStart(2, '0');
        const pagePath = path.join(blocksDir, `sidebar/sidebar-${variant}/page.tsx`);
        const content = fs.readFileSync(pagePath, 'utf8');
        const imports = extractImports(content);

        // Verify local imports exist
        const localImports = imports.filter(imp => imp.startsWith('./'));
        localImports.forEach(imp => {
          const importPath = path.join(blocksDir, `sidebar/sidebar-${variant}`, imp);
          expect(
            fs.existsSync(importPath) ||
            fs.existsSync(`${importPath}.tsx`) ||
            fs.existsSync(`${importPath}/index.tsx`)
          ).toBe(true);
        });
      }
    });

    test('sidebar components use valid primitives', () => {
      const componentsDir = path.join(blocksDir, 'sidebar/sidebar-01/components');
      const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));

      files.forEach(file => {
        const filePath = path.join(componentsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const imports = extractImports(content);

        // Check primitive imports
        const primitiveImports = imports.filter(imp => imp.includes('primitives/'));
        primitiveImports.forEach(imp => {
          const primitiveName = imp.split('/').pop();
          expect(primitiveExists(primitiveName)).toBe(true);
        });
      });
    });
  });

  describe('Calendar Dependencies', () => {
    test('calendar variants import Calendar primitive', () => {
      for (let i = 1; i <= 5; i++) { // Test first 5 variants
        const variant = String(i).padStart(2, '0');
        const calendarPath = path.join(blocksDir, `calendar/calendar-${variant}.tsx`);
        const content = fs.readFileSync(calendarPath, 'utf8');

        // Calendar should import from primitives
        expect(content).toContain('primitives/calendar');
      }
    });

    test('calendar primitives are available', () => {
      expect(primitiveExists('calendar')).toBe(true);
    });

    test('calendar variants use valid imports', () => {
      const calendar01 = path.join(blocksDir, 'calendar/calendar-01.tsx');
      const content = fs.readFileSync(calendar01, 'utf8');
      const imports = extractImports(content);

      // All imports should be resolvable
      imports.forEach(imp => {
        if (imp.includes('primitives/')) {
          const primitiveName = imp.split('/').pop();
          expect(primitiveExists(primitiveName)).toBe(true);
        }
      });
    });
  });

  describe('Auth Dependencies', () => {
    test('login variants have valid component imports', () => {
      for (let i = 1; i <= 3; i++) { // Test first 3 variants
        const variant = String(i).padStart(2, '0');
        const pagePath = path.join(blocksDir, `auth/login/login-${variant}/page.tsx`);
        const content = fs.readFileSync(pagePath, 'utf8');
        const imports = extractImports(content);

        // Verify local imports
        const localImports = imports.filter(imp => imp.startsWith('./'));
        localImports.forEach(imp => {
          const importPath = path.join(blocksDir, `auth/login/login-${variant}`, imp);
          expect(
            fs.existsSync(importPath) ||
            fs.existsSync(`${importPath}.tsx`) ||
            fs.existsSync(`${importPath}/index.tsx`)
          ).toBe(true);
        });
      }
    });

    test('signup variants have valid component imports', () => {
      for (let i = 1; i <= 3; i++) { // Test first 3 variants
        const variant = String(i).padStart(2, '0');
        const pagePath = path.join(blocksDir, `auth/signup/signup-${variant}/page.tsx`);
        const content = fs.readFileSync(pagePath, 'utf8');
        const imports = extractImports(content);

        // Verify local imports
        const localImports = imports.filter(imp => imp.startsWith('./'));
        localImports.forEach(imp => {
          const importPath = path.join(blocksDir, `auth/signup/signup-${variant}`, imp);
          expect(
            fs.existsSync(importPath) ||
            fs.existsSync(`${importPath}.tsx`) ||
            fs.existsSync(`${importPath}/index.tsx`)
          ).toBe(true);
        });
      }
    });

    test('otp variants have valid component imports', () => {
      for (let i = 1; i <= 3; i++) { // Test first 3 variants
        const variant = String(i).padStart(2, '0');
        const pagePath = path.join(blocksDir, `auth/otp/otp-${variant}/page.tsx`);
        const content = fs.readFileSync(pagePath, 'utf8');
        const imports = extractImports(content);

        // Verify local imports
        const localImports = imports.filter(imp => imp.startsWith('./'));
        localImports.forEach(imp => {
          const importPath = path.join(blocksDir, `auth/otp/otp-${variant}`, imp);
          expect(
            fs.existsSync(importPath) ||
            fs.existsSync(`${importPath}.tsx`) ||
            fs.existsSync(`${importPath}/index.tsx`)
          ).toBe(true);
        });
      }
    });
  });

  describe('Required Primitives', () => {
    const requiredPrimitives = [
      'button',
      'card',
      'input',
      'label',
      'calendar',
      'select',
      'sidebar',
      'form',
      'checkbox',
      'input-otp'
    ];

    requiredPrimitives.forEach(primitive => {
      test(`${primitive} primitive exists`, () => {
        expect(primitiveExists(primitive)).toBe(true);
      });
    });
  });

  describe('External Dependencies', () => {
    test('blocks can import React', () => {
      const calendar01 = path.join(blocksDir, 'calendar/calendar-01.tsx');
      const content = fs.readFileSync(calendar01, 'utf8');
      expect(content).toContain('React');
    });

    test('blocks use client directive where needed', () => {
      const calendar01 = path.join(blocksDir, 'calendar/calendar-01.tsx');
      const content = fs.readFileSync(calendar01, 'utf8');
      expect(content).toContain('"use client"');
    });
  });
});

describe('Import Path Consistency', () => {
  test('all blocks use relative primitive imports', () => {
    // Check calendar
    const calendar01 = path.join(blocksDir, 'calendar/calendar-01.tsx');
    const calContent = fs.readFileSync(calendar01, 'utf8');
    const calImports = extractImports(calContent);
    const calPrimitiveImports = calImports.filter(imp => imp.includes('primitives'));
    calPrimitiveImports.forEach(imp => {
      expect(imp).toContain('../');
    });
  });

  test('all blocks use local component imports', () => {
    // Check dashboard
    const dashPage = path.join(blocksDir, 'dashboard/dashboard-01/page.tsx');
    const dashContent = fs.readFileSync(dashPage, 'utf8');
    expect(dashContent).toContain('./components');

    // Check sidebar
    const sidebarPage = path.join(blocksDir, 'sidebar/sidebar-01/page.tsx');
    const sidebarContent = fs.readFileSync(sidebarPage, 'utf8');
    expect(sidebarContent).toContain('./components');

    // Check auth
    const loginPage = path.join(blocksDir, 'auth/login/login-01/page.tsx');
    const loginContent = fs.readFileSync(loginPage, 'utf8');
    expect(loginContent).toContain('./components');
  });
});
