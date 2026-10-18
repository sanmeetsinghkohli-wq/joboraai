import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { clsx } from 'clsx';

export type InputSize = 'sm' | 'md' | 'lg';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  size?: InputSize;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const textareaId = id || (label ? `textarea-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-cream-700 mb-1"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={clsx(
            'w-full min-h-[100px] px-3 py-2 rounded-lg border border-cream-200 bg-white text-sm text-cream-900 placeholder-cream-400',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200',
            error && 'border-error-300 focus:ring-error-500 focus:border-error-400',
            !error && 'hover:border-cream-300',
            className
          )}
          {...props}
        />
        {helperText && !error && <p className="mt-1 text-xs text-cream-400">{helperText}</p>}
        {error && <p className="mt-1 text-xs text-error-600">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
