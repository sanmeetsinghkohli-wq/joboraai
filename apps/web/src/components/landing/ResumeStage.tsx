'use client';

import dynamic from 'next/dynamic';
import { Component, useEffect, useRef, useState, type ReactNode } from 'react';
import { subscribe } from './scroll-state';
import { downgradeTier, useBackground3d, useRenderTier } from './use-render-tier';
import { ResumeCss } from './ResumeCss';

const ResumeCanvas = dynamic(() => import('./three/ResumeCanvas'), {
  ssr: false,
  loading: () => null,
});

/** Falls back to the CSS tier if the lazy WebGL chunk fails to load or the scene throws. */
class CanvasBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override componentDidCatch() {
    downgradeTier('css');
  }
  override render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function ResumeStage() {
  const tier = useRenderTier();
  const background = useBackground3d();
  const [ready, setReady] = useState(false);

  // Mount the WebGL chunk only after first paint, when the browser is idle.
  useEffect(() => {
    if (tier !== 'webgl') return;
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => setReady(true), { timeout: 1500 });
      return () => w.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(() => setReady(true), 300);
    return () => window.clearTimeout(id);
  }, [tier]);

  // Plum CTA backdrop: a fixed layer behind the resume, clipped to the #cta section's on-screen rect.
  const plum = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (tier === 'static') return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = plum.current;
      const cta = document.getElementById('cta');
      if (!el || !cta) return;
      const r = cta.getBoundingClientRect();
      const vh = window.innerHeight;
      const top = Math.min(vh, Math.max(0, r.top));
      const bottom = Math.min(vh, Math.max(0, vh - r.bottom));
      el.style.clipPath = top >= vh || bottom >= vh ? 'inset(100% 0 0 0)' : `inset(${top}px 0 ${bottom}px 0)`;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    const unsub = subscribe(kick);
    window.addEventListener('resize', kick);
    return () => {
      unsub();
      window.removeEventListener('resize', kick);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [tier]);

  if (tier === 'static') return null;

  return (
    <>
      {/* On phones the CTA paints its own plum background, so this layer is only for wide screens. */}
      <div
        ref={plum}
        aria-hidden="true"
        className="fixed inset-0 z-0 pointer-events-none bg-gradient-to-br from-[#2A1728] via-[#331C30] to-[#2A1728]"
        style={{ clipPath: 'inset(100% 0 0 0)', display: background ? 'none' : undefined }}
      >
        <div className="absolute -right-24 -bottom-24 w-[28rem] h-[28rem] bg-[#E05347]/20 rounded-full blur-3xl" />
      </div>
      {/* On phones the scene plays behind the text, softened so the copy stays readable. */}
      <div aria-hidden="true" className="fixed inset-0 z-0 pointer-events-none" style={background ? { opacity: 0.32 } : undefined}>
        {tier === 'webgl' ? (ready ? (
            <CanvasBoundary>
              <ResumeCanvas />
            </CanvasBoundary>
          ) : null) : <ResumeCss />}
      </div>
    </>
  );
}

export default ResumeStage;
