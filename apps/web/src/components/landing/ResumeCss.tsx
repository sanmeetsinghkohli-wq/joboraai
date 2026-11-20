'use client';

import React, { useEffect, useRef } from 'react';
import { samplePose, EASE } from './keyframes';
import { scrollState, subscribe } from './scroll-state';
import { drawResumeFront, drawResumeBack, drawLayer, whenFontsReady } from './three/textures';

const K = 90; // px per world unit (spec section 6)
const LAYER_KINDS = ['ats', 'keywords', 'bullets'] as const;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

function paint(canvas: HTMLCanvasElement | null, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (ctx) draw(ctx, canvas.width, canvas.height);
}

/**
 * CSS-3D tier: a 210:297 resume whose pose comes from samplePose(p).
 * Styles are written straight to the DOM from a scroll subscription, never through React state.
 */
export function ResumeCss() {
  const planeRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLCanvasElement>(null);
  const backRef = useRef<HTMLCanvasElement>(null);
  const layerRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const paperPlaneRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    let alive = true;
    whenFontsReady().then(() => {
      if (!alive) return;
      paint(frontRef.current, drawResumeFront);
      paint(backRef.current, drawResumeBack);
      LAYER_KINDS.forEach((kind, i) => paint(layerRefs.current[i], (c, w, h) => drawLayer(c, w, h, kind)));
    });

    const apply = (p: number) => {
      const plane = planeRef.current;
      const body = bodyRef.current;
      if (!plane || !body) return;
      const pose = samplePose(p);
      const desktop = window.innerWidth >= 1024;
      const x = desktop ? pose.pos[0] * K : 0;
      const y = -pose.pos[1] * K;
      const [rx, ry, rz] = pose.rot;
      const fold = clamp01(pose.fold);
      // Fold: crossfade the paper to an inline SVG plane that flies off to the top-right.
      body.style.opacity = String(1 - clamp01(fold * 2));
      plane.style.transform = `translate3d(${x}px, ${y}px, ${pose.pos[2] * K}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${pose.scale})`;
      plane.style.boxShadow = `0 0 80px rgba(224,83,71,${0.35 * pose.glow})`;

      const unit = body.offsetWidth / 2.1;
      layerRefs.current.forEach((el, i) => {
        if (!el) return;
        const li = EASE.outCubic(clamp01((pose.peel - 0.15 * i) / 0.7));
        const ox = (-1.1 - 0.15 * i) * unit * li;
        const oy = -(1.0 - 1.0 * i) * unit * li;
        const oz = (0.35 + 0.3 * i) * unit * li;
        el.style.opacity = String(Math.min(1, li * 4));
        el.style.transform = `translate3d(${ox}px, ${oy}px, ${oz}px) rotateZ(${(-4 + 4 * i) * li}deg)`;
      });

      const pp = paperPlaneRef.current;
      if (pp) {
        const f = clamp01((fold - 0.4) / 0.6);
        const tx = f * window.innerWidth * 0.45;
        const ty = -f * window.innerHeight * 0.45;
        pp.style.opacity = String(clamp01(fold * 2 - 0.5));
        pp.style.transform = `translate3d(${tx}px, ${ty}px, 0) rotate(${-20 * f}deg) scale(${1 - 0.3 * f})`;
      }
    };

    apply(scrollState.progress);
    const unsub = subscribe(apply);
    const onResize = () => apply(scrollState.progress);
    window.addEventListener('resize', onResize);
    return () => {
      alive = false;
      unsub();
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div className="absolute inset-0 flex justify-center items-start pt-[22svh] lg:items-center lg:pt-0" style={{ perspective: '1200px' }} aria-hidden="true">
      <div
        ref={planeRef}
        className="relative will-change-transform"
        style={{ width: 'min(56vw, 300px)', aspectRatio: '210 / 297', transformStyle: 'preserve-3d' }}
      >
        <div ref={bodyRef} className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}>
          <canvas
            ref={frontRef}
            width={620}
            height={877}
            className="absolute inset-0 w-full h-full rounded-sm bg-white shadow-xl"
            style={{ backfaceVisibility: 'hidden' }}
          />
          <canvas
            ref={backRef}
            width={620}
            height={877}
            className="absolute inset-0 w-full h-full rounded-sm bg-[#FAF6F2] shadow-xl"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          />
          {LAYER_KINDS.map((kind, i) => (
            <canvas
              key={kind}
              ref={(el) => {
                layerRefs.current[i] = el;
              }}
              width={1024}
              height={540}
              className="absolute left-[4.75%] w-[90.5%] h-[33.7%] opacity-0"
              style={{ top: `${50 - (0.9 - 0.9 * i) / 2.97 * 100 - 16.8}%`, borderRadius: 24 }}
            />
          ))}
        </div>
        <svg
          ref={paperPlaneRef}
          viewBox="0 0 120 80"
          className="absolute left-1/2 top-1/2 w-40 -ml-20 -mt-10 opacity-0"
          fill="none"
        >
          <path d="M4 36 L116 4 L84 76 L60 50 Z" fill="#FFFFFF" stroke="#EDE5E1" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M116 4 L60 50 L56 70 Z" fill="#F7CEBA" stroke="#E05347" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

/** Static tier visual: a flat, 2D-canvas piece used by the sections when no fixed layer exists. */
export function StaticResume({
  kind,
  className = '',
}: {
  kind: 'front' | 'back' | 'layers';
  className?: string;
}) {
  const a = useRef<HTMLCanvasElement>(null);
  const b = useRef<HTMLCanvasElement>(null);
  const c = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let alive = true;
    whenFontsReady().then(() => {
      if (!alive) return;
      if (kind === 'front') paint(a.current, drawResumeFront);
      else if (kind === 'back') paint(a.current, drawResumeBack);
      else {
        paint(a.current, (x, w, h) => drawLayer(x, w, h, 'ats'));
        paint(b.current, (x, w, h) => drawLayer(x, w, h, 'keywords'));
        paint(c.current, (x, w, h) => drawLayer(x, w, h, 'bullets'));
      }
    });
    return () => {
      alive = false;
    };
  }, [kind]);

  if (kind === 'layers') {
    return (
      <div className={`flex flex-col gap-3 ${className}`} aria-hidden="true">
        {[a, b, c].map((r, i) => (
          <canvas key={i} ref={r} width={1024} height={540} className="w-full max-w-sm h-auto rounded-3xl shadow-lg" />
        ))}
      </div>
    );
  }
  const front = kind === 'front';
  return (
    <div className={className} style={{ perspective: '1200px' }} aria-hidden="true">
      <canvas
        ref={a}
        width={620}
        height={877}
        className="w-full h-auto shadow-2xl rounded-sm"
        style={front ? { transform: 'rotateY(-12deg) rotateX(4deg)' } : undefined}
      />
    </div>
  );
}

export default ResumeCss;
