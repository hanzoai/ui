import React from 'react';

import { cn } from '../src/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('bg-bg-secondary animate-pulse rounded-md', className)}
      {...props}
    />
  );
}

export { Skeleton };
export default Skeleton;
