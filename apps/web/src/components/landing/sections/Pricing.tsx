import React from 'react';
import Link from 'next/link';
import { CheckIcon, FOCUS, Line } from './shared';

type Plan = {
  id: string;
  name: string;
  price: string;
  per?: string;
  blurb: string;
  items: string[];
  cta: string;
  href: string;
  featured?: boolean;
};

// Everything is free while Jobora launches. Paid plans (Plus/Pro) arrive later as a subscription,
// so they are shown as "Coming soon" with no price and no sign-up link.
const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    per: 'during launch',
    blurb: 'Every feature is free while we launch.',
    items: ['AI job search and matching', 'CV and cover letter studio', 'Send applications from your own email', 'Application tracker'],
    cta: 'Get started free',
    href: '/auth?tab=signup',
    featured: true,
  },
  {
    id: 'plus',
    name: 'Plus',
    price: 'Coming soon',
    blurb: 'Higher limits for daily applications.',
    items: ['Everything in Free', 'More AI usage', 'Priority features'],
    cta: 'Coming soon',
    href: '',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'Coming soon',
    blurb: 'For intensive job searches.',
    items: ['Everything in Plus', 'Advanced insights'],
    cta: 'Coming soon',
    href: '',
  },
];

export function Pricing() {
  return (
    <section id="pricing" data-scroll-section="pricing" className="relative min-h-[160vh] border-t border-[#EDE5E1] scroll-mt-20">
      <div className="sticky top-0 min-h-screen flex items-center py-20">
        <div className="max-w-7xl mx-auto w-full px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left column on desktop: heading, with the fixed resume settling flat and glowing right below it. */}
          <div className="lg:col-span-4 text-center lg:text-left lg:self-start lg:pt-6" data-pricing-heading>
            <h2 className="serif-title text-[clamp(2rem,4.6vw,3.5rem)] font-semibold leading-[1.06] tracking-[-0.02em] text-[#2A1728]">
              <Line i={0}>Free while we</Line>
              <Line i={1}>launch.</Line>
            </h2>
            <p className="mt-4 text-base text-[#63555F]">Use everything for free today. Paid plans come later, and we will tell you first.</p>
          </div>
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-5 items-stretch" data-plus-anchor-parent>
            {PLANS.map((p) => (
              <div
                key={p.id}
                data-plan={p.id}
                className={`relative flex flex-col justify-between rounded-2xl bg-white/70 backdrop-blur-xl p-6 lg:p-6 xl:p-7 transition-transform ${
                  p.featured
                    ? 'border-2 border-[#E05347] md:-translate-y-6 shadow-[0_0_60px_rgba(224,83,71,0.18)]'
                    : 'border border-[#EDE5E1]'
                }`}
              >
                {p.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#C94136] text-white text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full">
                    Free today
                  </span>
                )}
                <div>
                  <h3 className="text-lg font-bold text-[#2A1728]">{p.name}</h3>
                  <div className="mt-3 flex items-baseline">
                    <span className={`serif-title font-semibold text-[#2A1728] ${p.href ? 'text-5xl' : 'text-3xl'}`}>{p.price}</span>
                    {p.per && <span className="text-xs text-[#63555F] ml-1">{p.per}</span>}
                  </div>
                  <p className="text-sm text-[#63555F] mt-1">{p.blurb}</p>
                  <ul className="mt-5 space-y-2.5 text-sm text-[#2A1728]">
                    {p.items.map((it) => (
                      <li key={it} className="flex items-center gap-2">
                        <CheckIcon className={`w-4 h-4 ${p.featured ? 'text-[#E05347]' : 'text-[#2A1728]'}`} />
                        {it}
                      </li>
                    ))}
                  </ul>
                </div>
                {p.href ? (
                  <Link
                    href={p.href}
                    className={`mt-8 w-full py-2.5 rounded-full text-sm font-bold text-center transition-colors ${FOCUS} bg-[#2A1728] text-white hover:bg-[#3D223B]`}
                  >
                    {p.cta}
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    className="mt-8 w-full py-2.5 rounded-full text-sm font-bold text-center border border-[#EDE5E1] text-[#63555F] cursor-default"
                  >
                    {p.cta}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Pricing;
