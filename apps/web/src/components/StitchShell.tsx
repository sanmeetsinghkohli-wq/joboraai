'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppData } from '@/context/AppDataContext';

export interface StitchShellProps {
  children: React.ReactNode;
  activeNav?: string;
}

export function StitchShell({ children, activeNav }: StitchShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, activities, jobs, loadingJobs } = useAppData();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const displayName =
    profile.firstName ||
    profile.fullName ||
    (profile.email ? profile.email.split('@')[0] : 'Profile Setup');

  // Transparent readiness calculation based on actual profile completion + ATS score
  const profileChecks = [
    Boolean(profile.firstName || profile.fullName),
    Boolean(profile.email),
    Boolean(profile.targetRole),
    profile.skills.length > 0,
    Boolean(profile.resumeFileName),
  ];
  const completedCount = profileChecks.filter(Boolean).length;
  const compatibilityScore =
    profile.atsScore > 0
      ? profile.atsScore
      : completedCount > 0
      ? Math.round((completedCount / profileChecks.length) * 100)
      : jobs.length > 0
      ? 20
      : 0;

  const navHome = [
    { id: 'dashboard', legacyId: 'home-dashboard', label: 'Dashboard', icon: 'dashboard', href: '/dashboard' },
  ];

  const navFindJobs = [
    { id: 'jobs', legacyId: 'job-search', label: 'Find Jobs', icon: 'travel_explore', href: '/jobs' },
    { id: 'saved-jobs', legacyId: 'saved-jobs', label: 'Saved Jobs', icon: 'bookmark_border', href: '/saved-jobs' },
    { id: 'applications', legacyId: 'applications', label: 'Applications', icon: 'send', href: '/applications' },
  ];

  const navStudio = [
    { id: 'cv-studio', legacyId: 'cv-studio', label: 'CV Studio', icon: 'description', href: '/cv-studio' },
    { id: 'cover-letters', legacyId: 'cover-letters', label: 'Cover Letters', icon: 'history_edu', href: '/cover-letters' },
    { id: 'interview', legacyId: 'interview-prep', label: 'Interview Prep', icon: 'psychology_alt', href: '/interview' },
    { id: 'career-insights', legacyId: 'career-insights', label: 'Career Insights', icon: 'insights', href: '/career-insights' },
  ];

  const navCopilot = [
    { id: 'ai-copilot', legacyId: 'ai-copilot', label: 'AI Copilot', icon: 'auto_awesome', href: '/ai-copilot' },
  ];

  const navWorkspace = [
    { id: 'documents', legacyId: 'documents', label: 'Documents', icon: 'folder_open', href: '/documents' },
    { id: 'notifications', legacyId: 'notifications', label: 'Notifications', icon: 'notifications_none', href: '/notifications' },
    { id: 'integrations', legacyId: 'email-integrations', label: 'Integrations', icon: 'mark_email_unread', href: '/settings/integrations' },
    { id: 'settings', legacyId: 'settings', label: 'Settings', icon: 'tune', href: '/settings' },
  ];

  const navSections = [
    { title: 'Home', items: navHome },
    { title: 'Find Jobs', items: navFindJobs },
    { title: 'Career Studio', items: navStudio },
    { title: 'AI Copilot', items: navCopilot },
    { title: 'Workspace', items: navWorkspace },
  ];

  const isActive = (item: { id: string; legacyId?: string; href: string }) => {
    if (activeNav) {
      if (activeNav === item.id || activeNav === item.legacyId) return true;
    }
    if (pathname === item.href) return true;
    if (
      item.href !== '/dashboard' &&
      item.href !== '/settings' &&
      item.href !== '/applications' &&
      pathname?.startsWith(item.href)
    ) {
      return true;
    }
    return false;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/jobs?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const input = document.getElementById('global-search-input');
        input?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="bg-[#F8F5F0] font-body-md text-[#1D1A21] antialiased min-h-screen">
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-[#351B32]/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-[#FAF6F2] border-r border-[#EDE5E1] shadow-[0_1px_8px_rgba(53,27,50,0.03)] z-50 flex flex-col justify-between transition-transform duration-200 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        aria-label="Sidebar Navigation"
      >
        <div className="flex flex-col flex-1 overflow-y-auto px-4 py-5 space-y-4">
          <div className="flex items-center justify-between px-2 mb-1">
            <Link href="/" className="flex items-center gap-3 group">
              <img
                alt="Jobora AI Logo"
                className="h-8 w-auto object-contain group-hover:scale-105 transition-transform"
                src="https://lh3.googleusercontent.com/aida/AEtjO1UD0RQDL23COD4vvkGvPgLL6-sKCmE1485hqPsHnMByfJU_YPd5JVBuq57MN8vjXkzWM6OFUNV_3WdbRTnaM1HOMTHwFPN3hJwxRwUO_TKEOVc7VgH4u-1Pjby7L2fUY6iZdfWKut8N34Zo2Yw4qCZkL1GR58Rc8JI6Z4E4mvvmI8eozNUZ6iTwct8Gn7RrZCi2a6p1NR7ZPYgZSR-xXQ5FrJpJdOslDRrneh1HrFFC80iyRE253aFPAg"
              />
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-[#351B32] font-bold tracking-tight">Jobora AI</span>
                <span className="font-caption-caps text-[10px] text-[#7D747D] uppercase tracking-wider">Career Copilot</span>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high focus-ring"
              aria-label="Close navigation menu"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* 5-Pillar Goal-Oriented Navigation Hierarchy */}
          <div className="space-y-4">
            {navSections.map((section) => (
              <div key={section.title}>
                <div className="px-3 pb-1 flex items-center justify-between">
                  <span className="font-caption-caps text-[10.5px] text-[#8A7F88] uppercase tracking-wider font-bold">
                    {section.title}
                  </span>
                </div>
                <nav className="flex flex-col gap-0.5">
                  {section.items.map((item) => {
                    const active = isActive(item);
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        aria-current={active ? 'page' : undefined}
                        className={
                          active
                            ? 'flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-all duration-150 bg-[#351B32] text-white font-bold shadow-xs relative'
                            : 'flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-[#574B53] font-medium text-[13.5px] hover:bg-[#F3EBE3] hover:text-[#1D1A21] transition-all duration-150'
                        }
                        data-path={item.id}
                      >
                        <span className={`material-symbols-outlined text-[19px] ${active ? 'text-[#E76F72]' : 'text-[#7D747D]'}`}>
                          {item.icon}
                        </span>
                        <span className="text-[13px]">{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>
        </div>

        {/* Profile Readiness Sync Footer Tile */}
        <div className="p-3.5 mx-3 mb-4 rounded-2xl bg-white border border-[#EDE5E1] shadow-[0_2px_8px_-2px_rgba(53,27,50,0.04)] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-primary font-bold">Profile Readiness</span>
            <span className="font-caption-caps text-[10px] text-on-tertiary-container bg-tertiary-fixed px-2 py-0.5 rounded-full font-semibold">
              Live
            </span>
          </div>
          <div className="w-full bg-[#EDE5E1] rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-secondary h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${compatibilityScore}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-on-surface-variant font-caption-caps text-[11px]">
            <span>{compatibilityScore}% synced</span>
            <Link href="/onboarding" className="text-secondary hover:underline font-bold">
              Optimize
            </Link>
          </div>
        </div>
      </aside>
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(53,27,50,0.04)] z-30 px-4 lg:px-gutter flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-lg">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high"
              aria-label="Open navigation menu"
            >
              <span className="material-symbols-outlined text-[22px]">menu</span>
            </button>
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative flex items-center bg-white rounded-xl border border-[#EDE5E1] shadow-[0_2px_8px_-2px_rgba(53,27,50,0.04)] px-3 py-1.5 focus-within:ring-2 focus-within:ring-[#E76F72]/30 focus-within:border-[#E76F72] transition-all">
                <span className="material-symbols-outlined text-on-surface-variant mr-2 text-[20px]">search</span>
                <input
                  id="global-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent font-body-sm text-body-sm text-[#1D1A21] placeholder-on-surface-variant focus:outline-none"
                  placeholder={
                    loadingJobs
                      ? 'Search live jobs, companies or keywords...'
                      : jobs.length > 0
                      ? `Search ${jobs.length} live jobs, companies or keywords...`
                      : 'Search jobs, companies or keywords...'
                  }
                  aria-label="Search jobs, companies or keywords"
                  type="text"
                />
                <kbd className="hidden sm:inline-block font-caption-caps text-[11px] bg-[#F3EBE3] text-on-surface-variant px-1.5 py-0.5 rounded ml-2 whitespace-nowrap">⌘K</kbd>
              </div>
            </form>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
              type="button"
              aria-label="Toggle notifications"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              {activities.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-secondary rounded-full ring-2 ring-surface"></span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute top-12 right-0 sm:right-24 w-80 bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/30 p-4 z-50">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-label-md text-label-md text-primary font-bold">Notifications</span>
                  <span className="font-caption-caps text-caption-caps text-secondary">
                    {activities.length} events
                  </span>
                </div>
                <div className="space-y-2.5 text-left max-h-60 overflow-y-auto">
                  {activities.length === 0 ? (
                    <div className="font-body-sm text-body-sm text-on-surface-variant py-3 text-center">
                      No new activity yet. Upload your CV or explore live jobs.
                    </div>
                  ) : (
                    activities.slice(0, 5).map((act) => (
                      <div key={act.id} className="p-2.5 rounded-xl bg-surface-container-low">
                        <div className="font-label-sm text-label-sm text-primary font-bold">{act.title}</div>
                        <div className="font-caption-caps text-caption-caps text-on-surface-variant mt-0.5">
                          {act.subtitle} • {act.timestamp}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            <Link
              href="/career-insights"
              aria-label="Career insights and methodology"
              className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[22px]">help_outline</span>
            </Link>
            <div className="h-6 w-px bg-surface-container-highest mx-1"></div>
            <Link
              href="/onboarding"
              className="flex items-center gap-3 pl-1 pr-2 py-1 rounded-xl hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-label-md text-label-md font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-tertiary-fixed-dim rounded-full ring-2 ring-surface"></span>
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="font-label-md text-label-md text-on-surface leading-tight">{displayName}</span>
                <span className="font-caption-caps text-caption-caps text-on-surface-variant leading-tight">
                  {profile.targetRole || 'Job Seeking • Active'}
                </span>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">expand_more</span>
            </Link>
          </div>
        </header>
        <main className="w-full pt-16 bg-surface min-h-screen px-4 sm:px-gutter pb-space-xl">{children}</main>
      </div>
    </div>
  );
}
