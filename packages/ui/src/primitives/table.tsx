import { clsx } from 'clsx';

export interface TableProps {
  className?: string;
  children: React.ReactNode;
}

export function Table({ className, children }: TableProps) {
  return <div className={clsx('w-full overflow-x-auto', className)}><table className="w-full">{children}</table></div>;
}

export interface TableHeaderProps {
  className?: string;
  children: React.ReactNode;
}

export function TableHeader({ className, children }: TableHeaderProps) {
  return <thead className={clsx('bg-cream-50', className)}>{children}</thead>;
}

export interface TableRowProps {
  className?: string;
  children: React.ReactNode;
  hover?: boolean;
}

export function TableRow({ className, children, hover = true }: TableRowProps) {
  return (
    <tr
      className={clsx(
        'transition-colors duration-150',
        hover && 'hover:bg-cream-50/80',
        className
      )}
    >
      {children}
    </tr>
  );
}

export interface TableHeadProps {
  className?: string;
  children: React.ReactNode;
}

export function TableHead({ className, children }: TableHeadProps) {
  return <th className={clsx('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider', 'text-cream-500', className)}>{children}</th>;
}

export interface TableBodyProps {
  className?: string;
  children: React.ReactNode;
}

export function TableBody({ className, children }: TableBodyProps) {
  return <tbody className={clsx('divide-y divide-cream-100', className)}>{children}</tbody>;
}

export interface TableCellProps {
  className?: string;
  children: React.ReactNode;
}

export function TableCell({ className, children }: TableCellProps) {
  return <td className={clsx('px-4 py-3 text-sm text-cream-700', className)}>{children}</td>;
}
