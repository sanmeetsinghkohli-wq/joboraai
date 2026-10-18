import React from 'react';
import { clsx } from 'clsx';
import { Spinner } from './spinner';

export interface LoadingStateProps {
  message?: string;
  submessage?: string;
  className?: string;
}

export function LoadingState({
  message = 'Loading data...',
  submessage,
  className,
}: LoadingStateProps) {
  return (
    <div
      aria-live="polite"
      className={clsx(
        'flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-neutral-100 bg-white/60 min-h-[220px]',
        className
      )}
    >
      <Spinner size="lg" className="text-violet-600 mb-4" />
      <p className="text-sm font-medium text-neutral-800">{message}</p>
      {submessage && (
        <p className="text-xs text-neutral-500 mt-1 max-w-xs">{submessage}</p>
      )}
    </div>
  );
}
