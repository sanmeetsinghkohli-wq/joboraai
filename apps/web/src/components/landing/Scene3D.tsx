'use client';

import { useEffect, useRef } from 'react';

/**
 * The hero scene: three planes stacked in isometric 3D — live roles at the
 * bottom, the skill comparison in the middle, the pipeline on top.
 *
 * Pure CSS 3D transforms (no WebGL, no extra dependencies). The stack follows
 * the pointer and spreads apart on hover. Planes carry abstract shapes only —
 * no invented companies, scores or numbers.
 */
export function Scene3D() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const r = el.getBoundingClientRect();
      const px = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2));
      const py = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2));
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.setProperty('--tilt-x', `${(-py * 6).toFixed(2)}deg`);
        el.style.setProperty('--tilt-z', `${(px * 10).toFixed(2)}deg`);
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(frame);
      el.style.setProperty('--tilt-x', '0deg');
      el.style.setProperty('--tilt-z', '0deg');
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    el.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="group relative mx-auto aspect-square w-full max-w-[34rem] select-none [--gap:4.25rem] [perspective:1800px] hover:[--gap:5.75rem] sm:[--gap:5.25rem] sm:hover:[--gap:7rem]"
    >
      {/* Ambient light */}
      <div className="absolute inset-[8%] rounded-full bg-[radial-gradient(circle_at_50%_45%,rgba(231,111,114,0.28),rgba(53,27,50,0.10)_45%,transparent_70%)] blur-2xl" />

      {/* Orbit ring */}
      <div className="absolute inset-[2%] preserve-3d">
        <div className="absolute inset-0 animate-orbit rounded-full border border-dashed border-plum/15">
          <span className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-coral shadow-[0_0_16px_rgba(231,111,114,0.8)]" />
          <span className="absolute bottom-0 left-1/2 h-2 w-2 -translate-x-1/2 translate-y-1/2 rounded-full bg-success" />
        </div>
      </div>

      {/* The stack */}
      <div
        className="absolute inset-0 preserve-3d transition-transform duration-300 ease-out"
        style={{
          transform:
            'translateY(8%) rotateX(calc(57deg + var(--tilt-x, 0deg))) rotateZ(calc(-40deg + var(--tilt-z, 0deg)))',
        }}
      >
        {/* Ground shadow */}
        <div className="absolute inset-[20%] rounded-[2rem] bg-plum-900/25 blur-2xl [transform:translateZ(-2.5rem)]" />

        {/* Plane 1 — live roles */}
        <Plane depth={0} className="border-plum-600 bg-plum text-paper">
          <PlaneLabel className="text-paper/70">Live roles</PlaneLabel>
          <div className="mt-3 grid flex-1 grid-cols-3 gap-2">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-1.5 rounded-md bg-paper/10 p-2">
                <span className="h-1.5 w-3/4 rounded-full bg-paper/50" />
                <span className="h-1.5 w-1/2 rounded-full bg-paper/25" />
              </div>
            ))}
          </div>
        </Plane>

        {/* Plane 2 — skill comparison */}
        <Plane depth={1} className="border-coral-200 bg-coral-50 text-plum">
          <PlaneLabel className="text-coral-700">Skill match</PlaneLabel>
          <div className="mt-3 flex flex-1 flex-col justify-around">
            {['w-11/12', 'w-8/12', 'w-10/12', 'w-5/12', 'w-9/12'].map((w, i) => (
              <div key={i} className="flex items-center gap-2">
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                    i === 3 ? 'border border-coral' : 'bg-success'
                  }`}
                >
                  {i !== 3 && <span className="h-1.5 w-1.5 rounded-full bg-paper" />}
                </span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-paper">
                  <span className={`block h-full rounded-full ${i === 3 ? 'bg-coral-200' : 'bg-coral'} ${w}`} />
                </span>
              </div>
            ))}
          </div>
        </Plane>

        {/* Plane 3 — pipeline */}
        <Plane depth={2} className="border-line bg-paper text-plum shadow-float">
          <PlaneLabel className="text-ink-subtle">Pipeline</PlaneLabel>
          <div className="mt-3 grid flex-1 grid-cols-4 gap-2">
            {[3, 2, 1, 1].map((cards, col) => (
              <div key={col} className="flex flex-col gap-1.5 rounded-md bg-ivory p-1.5">
                <span
                  className={`h-1.5 w-2/3 rounded-full ${
                    col === 3 ? 'bg-success' : col === 2 ? 'bg-coral' : 'bg-plum'
                  }`}
                />
                {Array.from({ length: cards }).map((_, i) => (
                  <span key={i} className="h-6 rounded border border-line bg-paper" />
                ))}
              </div>
            ))}
          </div>
        </Plane>
      </div>
    </div>
  );
}

function Plane({
  depth,
  className,
  children,
}: {
  depth: number;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="absolute inset-[19%] preserve-3d transition-transform duration-500 ease-out"
      style={{ transform: `translateZ(calc(var(--gap) * ${depth}))` }}
    >
      <div
        className={`flex h-full animate-float flex-col rounded-[1.4rem] border p-4 shadow-raised sm:p-5 ${className}`}
        style={{ animationDelay: `${depth * -2.3}s` }}
      >
        {children}
      </div>
    </div>
  );
}

function PlaneLabel({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={`text-[0.7rem] font-semibold uppercase tracking-[0.12em] ${className}`}>{children}</span>;
}
