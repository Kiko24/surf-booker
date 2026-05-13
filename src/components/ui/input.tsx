import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, className, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block mb-2 text-sm font-medium text-[var(--color-foreground)]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full h-11 px-4',
            'bg-[var(--color-surface)] text-[var(--color-foreground)]',
            'border rounded-[var(--radius-pill)]',
            'transition-colors',
            error
              ? 'border-[var(--color-error)]'
              : 'border-[var(--color-border)]',
            'focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 focus:ring-offset-[var(--color-background)]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className
          )}
          {...props}
        />
        {hint && !error && (
          <p className="mt-1.5 text-xs text-[var(--color-muted)] font-body">
            {hint}
          </p>
        )}
        {error && (
          <p className="mt-1.5 text-xs text-[var(--color-error)] font-body">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';