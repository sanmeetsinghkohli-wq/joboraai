'use client';

import React from 'react';
import Link from 'next/link';
import { Line, FOCUS } from './shared';
import { useSectionStep } from '../scroll-state';
import { useStaticLayout } from '../use-render-tier';
import { StaticResume } from '../ResumeCss';

const STEPS = [
  ['Match score', 'See how your CV scores against the job description.'],
  ['Keyword gaps', 'What you have and what the role asks for.'],
  ['Rewritten bullets', 'AI suggestions you review as a diff before anything changes.'],
];

const ArrowChip = () => (
  <span className="w-8 h-8 rounded-full bg-[#FAF6F2] border border-[#EDE5E1] flex items-center justify-center text-[#2A1728] group-hover:bg-[#2A1728] group-hover:text-white transition-colors" aria-hidden="true">
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </span>
);

const CARDS: {
  href: string;
  title: string;
  body: string;
  wide?: boolean;
  icon: React.ReactNode;
}[] = [
  {
    href: '/jobs',
    title: 'AI Job Search',
    body: 'Discover roles that match your skills, interests, and career goals with hyper-personalized recommendations.',
    icon: (
      <>
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </>
    ),
  },
  {
    href: '/cv-studio',
    title: 'CV & Cover Letter Studio',
    body: 'Create tailored, professional applications optimized for ATS and specific job descriptions in minutes.',
    wide: true,
    icon: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" x2="8" y1="13" y2="13" />
        <line x1="16" x2="8" y1="17" y2="17" />
      </>
    ),
  },
  {
    href: '/email-composer',
    title: 'Apply with Your Email',
    body: 'Each application email opens in your own mail app, written and ready. Nothing goes out until you press send.',
    icon: (
      <>
        <rect height="16" rx="2" width="20" x="2" y="4" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </>
    ),
  },
  {
    href: '/applications',
    title: 'Application Tracker',
    body: 'Stay organized, monitor review statuses in real-time, and never miss an interview follow-up or reply.',
    icon: (
      <>
        <line x1="18" x2="18" y1="20" y2="10" />
        <line x1="12" x2="12" y1="20" y2="4" />
        <line x1="6" x2="6" y1="20" y2="14" />
      </>
    ),
  },
];

export function Features() {
  const isStatic = useStaticLayout();
  // The sticky track is 300vh of a ~370vh section, so the pinned part is ~54% of local progress.
  const step = useSectionStep('features', 3, 0.54);
  const active = isStatic ? -1 : Math.min(2, step);

  return (
    <section id="features" data-scroll-section="features" className="relative border-t border-[#EDE5E1] scroll-mt-20">
      <div className={isStatic ? 'py-20' : 'min-h-[300vh]'} data-features-track>
        <div className={isStatic ? '' : 'sticky top-0 min-h-screen flex items-center py-16 lg:py-20'}>
          <div className={`max-w-7xl mx-auto w-full px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-12 gap-10 ${isStatic ? '' : 'max-lg:pt-[48svh]'}`}>
            <div className="lg:col-span-6 space-y-8">
              <p className="text-xs font-semibold tracking-[0.14em] uppercase text-[#63555F]">Inside CV Studio</p>
              <h2 className="serif-title text-[clamp(2rem,4.6vw,3.5rem)] font-semibold leading-[1.06] tracking-[-0.02em] text-[#2A1728]">
                <Line i={0}>Your CV, read the way</Line>
                <Line i={1}>hiring software reads it.</Line>
              </h2>
              <ol className="space-y-3" data-feature-steps>
                {STEPS.map(([t, d], i) => {
                  const on = isStatic || i === active;
                  return (
                    <li
                      key={t}
                      data-step={i}
                      data-active={on}
                      className={`lp-step flex gap-4 rounded-2xl border p-4 backdrop-blur-sm transition-all duration-500 ${
                        on ? 'border-[#E05347]/60 bg-white/80 shadow-[0_0_40px_rgba(224,83,71,0.12)]' : 'border-[#EDE5E1] bg-white/40'
                      }`}
                    >
                      <span
                        className={`serif-title text-2xl leading-none w-8 shrink-0 ${on ? 'text-[#E05347]' : 'text-[#63555F]'}`}
                        aria-hidden="true"
                      >
                        {i + 1}
                      </span>
                      <div>
                        <h3 className="text-base font-bold text-[#2A1728]">{t}</h3>
                        <p className="text-sm text-[#63555F] leading-relaxed mt-1">{d}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
            <div className="lg:col-span-6 flex justify-center">{isStatic && <StaticResume kind="layers" className="w-full max-w-sm" />}</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 pb-24 pt-8 relative z-10" data-features-bento>
        <div className="max-w-2xl mb-10">
          <h3 className="serif-title text-3xl sm:text-4xl font-semibold tracking-tight text-[#2A1728]">Everything you need to move forward</h3>
          <p className="mt-3 text-base sm:text-lg text-[#63555F]">
            From discovering opportunities to sending tailored applications, Jobora AI helps you at every step.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
          {CARDS.map((c) => (
            <Link
              key={c.title}
              href={c.href}
              className={`lp-card group flex flex-col justify-between rounded-2xl border border-[#EDE5E1] bg-white/70 backdrop-blur-xl p-7 transition-all duration-300 hover:border-[#E05347]/40 ${
                c.wide ? 'lg:col-span-2' : 'lg:col-span-1'
              } ${FOCUS}`}
            >
              <div>
                <div className="w-11 h-11 rounded-xl border border-[#EDE5E1] bg-[#FAF6F2] text-[#E05347] flex items-center justify-center mb-6" aria-hidden="true">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    {c.icon}
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-[#2A1728] mb-2">{c.title}</h4>
                <p className="text-sm text-[#63555F] leading-relaxed">{c.body}</p>
              </div>
              <div className="pt-6 flex justify-end">
                <ArrowChip />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;
