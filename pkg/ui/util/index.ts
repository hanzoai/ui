// Export all utilities
export * from './date';
export * from './file';
export * from './create-shadow-root';
export * from './timing';
export * from './blob';
export * from './copy-to-clipboard';
export * from './format-text';
export * from './toasts';
export * from './debounce';
export { default as spreadToTransform } from './spread-to-transform';
export * from './specifier';
export * from './number-abbreviate';
export * from './format-to-max-char';
export * from './format-and-abbreviate-as-currency';
export * from './two-way-map';
export * from './use-mobile';

// Export cn utility and other common functions from src/utils
export { cn, formatDate, absoluteUrl } from '../src/utils';

// Export VariantProps type from class-variance-authority
export type { VariantProps } from 'class-variance-authority';

// For backward compatibility with components importing from util
export function constrain(value: number, min: number, max: number): number;
export function constrain(dim: { w: number; h: number }, constrainTo: { w: number; h: number }): { w: number; h: number };
export function constrain(
  value: number | { w: number; h: number },
  minOrConstrainTo: number | { w: number; h: number },
  max?: number
): number | { w: number; h: number } {
  if (typeof value === 'number' && typeof minOrConstrainTo === 'number' && typeof max === 'number') {
    return Math.min(Math.max(value, minOrConstrainTo), max);
  }

  if (typeof value === 'object' && typeof minOrConstrainTo === 'object') {
    const dim = value;
    const constrainTo = minOrConstrainTo;
    const aspectRatio = dim.w / dim.h;
    const constrainAspectRatio = constrainTo.w / constrainTo.h;

    if (aspectRatio > constrainAspectRatio) {
      // constrain by width
      return {
        w: constrainTo.w,
        h: constrainTo.w / aspectRatio
      };
    } else {
      // constrain by height
      return {
        w: constrainTo.h * aspectRatio,
        h: constrainTo.h
      };
    }
  }

  throw new Error('Invalid parameters for constrain function');
}

// Export round, pxToRem, pxToEm for tailwind plugin
export function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export function pxToRem(px: number, base = 16): string {
  return `${px / base}rem`;
}

export function pxToEm(px: number, base = 16): string {
  return `${px / base}em`;
}

// Missing utility functions
export function containsToken(text: string | undefined, token: string): boolean {
  if (!text) return false;
  return text.toLowerCase().includes(token.toLowerCase());
}

export function ldMerge(...objects: any[]): any {
  // Simple merge function for lodash compatibility
  const result = {};
  for (const obj of objects) {
    if (obj && typeof obj === 'object') {
      Object.assign(result, obj);
    }
  }
  return result;
}

export function asNum(value: any, defaultValue = 0): number {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}
