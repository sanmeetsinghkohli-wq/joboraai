import { clsx } from 'clsx';
import { NavLink } from '../primitives/navlink';
import { Icon, IconNames } from '../primitives/icons';
import type { NavigationItem } from '@jobora/types';

const NAV_ITEMS: Array<{ label: string; href: string; icon: IconNames; badge?: number }> = [
  { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
  { label: 'Job Discovery', href: '/jobs', icon: 'search' },
  { label: 'CV Studio', href: '/cv-studio', icon: 'document' },
  { label: 'Applications', href: '/applications', icon: 'clipboard-list' },
  { label: 'Interview Prep', href: '/interview', icon: 'mic' },
  { label: 'Career Insights', href: '/career-insights', icon: 'target' },
  { label: 'AI Assistant', href: '/ai-assistant', icon: 'bot' },
  { label: 'Document Vault', href: '/documents', icon: 'upload-cloud' },
  { label: 'Settings', href: '/settings', icon: 'settings' },
];

export interface SidebarProps {
  open: boolean;
  onClose: () => void;
  activePath?: string;
  darkMode?: boolean;
  navItemClassName?: string;
  userName?: string;
  userEmail?: string;
}

export function Sidebar({
  open,
  onClose,
  activePath,
  darkMode = false,
  navItemClassName,
  userName = 'Job Seeker',
  userEmail = '',
}: SidebarProps) {
  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-charcoal/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={clsx(
          'fixed top-0 left-0 z-40 h-full w-64 border-r border-[#E7E1E4] bg-[#F8F5F0]/95 backdrop-blur-md transition-transform duration-300 ease-in-out flex flex-col',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          darkMode ? 'bg-neutral-900 border-neutral-800 text-neutral-100' : 'text-charcoal'
        )}
      >
        <div className="flex items-center justify-between h-16 px-5 border-b border-[#E7E1E4]">
          <a href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-sm">
              <Icon name="briefcase-finder" size={20} />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-charcoal flex items-center gap-1.5">
                Jobora <span className="text-xs px-1.5 py-0.5 rounded bg-violet-100 text-violet-800 font-semibold tracking-normal">AI</span>
              </span>
            </div>
          </a>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-neutral-200 text-neutral-500"
            aria-label="Close sidebar"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <nav className="p-3 space-y-1 overflow-y-auto flex-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              label={item.label}
              href={item.href}
              icon={item.icon}
              active={activePath === item.href || (item.href !== '/dashboard' && activePath?.startsWith(item.href))}
              className={navItemClassName}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-[#E7E1E4] bg-white/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-sm shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-charcoal truncate">{userName}</p>
              <p className="text-xs text-neutral-500 truncate">{userEmail || 'verified candidate'}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
