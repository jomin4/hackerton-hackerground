import type { ButtonHTMLAttributes } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary';
};

export function Button({ className = '', variant = 'primary', ...props }: ButtonProps) {
  const variantClass =
    variant === 'primary'
      ? 'border border-ink bg-ink text-white hover:bg-ink-2 disabled:cursor-not-allowed disabled:border-fill disabled:bg-fill disabled:text-muted'
      : 'border border-line-strong bg-surface text-ink hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-60';

  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-medium transition-colors ${variantClass} ${className}`}
      {...props}
    />
  );
}
