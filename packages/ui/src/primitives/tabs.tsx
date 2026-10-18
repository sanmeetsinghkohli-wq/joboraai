import { clsx } from 'clsx';

export interface TabsProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}

export function Tabs({ value, onChange, className, children }: TabsProps) {
  return (
    <div className={clsx('flex flex-col sm:flex-row border-b border-cream-200', className)}>
      {children}
    </div>
  );
}

export interface TabsListProps {
  className?: string;
}

export function TabsList({ className }: TabsListProps) {
  return <div className={clsx('flex', className)} />;
}

export interface TabsTriggerProps {
  value: string;
  label: string;
  active: boolean;
  onClick: () => void;
  className?: string;
}

export function TabsTrigger({ value, label, active, onClick, className }: TabsTriggerProps) {
  return (
    <button
      value={value}
      onClick={onClick}
      className={clsx(
        'flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 -mb-px',
        active
          ? 'border-primary-500 text-primary-600 bg-primary-50/50'
          : 'border-transparent text-cream-500 hover:text-cream-700'
      )}
    >
      {label}
    </button>
  );
}

export interface TabsContentProps {
  value: string;
  active: boolean;
  children: React.ReactNode;
  className?: string;
}

export function TabsContent({ value, active, children, className }: TabsContentProps) {
  if (!active) return null;
  return <div className={clsx('w-full py-4', className)}>{children}</div>;
}
