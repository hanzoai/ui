'use client';
import type { ComponentProps } from 'react';
import { RootProvider as BaseProvider } from '@/provider/base';
import { WakuProvider } from '@hanzo/docs-core/framework/waku';
import type { Framework } from '@hanzo/docs-core/framework';

export interface RootProviderProps extends ComponentProps<typeof BaseProvider> {
  /**
   * Custom framework components to override Waku defaults
   */
  components?: {
    Link?: Framework['Link'];
    Image?: Framework['Image'];
  };
}

export function RootProvider({ components, ...props }: RootProviderProps) {
  return (
    <WakuProvider Link={components?.Link} Image={components?.Image}>
      <BaseProvider {...props}>{props.children}</BaseProvider>
    </WakuProvider>
  );
}
