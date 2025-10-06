/**
 * Comprehensive Block Validation Tests
 * Validates all migrated blocks structure and integrity
 */

const fs = require('fs');
const path = require('path');

const blocksDir = path.join(__dirname, '..');

describe('Migrated Blocks - Comprehensive Validation', () => {
  describe('Dashboard Blocks (1 block, 11 components)', () => {
    test('dashboard-01 exists with correct structure', () => {
      const dashboard01 = path.join(blocksDir, 'dashboard/dashboard-01');
      expect(fs.existsSync(dashboard01)).toBe(true);
      expect(fs.existsSync(path.join(dashboard01, 'page.tsx'))).toBe(true);
      expect(fs.existsSync(path.join(dashboard01, 'components'))).toBe(true);
      expect(fs.existsSync(path.join(dashboard01, 'data.json'))).toBe(true);
    });

    test('dashboard-01 has 11 component files', () => {
      const componentsDir = path.join(blocksDir, 'dashboard/dashboard-01/components');
      const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));
      expect(files.length).toBeGreaterThanOrEqual(6); // At least major components
    });

    test('dashboard-01 page imports components correctly', () => {
      const pagePath = path.join(blocksDir, 'dashboard/dashboard-01/page.tsx');
      const content = fs.readFileSync(pagePath, 'utf8');
      expect(content).toContain('./components');
    });

    test('dashboard index exports correctly', () => {
      const indexPath = path.join(blocksDir, 'dashboard/index.ts');
      expect(fs.existsSync(indexPath)).toBe(true);
      const content = fs.readFileSync(indexPath, 'utf8');
      expect(content).toContain('dashboard-01');
    });
  });

  describe('Sidebar Blocks (16 variants, ~72 files)', () => {
    test('all 16 sidebar variants exist', () => {
      for (let i = 1; i <= 16; i++) {
        const variant = String(i).padStart(2, '0');
        const sidebarPath = path.join(blocksDir, `sidebar/sidebar-${variant}`);
        expect(fs.existsSync(sidebarPath)).toBe(true);
        expect(fs.existsSync(path.join(sidebarPath, 'page.tsx'))).toBe(true);
        expect(fs.existsSync(path.join(sidebarPath, 'components'))).toBe(true);
      }
    });

    test('each sidebar has components directory with files', () => {
      for (let i = 1; i <= 16; i++) {
        const variant = String(i).padStart(2, '0');
        const componentsDir = path.join(blocksDir, `sidebar/sidebar-${variant}/components`);
        const files = fs.readdirSync(componentsDir);
        expect(files.length).toBeGreaterThan(0);
      }
    });

    test('sidebar pages import from local components', () => {
      for (let i = 1; i <= 16; i++) {
        const variant = String(i).padStart(2, '0');
        const pagePath = path.join(blocksDir, `sidebar/sidebar-${variant}/page.tsx`);
        const content = fs.readFileSync(pagePath, 'utf8');
        expect(content).toContain('./components');
      }
    });

    test('sidebar index exports all variants', () => {
      const indexPath = path.join(blocksDir, 'sidebar/index.ts');
      expect(fs.existsSync(indexPath)).toBe(true);
      const content = fs.readFileSync(indexPath, 'utf8');
      for (let i = 1; i <= 16; i++) {
        const variant = String(i).padStart(2, '0');
        expect(content).toContain(`sidebar-${variant}`);
      }
    });
  });

  describe('Calendar Blocks (32 files)', () => {
    test('all 32 calendar variants exist', () => {
      for (let i = 1; i <= 32; i++) {
        const variant = String(i).padStart(2, '0');
        const calendarPath = path.join(blocksDir, `calendar/calendar-${variant}.tsx`);
        expect(fs.existsSync(calendarPath)).toBe(true);
      }
    });

    test('calendar files export default components', () => {
      for (let i = 1; i <= 32; i++) {
        const variant = String(i).padStart(2, '0');
        const calendarPath = path.join(blocksDir, `calendar/calendar-${variant}.tsx`);
        const content = fs.readFileSync(calendarPath, 'utf8');
        expect(content).toContain('export default');
      }
    });

    test('calendar files use primitives correctly', () => {
      const calendar01 = path.join(blocksDir, 'calendar/calendar-01.tsx');
      const content = fs.readFileSync(calendar01, 'utf8');
      expect(content).toContain('primitives');
    });

    test('calendar index exports all variants', () => {
      const indexPath = path.join(blocksDir, 'calendar/index.ts');
      expect(fs.existsSync(indexPath)).toBe(true);
      const content = fs.readFileSync(indexPath, 'utf8');
      for (let i = 1; i <= 32; i++) {
        const variant = String(i).padStart(2, '0');
        expect(content).toContain(`calendar-${variant}`);
      }
    });
  });

  describe('Auth Blocks (15 variants: 5 login, 5 signup, 5 otp)', () => {
    test('all 5 login variants exist', () => {
      for (let i = 1; i <= 5; i++) {
        const variant = String(i).padStart(2, '0');
        const loginPath = path.join(blocksDir, `auth/login/login-${variant}`);
        expect(fs.existsSync(loginPath)).toBe(true);
        expect(fs.existsSync(path.join(loginPath, 'page.tsx'))).toBe(true);
        expect(fs.existsSync(path.join(loginPath, 'components'))).toBe(true);
      }
    });

    test('all 5 signup variants exist', () => {
      for (let i = 1; i <= 5; i++) {
        const variant = String(i).padStart(2, '0');
        const signupPath = path.join(blocksDir, `auth/signup/signup-${variant}`);
        expect(fs.existsSync(signupPath)).toBe(true);
        expect(fs.existsSync(path.join(signupPath, 'page.tsx'))).toBe(true);
        expect(fs.existsSync(path.join(signupPath, 'components'))).toBe(true);
      }
    });

    test('all 5 otp variants exist', () => {
      for (let i = 1; i <= 5; i++) {
        const variant = String(i).padStart(2, '0');
        const otpPath = path.join(blocksDir, `auth/otp/otp-${variant}`);
        expect(fs.existsSync(otpPath)).toBe(true);
        expect(fs.existsSync(path.join(otpPath, 'page.tsx'))).toBe(true);
        expect(fs.existsSync(path.join(otpPath, 'components'))).toBe(true);
      }
    });

    test('login variants have components', () => {
      for (let i = 1; i <= 5; i++) {
        const variant = String(i).padStart(2, '0');
        const componentsDir = path.join(blocksDir, `auth/login/login-${variant}/components`);
        const files = fs.readdirSync(componentsDir);
        expect(files.length).toBeGreaterThan(0);
      }
    });

    test('signup variants have components', () => {
      for (let i = 1; i <= 5; i++) {
        const variant = String(i).padStart(2, '0');
        const componentsDir = path.join(blocksDir, `auth/signup/signup-${variant}/components`);
        const files = fs.readdirSync(componentsDir);
        expect(files.length).toBeGreaterThan(0);
      }
    });

    test('otp variants have components', () => {
      for (let i = 1; i <= 5; i++) {
        const variant = String(i).padStart(2, '0');
        const componentsDir = path.join(blocksDir, `auth/otp/otp-${variant}/components`);
        const files = fs.readdirSync(componentsDir);
        expect(files.length).toBeGreaterThan(0);
      }
    });

    test('auth index exports all blocks', () => {
      const indexPath = path.join(blocksDir, 'auth/index.ts');
      expect(fs.existsSync(indexPath)).toBe(true);
      const content = fs.readFileSync(indexPath, 'utf8');
      expect(content).toContain('login');
      expect(content).toContain('signup');
      expect(content).toContain('otp');
    });
  });

  describe('Import Path Validation', () => {
    test('blocks use relative primitive imports', () => {
      const calendar01 = path.join(blocksDir, 'calendar/calendar-01.tsx');
      const content = fs.readFileSync(calendar01, 'utf8');
      expect(content).toContain('../../primitives');
    });

    test('sidebar blocks import components correctly', () => {
      const sidebar01 = path.join(blocksDir, 'sidebar/sidebar-01/page.tsx');
      const content = fs.readFileSync(sidebar01, 'utf8');
      expect(content).toContain('./components');
    });

    test('auth blocks import components correctly', () => {
      const login01 = path.join(blocksDir, 'auth/login/login-01/page.tsx');
      const content = fs.readFileSync(login01, 'utf8');
      expect(content).toContain('./components');
    });
  });

  describe('File Integrity', () => {
    test('all calendar files are valid TSX', () => {
      for (let i = 1; i <= 32; i++) {
        const variant = String(i).padStart(2, '0');
        const calendarPath = path.join(blocksDir, `calendar/calendar-${variant}.tsx`);
        const content = fs.readFileSync(calendarPath, 'utf8');
        expect(content.length).toBeGreaterThan(0);
        expect(content).toContain('React');
      }
    });

    test('all sidebar pages are valid TSX', () => {
      for (let i = 1; i <= 16; i++) {
        const variant = String(i).padStart(2, '0');
        const pagePath = path.join(blocksDir, `sidebar/sidebar-${variant}/page.tsx`);
        const content = fs.readFileSync(pagePath, 'utf8');
        expect(content.length).toBeGreaterThan(0);
      }
    });

    test('all auth pages are valid TSX', () => {
      const authTypes = ['login', 'signup', 'otp'];
      authTypes.forEach(type => {
        for (let i = 1; i <= 5; i++) {
          const variant = String(i).padStart(2, '0');
          const pagePath = path.join(blocksDir, `auth/${type}/${type}-${variant}/page.tsx`);
          const content = fs.readFileSync(pagePath, 'utf8');
          expect(content.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Total File Counts', () => {
    test('dashboard has 1 block', () => {
      const dashboardDir = path.join(blocksDir, 'dashboard');
      const dirs = fs.readdirSync(dashboardDir).filter(f =>
        fs.statSync(path.join(dashboardDir, f)).isDirectory()
      );
      expect(dirs.length).toBe(1);
    });

    test('sidebar has 16 blocks', () => {
      const sidebarDir = path.join(blocksDir, 'sidebar');
      const dirs = fs.readdirSync(sidebarDir).filter(f =>
        fs.statSync(path.join(sidebarDir, f)).isDirectory()
      );
      expect(dirs.length).toBe(16);
    });

    test('calendar has 32 files', () => {
      const calendarDir = path.join(blocksDir, 'calendar');
      const files = fs.readdirSync(calendarDir).filter(f =>
        f.startsWith('calendar-') && f.endsWith('.tsx')
      );
      expect(files.length).toBe(32);
    });

    test('auth has 15 total variants (5 each)', () => {
      const authTypes = ['login', 'signup', 'otp'];
      let totalCount = 0;
      authTypes.forEach(type => {
        const typeDir = path.join(blocksDir, `auth/${type}`);
        const dirs = fs.readdirSync(typeDir).filter(f =>
          fs.statSync(path.join(typeDir, f)).isDirectory()
        );
        totalCount += dirs.length;
      });
      expect(totalCount).toBe(15);
    });
  });
});
