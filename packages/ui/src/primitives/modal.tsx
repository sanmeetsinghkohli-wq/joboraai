'use client';
import { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { Icon, IconNames } from './icons';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  showClose?: boolean;
  ariaLabel?: string;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  showClose = true,
  ariaLabel,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  if (!open) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-5xl',
    full: 'max-w-7xl',
  };

  return (
    <dialog
      ref={dialogRef}
      className="modal-backdrop bg-black/50 min-h-screen flex items-center justify-center p-4"
      onClose={onClose}
      aria-label={ariaLabel || title}
    >
      <div
        className={clsx(
          'modal-content bg-white rounded-xl shadow-2xl border border-cream-200 w-full',
          sizeClasses[size]
        )}
      >
        {showClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-cream-400 hover:text-cream-600 transition-colors p-1 rounded-full hover:bg-cream-100"
            aria-label="Close modal"
          >
            <Icon name="close" size={18} />
          </button>
        )}

        <div className="pt-6 pb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-cream-900">{title}</h2>
          {description && <p className="mt-2 text-sm text-cream-500">{description}</p>}
        </div>

        <div className="px-6 pb-6 pt-2">{children}</div>

        {footer && (
          <div className="px-6 pb-6 pt-2 border-t border-cream-200 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </dialog>
  );
}

export interface ModalContentProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalContent({ children, className }: ModalContentProps) {
  return <div className={clsx('pt-6 pb-4 px-6', className)}>{children}</div>;
}

export interface ModalHeaderProps {
  title: string;
  description?: string;
  onClose?: () => void;
}

export function ModalHeader({ title, description, onClose }: ModalHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-2">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-cream-900">{title}</h2>
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

export interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalBody({ children, className }: ModalBodyProps) {
  return <div className={clsx('px-6 pb-2', className)}>{children}</div>;
}

export interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return <div className={clsx('flex justify-end gap-3 border-t border-cream-200 pt-4 px-6', className)}>{children}</div>;
}

export interface ModalCloseProps {
  onClick: () => void;
  className?: string;
}

export function ModalClose({ onClick, className }: ModalCloseProps) {
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
