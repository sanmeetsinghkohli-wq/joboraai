'use client';

import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { Icon } from '../primitives/icons';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id?: string;
  type?: ToastType;
  title: string;
  description?: string;
  duration?: number;
  onClose?: () => void;
  className?: string;
}

export function Toast({
  type = 'info',
  title,
  description,
  onClose,
  className,
}: ToastProps) {
  const iconMap: Record<ToastType, 'check' | 'alert-triangle' | 'info' | 'close'> = {
    success: 'check',
    error: 'close',
    warning: 'alert-triangle',
    info: 'info',
  };

  const colorStyles: Record<ToastType, string> = {
    success: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    error: 'bg-rose-50 text-rose-900 border-rose-200',
    warning: 'bg-amber-50 text-amber-900 border-amber-200',
    info: 'bg-violet-50 text-violet-900 border-violet-200',
  };

  return (
    <div
      role="status"
      className={clsx(
        'flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all animate-slide-up max-w-md w-full',
        colorStyles[type],
        className
      )}
    >
      <div className="flex-shrink-0 mt-0.5">
        <Icon name={iconMap[type]} size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        {description && <p className="text-xs mt-1 opacity-90 leading-relaxed">{description}</p>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          type="button"
          aria-label="Close notification"
          className="flex-shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity p-0.5 rounded"
        >
          <Icon name="close" size={14} />
        </button>
      )}
    </div>
  );
}

export function ToastViewport({ children }: { children: ReactNode }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none [&>*]:pointer-events-auto">
      {children}
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
