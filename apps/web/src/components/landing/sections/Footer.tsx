import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/logo';

const COLS: { title: string; links: { label: string; href: string; hash?: boolean }[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'AI Job Search', href: '/jobs' },
      { label: 'CV Studio', href: '/cv-studio' },
      { label: 'Email Dispatcher', href: '/email-composer' },
      { label: 'Interview Prep', href: '/interview' },
      { label: 'Pricing', href: '#pricing', hash: true },
    ],
  },
  {
    title: 'Solutions',
    links: [
      { label: 'For Students', href: '/onboarding' },
      { label: 'For Universities', href: '/career-insights' },
      { label: 'For Career Changers', href: '/career-insights' },
      { label: 'Enterprise', href: '/settings/integrations' },
    ],
  },
  {
    title: 'Legal & Help',
    links: [
      { label: 'Privacy Policy', href: '/settings' },
      { label: 'Terms of Service', href: '/settings' },
      { label: 'Security', href: '/settings/integrations' },
      { label: 'Contact Us', href: '/email-composer' },
    ],
  },
];

const LINK = 'hover:text-[#E05347] transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E05347]';

export function Footer() {
  return (
    <footer className="relative z-10 bg-[#FAF6F2] border-t border-[#EDE5E1] pt-16 pb-12 text-[#63555F]">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12">
          <div className="col-span-2 space-y-4">
            <Logo />
            <p className="text-sm max-w-sm">The AI-powered career copilot that matches your potential with opportunities worldwide.</p>
            <div className="pt-2 text-xs">© {new Date().getFullYear()} Jobora AI Inc. All rights reserved.</div>
          </div>
          {COLS.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#2A1728] mb-4">{c.title}</h3>
              <ul className="space-y-2.5 text-sm">
                {c.links.map((l) => (
                  <li key={l.label}>
                    {l.hash ? (
                      <a className={LINK} href={l.href}>
                        {l.label}
                      </a>
                    ) : (
                      <Link className={LINK} href={l.href}>
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="pt-8 border-t border-[#EDE5E1] flex items-center justify-end text-xs gap-4">
          <span>Designed with care for future leaders.</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
