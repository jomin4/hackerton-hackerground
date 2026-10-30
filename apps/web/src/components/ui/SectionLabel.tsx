import type { HTMLAttributes } from 'react';

export function SectionLabel({ className = '', ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={`font-mono text-xs font-medium uppercase tracking-[0.06em] text-accent-text ${className}`}
      {...props}
    />
  );
}
