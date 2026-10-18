'use client';
import { useState, useCallback } from 'react';
import { clsx } from 'clsx';
import { Icon, IconNames } from './icons';

export interface FileUploadProps {
  acceptedTypes?: string[];
  maxSizeMB?: number;
  multiple?: boolean;
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
  dropZoneClassName?: string;
}

export function FileUpload({
  acceptedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  maxSizeMB = 10,
  multiple = false,
  onFilesSelected,
  disabled = false,
  className,
  label,
  dropZoneClassName,
}: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      acceptedTypes.includes(f.type) && f.size <= maxSizeMB * 1024 * 1024
    );
    if (files.length > 0) {
      onFilesSelected(files);
    }
  }, [acceptedTypes, maxSizeMB, onFilesSelected]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter((f) => acceptedTypes.includes(f.type) && f.size <= maxSizeMB * 1024 * 1024);
    if (valid.length > 0) {
      onFilesSelected(valid);
    }
  }, [acceptedTypes, maxSizeMB, onFilesSelected]);

  return (
    <div
      className={clsx(
        'relative rounded-xl border-2 border-dashed transition-all duration-200',
        dragOver
          ? 'border-primary-400 bg-primary-50/50'
          : 'border-cream-300 hover:border-cream-400 bg-cream-50/30',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="file-upload"
        multiple={multiple}
        accept={acceptedTypes.join(',')}
        disabled={disabled}
        className="sr-only"
        onChange={handleInputChange}
      />
      <label
        htmlFor="file-upload"
        className={clsx(
          'flex flex-col items-center justify-center h-40 sm:h-48 p-6 text-center cursor-pointer',
          'transition-colors duration-200',
          disabled ? 'cursor-not-allowed' : 'cursor-pointer',
          dropZoneClassName
        )}
      >
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-cream-100 mb-3">
          <Icon name="upload" size={22} className="text-cream-500" />
        </div>
        <p className="text-sm font-medium text-cream-700">
          {label || 'Drag & drop your CV here, or click to browse'}
        </p>
        <p className="text-xs text-cream-400 mt-1">
          {acceptedTypes.map((t) => t.split('/')[1]).join(', ')} files up to {maxSizeMB}MB
        </p>
        {dragOver && (
          <p className="text-xs text-primary-600 mt-1 font-medium">Drop your files here</p>
        )}
      </label>
      <div className="absolute bottom-2 right-2 flex items-center gap-2 text-xs text-cream-400">
        <Icon name="info" size={12} />
        <span>Click to browse</span>
      </div>
    </div>
  );
}
