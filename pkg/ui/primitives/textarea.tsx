import * as React from 'react';

import { RefCallBack } from 'react-hook-form';
import { cn } from '../src/utils';

const DEFAULT_MIN_TEXTAREA_HEIGHT = 32;
const DEFAULT_MAX_TEXTAREA_HEIGHT = 300;

export type TextareaProps =
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    minHeight?: number;
    maxHeight?: number;
    resize?: 'none' | 'both' | 'horizontal' | 'vertical';
  };

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      minHeight = DEFAULT_MIN_TEXTAREA_HEIGHT,
      maxHeight = DEFAULT_MAX_TEXTAREA_HEIGHT,
      resize = 'none',
      ...props
    },
    ref
  ) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const mergedRef = (ref as React.RefObject<HTMLTextAreaElement>) || textareaRef;

    React.useLayoutEffect(() => {
      // Reset height - important to shrink on delete
      if (!mergedRef.current) return;
      mergedRef.current.style.height = 'inherit';
      // Set height
      mergedRef.current.style.height = `${Math.max(
        mergedRef.current.scrollHeight + 2,
        minHeight,
      )}px`;

      if (props.autoFocus !== undefined && props.autoFocus) {
        mergedRef.current.focus();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.value, minHeight, maxHeight]);

    return (
      <textarea
        className={cn(
          'bg-bg-secondary placeholder:!text-text-placeholder border-input focus-visible:ring-border-input-focus flex w-full rounded-md border px-4 py-2 pt-7 text-sm break-words focus-visible:ring-1 focus-visible:outline-hidden focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={mergedRef}
        style={{
          minHeight: `${minHeight}px`,
          maxHeight: resize === 'vertical' ? undefined : `${maxHeight}px`,
          resize: resize,
        }}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
