import type { HTMLAttributes } from 'react';

export function Chip({ className = '', ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-full border border-line px-3 text-xs font-medium text-ink-3 ${className}`}
      {...props}
    />
  );
}
