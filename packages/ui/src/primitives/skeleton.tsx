import { clsx } from 'clsx';

export interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: boolean;
}

export function Skeleton({ className, width, height, rounded = true }: SkeletonProps) {
  return (
    <div
      className={clsx(
        'animate-pulse bg-cream-200 rounded',
        rounded && 'rounded-full',
        width && `w-${width}`,
        height && `h-${height}`,
        className
      )}
    />
  );
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={clsx('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? 'full' : 'auto'} className="h-3" />
      ))}
    </div>
  );
}

export function SkeletonButton({ className }: { className?: string }) {
  return <Skeleton className={clsx('h-10 rounded-lg', className)} width="full" />;
}
