import type { HTMLAttributes } from 'react';

export function Tag({ className = '', ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={`inline-flex items-center rounded-md bg-fill px-2 py-1 text-xs text-ink-3 ${className}`}
      {...props}
    />
  );
}
