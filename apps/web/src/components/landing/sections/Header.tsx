'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowIcon, FOCUS } from './shared';

const NAV: { label: string; href: string; hash?: boolean }[] = [
  { label: 'Features', href: '#features', hash: true },
  { label: 'How It Works', href: '#how-it-works', hash: true },
  { label: 'Pricing', href: '#pricing', hash: true },
  { label: 'For Students', href: '/jobs' },
  { label: 'For Universities', href: '/career-insights' },
  { label: 'About', href: '/dashboard' },
];

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 bg-[#FAF6F2]/80 backdrop-blur-xl border-b border-[#EDE5E1]">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
        <Link aria-label="Jobora AI Home" className={`flex items-center gap-2.5 group rounded-full ${FOCUS}`} href="/">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E05347] via-[#942C52] to-[#2A1728] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <div className="w-3.5 h-3.5 rounded-full bg-[#FAF6F2]" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[#2A1728]">
            Jobora <span className="text-[#E05347]">AI</span>
          </span>
        </Link>
        <nav aria-label="Primary" className="hidden md:flex items-center gap-8 text-[15px] font-medium text-[#574B53]">
          {NAV.map((n) =>
            n.hash ? (
              <a key={n.label} className={`hover:text-[#E05347] transition-colors rounded ${FOCUS}`} href={n.href}>
                {n.label}
              </a>
            ) : (
              <Link key={n.label} className={`hover:text-[#E05347] transition-colors rounded ${FOCUS}`} href={n.href}>
                {n.label}
              </Link>
            )
          )}
        </nav>
        <div className="flex items-center gap-3 sm:gap-5">
          <Link
            className={`text-sm font-semibold text-[#2A1728] hover:text-[#E05347] transition-colors hidden sm:inline-block rounded ${FOCUS}`}
            href="/auth?tab=login"
          >
            Log in
          </Link>
          <Link
            className={`inline-flex items-center justify-center gap-2 bg-[#2A1728] hover:bg-[#3D223B] text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-all duration-200 hover:shadow-md ${FOCUS}`}
            href="/auth?tab=signup"
          >
            <span>Get started</span>
            <ArrowIcon />
          </Link>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className={`md:hidden p-2 rounded-lg text-[#2A1728] hover:bg-[#EDE5E1] transition-colors ${FOCUS}`}
            aria-label="Toggle mobile navigation"
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            <span className="material-symbols-outlined text-[24px]" aria-hidden="true">
              {open ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>
      {open && (
        <div
          id="mobile-nav"
          className="md:hidden border-t border-[#EDE5E1] bg-[#FAF6F2] px-6 py-4 flex flex-col gap-3 text-sm font-medium text-[#2A1728]"
        >
          {NAV.filter((n) => n.label !== 'About').map((n) =>
            n.hash ? (
              <a key={n.label} onClick={() => setOpen(false)} className={`py-1.5 hover:text-[#E05347] rounded ${FOCUS}`} href={n.href}>
                {n.label}
              </a>
            ) : (
              <Link key={n.label} onClick={() => setOpen(false)} className={`py-1.5 hover:text-[#E05347] rounded ${FOCUS}`} href={n.href}>
                {n.label}
              </Link>
            )
          )}
          <Link onClick={() => setOpen(false)} className={`py-1.5 hover:text-[#E05347] rounded ${FOCUS}`} href="/auth?tab=login">
            Log in
          </Link>
        </div>
      )}
    </header>
  );
}

export default Header;
