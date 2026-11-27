'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { ArrowIcon, FOCUS } from './shared';

const NAV: { label: string; href: string; hash?: boolean }[] = [
  { label: 'Features', href: '/#features', hash: true },
  { label: 'How It Works', href: '/#how-it-works', hash: true },
  { label: 'Free CV check', href: '/cv-check' },
  { label: 'Pricing', href: '/#pricing', hash: true },
  { label: 'For Students', href: '/students' },
  { label: 'For Universities', href: '/universities' },
  { label: 'Contact', href: '/contact' },
];

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 bg-[#FAF6F2]/80 backdrop-blur-xl border-b border-[#EDE5E1]">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
        <Link aria-label="Jobora AI Home" className={`flex items-center gap-2.5 group rounded-full ${FOCUS}`} href="/">
          <Logo className="transition-transform group-hover:scale-[1.03] [&_svg]:h-9 [&_svg]:w-9" />
        </Link>
        <nav aria-label="Primary" className="hidden xl:flex items-center gap-6 2xl:gap-8 whitespace-nowrap text-[15px] font-medium text-[#574B53]">
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
            className={`text-sm font-semibold whitespace-nowrap text-[#2A1728] hover:text-[#E05347] transition-colors hidden sm:inline-block rounded ${FOCUS}`}
            href="/auth?tab=login"
          >
            Log in
          </Link>
          <Link
            className={`inline-flex items-center justify-center gap-2 whitespace-nowrap bg-[#2A1728] hover:bg-[#3D223B] text-white text-sm font-semibold px-4 sm:px-5 py-2.5 rounded-full transition-all duration-200 hover:shadow-md ${FOCUS}`}
            href="/auth?tab=signup"
          >
            <span>Get started</span>
            <span className="hidden sm:inline-flex"><ArrowIcon /></span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className={`xl:hidden p-2 rounded-lg text-[#2A1728] hover:bg-[#EDE5E1] transition-colors ${FOCUS}`}
            aria-label="Toggle mobile navigation"
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            {open ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
          </button>
        </div>
      </div>
      {open && (
        <div
          id="mobile-nav"
          className="xl:hidden border-t border-[#EDE5E1] bg-[#FAF6F2] px-6 py-4 flex flex-col gap-3 text-sm font-medium text-[#2A1728]"
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
