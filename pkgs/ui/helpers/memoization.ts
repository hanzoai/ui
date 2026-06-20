import React from 'react';

// Memoization helpers for markdown components
export const memoCompareNodes = (
  prevProps: { children?: React.ReactNode },
  nextProps: { children?: React.ReactNode }
): boolean => {
  return prevProps.children === nextProps.children;
};

export const memoizeMarkdownComponents = <T extends Record<string, React.ComponentType<any>>>(
  components: T
): T => {
  const memoized: any = {};

  for (const key in components) {
    if (components.hasOwnProperty(key)) {
      memoized[key] = React.memo(components[key]);
    }
  }

  return memoized as T;
};

// Helper to check if props are equal for memoization
export const arePropsEqual = <T extends Record<string, any>>(
  prevProps: T,
  nextProps: T,
  keys?: string[]
): boolean => {
  const keysToCheck = keys || Object.keys(prevProps);

  for (const key of keysToCheck) {
    if (prevProps[key] !== nextProps[key]) {
      return false;
    }
  }

  return true;
};