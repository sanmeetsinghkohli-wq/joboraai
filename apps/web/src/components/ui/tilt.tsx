'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';

/**
 * Tilts its child in 3D toward the pointer, Apple-style.
 *
 * Writes CSS variables on the element instead of React state, so pointer
 * movement never re-renders. With `sheen`, a soft glass highlight follows the
 * pointer across the surface. Disabled for touch and for reduced motion.
 */
export function Tilt({
  children,
  className,
  max = 8,
  lift = 0,
  sheen = false,
}: {
  children: React.ReactNode;
  className?: string;
  /** Maximum rotation in degrees. */
  max?: number;
  /** translateZ in px applied while hovered. */
  lift?: number;
  /** Show a glass highlight that follows the pointer. */
  sheen?: boolean;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;
    const set = (rx: number, ry: number, z: number, mx: number, my: number, on: number) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
        el.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
        el.style.setProperty('--tz', `${z}px`);
        el.style.setProperty('--mx', `${(mx * 100).toFixed(1)}%`);
        el.style.setProperty('--my', `${(my * 100).toFixed(1)}%`);
        el.style.setProperty('--sheen', String(on));
      });
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      set(-(y - 0.5) * max * 2, (x - 0.5) * max * 2, lift, x, y, 1);
    };
    const onLeave = () => set(0, 0, 0, 0.5, 0.5, 0);

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [max, lift]);

  return (
    <div className={cn('[perspective:1000px]', className)}>
      <div
        ref={ref}
        className="preserve-3d relative h-full transition-transform duration-300 ease-out will-change-transform [transform:rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))_translateZ(var(--tz,0px))]"
      >
        {children}
        {sheen && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-lg transition-opacity duration-300"
            style={{
              opacity: 'var(--sheen, 0)',
              background:
                'radial-gradient(28rem circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.55), rgba(255,255,255,0) 45%)',
              mixBlendMode: 'soft-light',
            }}
          />
        )}
      </div>
    </div>
  );
}
