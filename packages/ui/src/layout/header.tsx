'use client';
import { useState } from 'react';
import { clsx } from 'clsx';
import { Icon, IconNames } from '../primitives/icons';
import { Button, ButtonProps } from '../primitives/button';
import { Badge } from '../primitives/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../primitives/dropdownmenu';

export interface HeaderProps {
  darkMode?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  notifications?: { count: number };
  onNotificationsClick?: () => void;
  onMenuClick?: () => void;
}

export function Header({
  darkMode = false,
  searchQuery,
  onSearchChange,
  notifications = { count: 0 },
  onNotificationsClick,
  onMenuClick,
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      className={clsx(
        'sticky top-0 z-40 border-b border-cream-200/60 bg-white/80 backdrop-blur-md',
        darkMode && 'bg-cream-900/80 border-cream-700/60'
      )}
    >
      <div className="flex items-center justify-between h-16 sm:h-18 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-cream-100 text-cream-500"
            aria-label="Open menu"
          >
            <Icon name="menu" size={22} />
          </button>

          <div className="flex items-center gap-2">
            <div
              className={clsx(
                'w-9 h-9 rounded-lg flex items-center justify-center',
                darkMode ? 'bg-primary-900 text-primary-300' : 'bg-primary-100 text-primary-600'
              )}
            >
              <Icon name="briefcase-finder" size={20} />
            </div>
            <span className={clsx('text-lg font-bold tracking-tight', darkMode ? 'text-cream-100' : 'text-cream-900')}>
              Jobora
            </span>
          </div>
        </div>

        <div className="flex-1 max-w-md ml-4 hidden sm:block">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon name="search" size={16} className="text-cream-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search jobs, CV, applications..."
              className={clsx(
                'w-full pl-10 pr-4 h-9 rounded-lg border border-cream-200 bg-cream-50 text-sm text-cream-900',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all duration-200',
                darkMode && 'border-cream-600 bg-cream-800 text-cream-100 placeholder-cream-400'
              )}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onNotificationsClick}
            className={clsx(
              'relative p-2 rounded-lg hover:bg-cream-100 transition-colors text-cream-500',
              darkMode && 'hover:bg-cream-800 text-cream-400'
            )}
            aria-label="Notifications"
          >
            <Icon name="bell" size={20} />
            {notifications.count > 0 && (
              <Badge
                variant="error"
                size="sm"
                className="absolute top-1 right-1"
              >
                {notifications.count}
              </Badge>
            )}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger as="button" className="p-1.5 rounded-lg hover:bg-cream-100 text-cream-500">
              <Icon name="avatar" size={20} />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <Icon name="user" size={16} />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Icon name="settings" size={16} />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Icon name="logout" size={16} />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
