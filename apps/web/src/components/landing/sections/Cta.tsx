'use client';

import React from 'react';
import { useStaticLayout } from '../use-render-tier';
import Link from 'next/link';
import { ArrowIcon, FOCUS_DARK, Line } from './shared';

// TODO(owner): "Contact sales" previously pointed at /email-composer (the in-app email tool), which is
// the wrong destination. There is no sales inbox or contact page in the repo, so it links to pricing
// until a real address or page exists. Replace this constant, e.g. 'mailto:sales@<your-domain>'.
export const CONTACT_SALES_HREF = '/contact';

export function Cta() {
  // In the webgl/css tiers the plum backdrop is painted by ResumeStage (behind the fixed resume layer,
  // clipped to this section) so the paper plane stays visible. Only the static tier paints its own.
  const isStatic = useStaticLayout();
  return (
    <section
      id="cta"
      data-scroll-section="cta"
      className={`relative text-white ${isStatic ? 'bg-gradient-to-br from-[#2A1728] via-[#331C30] to-[#2A1728]' : 'min-h-[220vh]'}`}
    >
      <div className={`flex items-center overflow-hidden py-16 lg:py-20 ${isStatic ? 'relative' : 'sticky top-0 min-h-screen'}`}>
        {isStatic && (
          <div className="absolute -right-24 -bottom-24 w-[28rem] h-[28rem] bg-[#E05347]/20 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
        )}
        <div className="max-w-7xl mx-auto w-full px-6 lg:px-10 relative z-10">
          <div className="lg:max-w-[50%] space-y-8">
            <h2 className="serif-title text-[clamp(2.25rem,5.5vw,4.25rem)] font-semibold leading-[1.04] tracking-[-0.02em]">
              <Line i={0}>Ready to make</Line>
              <Line i={1} className="italic text-[#F7CEBA]">
                your next move?
              </Line>
            </h2>
            <p className="text-base sm:text-lg text-[#EDE5E1] max-w-xl">
              Set your preferences, tailor your first CV and send it from your own inbox. Free to start.
            </p>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Link
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#C94136] hover:bg-[#B83A30] text-white text-base font-semibold px-8 py-3.5 rounded-full transition-all duration-200 shadow-[0_0_40px_rgba(224,83,71,0.35)] ${FOCUS_DARK}`}
                href="/dashboard"
              >
                <span>Get started free</span>
                <ArrowIcon />
              </Link>
              <Link
                className={`w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-full border border-white/30 hover:bg-white/10 text-white text-base font-semibold transition-colors ${FOCUS_DARK}`}
                href={CONTACT_SALES_HREF}
                data-plane-target
              >
                Contact sales
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Cta;
