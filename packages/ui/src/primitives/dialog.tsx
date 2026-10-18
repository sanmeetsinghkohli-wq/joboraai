'use client';
import { useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { Icon, IconNames } from './icons';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showClose?: boolean;
  ariaLabel?: string;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  showClose = true,
  ariaLabel,
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-label={ariaLabel || title}
    >
      <div
        ref={dialogRef}
        className={clsx(
          'modal-backdrop bg-white rounded-xl shadow-2xl border border-cream-200 w-full',
          sizeClasses[size]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {showClose && (
          <div className="flex items-center justify-between p-4 border-b border-cream-200">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-cream-900">{title}</h2>
              {description && <p className="mt-1 text-sm text-cream-500">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="text-cream-400 hover:text-cream-600 transition-colors p-1 rounded-full hover:bg-cream-100"
              aria-label="Close"
            >
              <Icon name="close" size={18} />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
        {footer && (
          <div className="px-6 pb-6 pt-2 border-t border-cream-200 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogContent({ children, className }: DialogContentProps) {
  return <div className={clsx('px-6 pb-6 pt-2', className)}>{children}</div>;
}

export interface DialogHeaderProps {
  title: string;
  description?: string;
  onClose?: () => void;
}

export function DialogHeader({ title, description, onClose }: DialogHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-3">
      <div>
        <h2 className="text-xl font-bold text-cream-900">{title}</h2>
        {description && <p className="mt-1 text-sm text-cream-500">{description}</p>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-cream-400 hover:text-cream-600 transition-colors p-1 rounded-full hover:bg-cream-100"
          aria-label="Close"
        >
          <Icon name="close" size={18} />
        </button>
      )}
    </div>
  );
}

export interface DialogBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogBody({ children, className }: DialogBodyProps) {
  return <div className={clsx('px-6 pb-2', className)}>{children}</div>;
}

export interface DialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogFooter({ children, className }: DialogFooterProps) {
  return <div className={clsx('flex justify-end gap-3 border-t border-cream-200 pt-4 px-6', className)}>{children}</div>;
}

export interface DialogCloseProps {
  onClick: () => void;
  className?: string;
}

export function DialogClose({ onClick, className }: DialogCloseProps) {
  return (
    <button
      onClick={onClick}
      className={clsx('text-cream-400 hover:text-cream-600 transition-colors p-1 rounded-full hover:bg-cream-100', className)}
      aria-label="Close"
    >
      <Icon name="close" size={18} />
    </button>
  );
}
