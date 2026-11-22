'use client';

import React, { useEffect, useRef } from 'react';
import { bez, headingOf } from './flight';
import { samplePose, EASE } from './keyframes';
import { scrollState, subscribe } from './scroll-state';
import { drawResumeFront, drawResumeBack, drawLayer, whenFontsReady } from './three/textures';

const K = 90; // px per world unit (spec section 6)
const LAYER_KINDS = ['ats', 'keywords', 'bullets'] as const;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const sstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const TRAIL_DOTS = 6;
const _o = [0, 0, 0, 0];
const _o1 = [0, 0, 0, 0];
const _o2 = [0, 0, 0, 0];

// Printed lines on the dart's wings (nose up, viewBox 100x160): [y, side]. Wing edge x at y: 50 -/+ (y-4)*0.3056.
const WING_LINES = [58, 72, 86, 100, 114, 128].flatMap((y) => {
  const w = (y - 4) * 0.3056;
  return [
    { k: `l${y}`, x1: 50 - w + 5, x2: 46, y },
    { k: `r${y}`, x1: 54, x2: 50 + w - 5, y },
  ];
});

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
  const flyRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const targetEl = useRef<Element | null>(null);

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
      plane.style.transform = `translate3d(${x}px, ${y}px, ${pose.pos[2] * K}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${pose.scale})`;
      plane.style.boxShadow = fold > 0.02 ? 'none' : `0 0 80px rgba(224,83,71,${0.35 * pose.glow})`;

      // Simplified 2D fold: the front face is clipped stage by stage (corners, edges), narrows as it folds in half,
      // then crossfades to a flat dart SVG. (The WebGL tier does the real crease maths.)
      const front = frontRef.current;
      if (front) {
        if (fold > 0) {
          const f1 = sstep(0, 0.22, fold);
          const f2 = sstep(0.22, 0.44, fold);
          const f3 = sstep(0.44, 0.68, fold);
          const y1 = f1 * 35.35 + f2 * (85.4 - 35.35);
          front.style.clipPath = `polygon(50% 0, 100% ${y1}%, 100% 100%, 0 100%, 0 ${y1}%)`;
          front.style.transform = `scaleX(${1 - 0.3 * f3})`;
        } else {
          front.style.clipPath = '';
          front.style.transform = '';
        }
      }
      body.style.opacity = String(1 - sstep(0.78, 0.95, fold));

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

      // Flight: dart SVG along a bezier from the paper to just right of (or, if there is no room, under) the
      // [data-plane-target] button. Same path shape as the WebGL tier.
      const fl = flyRef.current;
      if (fl) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const dartA = sstep(0.8, 0.95, fold);
        if (dartA <= 0.001) {
          fl.style.opacity = '0';
        } else {
          const u = pose.fly;
          const lenPx = vw < 640 ? 84 : Math.min(170, Math.max(80, 0.16 * vh));
          const s0 = (plane.offsetHeight * pose.scale) / 160;
          const s1 = lenPx / 160;
          const P0 = [plane.offsetLeft + plane.offsetWidth / 2 + x, plane.offsetTop + plane.offsetHeight / 2 + y];
          if (!targetEl.current || !targetEl.current.isConnected) targetEl.current = document.querySelector('[data-plane-target]');
          let tx = vw * 0.4;
          let ty = vh * 0.7;
          let beside = true;
          if (targetEl.current) {
            const r = targetEl.current.getBoundingClientRect();
            beside = r.right + 26 + lenPx * 0.95 < vw - 8;
            if (beside) {
              tx = r.right + 26 + lenPx * 0.48;
              ty = r.top + r.height / 2 + 2;
            } else {
              tx = r.right - lenPx * 0.55;
              ty = r.bottom + lenPx * 0.5 + 14;
            }
          }
          const P1 = [P0[0], P0[1] - 0.25 * vh];
          const P3 = [tx, ty];
          const P2 = beside ? [tx + 0.28 * vw, ty + 0.02 * vh] : [Math.min(vw - 12, tx + 0.2 * vw), ty - 0.1 * vh];
          bez(P0, P1, P2, P3, u, _o);
          const deg = (Math.atan2(_o[2], -_o[3]) * 180) / Math.PI; // CSS rotate: clockwise, nose up
          const sc = s0 + (s1 - s0) * sstep(0, 1, u);
          fl.style.opacity = String(dartA);
          fl.style.transform = `translate3d(${_o[0]}px, ${_o[1]}px, 0) rotate(${deg}deg) scale(${sc})`;
          // light motion trail: dots lagging along the same path, only while moving
          const moving = sstep(0.01, 0.05, u) * (1 - sstep(0.95, 0.995, u));
          dotRefs.current.forEach((d, i) => {
            if (!d) return;
            const uu = Math.max(0, u - (i + 1) * 0.03);
            bez(P0, P1, P2, P3, uu, _o1);
            d.style.opacity = String(moving * 0.5 * (1 - i / TRAIL_DOTS) * dartA);
            d.style.transform = `translate3d(${_o1[0]}px, ${_o1[1]}px, 0) scale(${1 - i * 0.1})`;
          });
        }
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
      </div>
      <div ref={flyRef} className="absolute left-0 top-0 w-0 h-0 opacity-0 will-change-transform" style={{ transformOrigin: '0 0' }}>
        <svg viewBox="0 0 100 160" width="100" height="160" className="absolute overflow-visible" style={{ left: -50, top: -80, filter: 'drop-shadow(0 0 14px rgba(224,83,71,0.45))' }}>
          <path d="M50 4 L6 148 L50 126 Z" fill="#FFFFFF" />
          <path d="M50 4 L94 148 L50 126 Z" fill="#F3EBE6" />
          <path d="M50 4 L50 126 L56 152 Z" fill="#EDE5E1" />
          {WING_LINES.map((l) => (
            <path key={l.k} d={`M${l.x1.toFixed(1)} ${l.y} L${l.x2.toFixed(1)} ${l.y}`} stroke="#63555F" strokeOpacity="0.4" strokeWidth="1.6" strokeLinecap="round" />
          ))}
          <path d="M50 4 L50 126" stroke="#E05347" strokeWidth="1.4" />
        </svg>
      </div>
      {Array.from({ length: TRAIL_DOTS }, (_, i) => (
        <div
          key={i}
          ref={(el) => {
            dotRefs.current[i] = el;
          }}
          className="absolute left-0 top-0 w-1.5 h-1.5 -ml-[3px] -mt-[3px] rounded-full bg-[#F7CEBA] opacity-0"
        />
      ))}
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
