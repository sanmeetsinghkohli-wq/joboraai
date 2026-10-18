import { forwardRef, type InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  size?: InputSize;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, size = 'md', ...props }, ref) => {
    const inputId = id || (label ? `input-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);

    const sizeClasses = {
      sm: 'h-8 px-2.5 text-xs',
      md: 'h-10 px-3 text-sm',
      lg: 'h-12 px-4 text-base',
    }[size];

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'w-full rounded-lg border border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400',
            'focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200',
            sizeClasses,
            error && 'border-rose-400 focus:ring-rose-500 focus:border-rose-400 focus:bg-rose-50/20',
            !error && 'hover:border-neutral-300',
            className
          )}
          {...props}
        />
        {helperText && !error && <p className="mt-1 text-xs text-neutral-500">{helperText}</p>}
        {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
