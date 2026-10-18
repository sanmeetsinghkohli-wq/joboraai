import { clsx } from 'clsx';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export function Spinner({ size = 'md', className, label }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div
      className={clsx('flex items-center justify-center', className)}
      role="status"
      aria-live="polite"
    >
      <svg
        className={clsx('animate-spin', sizeClasses[size], 'text-primary-600')}
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {label && (
        <span className="sr-only">{label}</span>
      )}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-cream-50">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 rounded-full border-4 border-cream-200 border-t-primary-600 animate-spin" />
        <p className="mt-3 text-sm text-cream-500">Loading...</p>
      </div>
    </div>
  );
}
