'use client';

import { useEffect, useRef } from 'react';
import { Check, FileText, Sparkles } from 'lucide-react';
import { AppScreen } from './AppScreen';

/**
 * Hero product shot. The app window starts tilted back in 3D and settles flat
 * as you scroll; the pointer adds a gentle parallax. Everything is driven by
 * CSS variables (--p scroll, --mx/--my pointer), so React never re-renders.
 */
export function HeroStage() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.setProperty('--p', '1');
      return;
    }
    let raf = 0;
    const update = () => {
      raf = 0;
      const top = el.getBoundingClientRect().top;
      const p = Math.min(1, Math.max(0, 1 - top / (window.innerHeight * 0.65)));
      el.style.setProperty('--p', p.toFixed(3));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const onMove = (e: PointerEvent) => {
      el.style.setProperty('--mx', (e.clientX / window.innerWidth - 0.5).toFixed(3));
      el.style.setProperty('--my', (e.clientY / window.innerHeight - 0.5).toFixed(3));
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="relative mx-auto mt-12 w-full max-w-5xl [--mx:0] [--my:0] [--p:0] [perspective:1800px] sm:mt-20"
    >
      {/* Soft glow behind the window */}
      <div className="pointer-events-none absolute inset-x-[10%] top-[15%] h-[70%] rounded-full bg-coral/30 blur-[100px]" />

      <div
        className="preserve-3d relative will-change-transform"
        style={{
          transform:
            'rotateX(calc((1 - var(--p)) * 22deg + var(--my) * -4deg)) rotateY(calc(var(--mx) * 6deg)) scale(calc(0.9 + var(--p) * 0.1))',
          transition: 'transform 120ms linear',
        }}
      >
        {/* App window */}
        <div className="overflow-hidden rounded-2xl border border-plum/10 bg-paper shadow-[0_50px_100px_-30px_rgba(53,27,50,0.45)]">
          <div className="flex items-center gap-1.5 border-b border-line bg-ivory px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-coral/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-sand" />
            <span className="h-2.5 w-2.5 rounded-full bg-sand" />
            <span className="ml-4 h-2 w-40 rounded-full bg-sand" />
          </div>
          <div className="aspect-[4/3] sm:aspect-[16/9]">
            <AppScreen />
          </div>
        </div>

        {/* Floating glass cards, lifted off the window in 3D */}
        <FloatCard className="-left-10 bottom-[10%] hidden md:block" depth={90} delay="0s">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">Skills, one by one</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {['React', 'TypeScript'].map((s) => (
              <li key={s} className="flex items-center gap-2 text-plum">
                <Check className="h-3.5 w-3.5 text-success" /> {s}
              </li>
            ))}
            <li className="flex items-center gap-2 text-ink-subtle">
              <span className="h-3.5 w-3.5 rounded-full border border-dashed border-ink-subtle" /> GraphQL
            </li>
          </ul>
        </FloatCard>

        <FloatCard className="-top-8 right-2 sm:-right-12 sm:top-[8%]" depth={130} delay="1.2s">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">Pipeline</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold">
            <span className="rounded-full bg-plum-50 px-2 py-1 text-plum">Applied</span>
            <span className="text-ink-subtle">→</span>
            <span className="rounded-full bg-coral/15 px-2 py-1 text-coral-700">Interview</span>
            <span className="text-ink-subtle">→</span>
            <span className="rounded-full bg-success-100 px-2 py-1 text-success-700">Offer</span>
          </div>
        </FloatCard>

        <FloatCard className="-bottom-6 right-[10%] hidden md:block" depth={70} delay="2.4s">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-plum text-coral">
              <FileText className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-plum">Cover letter drafted</p>
              <p className="flex items-center gap-1 text-xs text-ink-subtle">
                <Sparkles className="h-3 w-3 text-coral" /> From your own profile
              </p>
            </div>
          </div>
        </FloatCard>
      </div>
    </div>
  );
}

function FloatCard({
  className,
  depth,
  delay,
  children,
}: {
  className: string;
  depth: number;
  delay: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`absolute ${className}`} style={{ transform: `translateZ(${depth}px)` }}>
      <div
        className="animate-float rounded-xl border border-white/60 bg-white/75 px-4 py-3 shadow-raised backdrop-blur-md motion-reduce:animate-none"
        style={{ animationDelay: delay }}
      >
        {children}
      </div>
    </div>
  );
}
