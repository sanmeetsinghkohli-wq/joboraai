export interface ResumePose {
  pos: [number, number, number];
  rot: [number, number, number]; // degrees
  scale: number;
  twist: number; // degrees
  bend: number; // 1/units
  peel: number;
  fold: number;
  glow: number;
  float: number;
  fly: number; // 0..1 along the paper-plane flight path (CTA)
}

export type EaseName = 'linear' | 'inOutSine' | 'inOutCubic' | 'outCubic' | 'inExpo';

export const EASE: Record<EaseName, (t: number) => number> = {
  linear: (t) => t,
  inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inExpo: (t) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
};

// [p, px, py, pz, rx, ry, rz, scale, twist, bend, peel, fold, glow, ease]
type Row = [
  number, number, number, number, number, number, number,
  number, number, number, number, number, number, EaseName,
  number?, // fly (optional, default 0)
];

const ROWS: Row[] = [
  [0.0, 1.6, 0, 0, -8, -22, 4, 1.0, 0, 0.12, 0, 0, 0, 'inOutSine'],
  [0.06, 1.5, -0.1, 0.4, -4, -10, 2, 1.04, 22, 0.28, 0, 0, 0, 'inOutCubic'],
  [0.12, 1.7, 0, 0, 0, -10, 0, 1.0, 0, 0.05, 0, 0, 0, 'linear'],
  [0.15, 1.7, 0, 0, 0, -14, 0, 1.0, 0, 0.05, 0, 0, 0, 'outCubic'],
  // Peel is fully done (restacked, peel 0) by p .28, before the features bento scrolls in.
  [0.21, 1.5, 0, -0.4, -6, -24, 0, 0.94, 0, 0.1, 1, 0, 0, 'linear'],
  [0.25, 1.5, 0, -0.4, -6, -24, 0, 0.94, 0, 0.1, 1, 0, 0, 'inOutCubic'],
  [0.28, 1.6, 0, 0, 0, -8, 0, 1.0, 0, 0.05, 0, 0, 0, 'linear'],
  [0.41, 1.6, 0, 0, 0, -8, 0, 1.0, 0, 0.05, 0, 0, 0, 'linear'],
  // Flip: linear (no edge-on dwell), bigger and strongly twisted at the 90deg pass so it never goes paper-thin.
  [0.455, 1.7, 0.1, 0.3, -4, 90, -3, 1.1, 70, 0.3, 0, 0, 0, 'linear'],
  [0.5, 1.85, 0, 0, 0, 180, 0, 1.2, 0, 0.04, 0, 0, 0, 'linear'],
  [0.62, 1.85, 0, 0, 0, 188, 0, 1.2, 0, 0.04, 0, 0, 0, 'inOutCubic'],
  // Pricing: flat and fully visible in the left column under the heading, with the glow at full strength.
  [0.68, -2.85, -1.3, 0, 0, 360, 0, 0.54, 0, 0, 0, 0, 0.4, 'outCubic'],
  [0.78, -2.85, -1.3, 0, 0, 360, 0, 0.54, 0, 0, 0, 0, 1.0, 'linear'],
  [0.84, 1.5, 0.2, -0.5, 0, 360, 0, 0.85, 0, 0, 0, 0, 0.6, 'inOutCubic'],
  // CTA: arrive in the right slot, fold into a dart (fold 0 -> 1, p .855 .. .905), then fly to the Contact sales
  // button (fly 0 -> 1, p .905 .. .96) and settle with a glow (.96 .. 1). pos/rot/scale are constant from .905 on:
  // the scene derives the flight path itself and only reads `fly`.
  [0.855, 1.5, 0.1, 0, -8, 360, 0, 0.85, 0, 0, 0, 0, 0.5, 'linear'],
  [0.905, 1.5, 0.1, 0, -20, 360, 0, 0.8, 0, 0, 0, 1, 0.3, 'inOutSine'],
  [0.96, 1.5, 0.1, 0, -20, 360, 0, 0.8, 0, 0, 0, 1, 0.5, 'linear', 1],
  [1.0, 1.5, 0.1, 0, -20, 360, 0, 0.8, 0, 0, 0, 1, 1.0, 'linear', 1],
];

function toPose(r: Row): ResumePose {
  return {
    pos: [r[1], r[2], r[3]],
    rot: [r[4], r[5], r[6]],
    scale: r[7],
    twist: r[8],
    bend: r[9],
    peel: r[10],
    fold: r[11],
    glow: r[12],
    float: 0,
    fly: r[14] ?? 0,
  };
}

export const KEYFRAMES: { p: number; pose: ResumePose; ease: EaseName }[] = ROWS.map((r) => ({
  p: r[0],
  pose: toPose(r),
  ease: r[13],
}));

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function smoothstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/**
 * Pose at global progress p. `float` is the amplitude A of the float extra
 * (0.08*(1-smoothstep(0,.12,p)) + 0.02, scaled by (1-fold)); consumers apply
 * y += float*sin(t*2PI*0.25) and rotZ += 1.5deg*sin(t*2PI*0.17).
 */
export function samplePose(p: number): ResumePose {
  const pp = Math.min(1, Math.max(0, p));
  let i = 0;
  while (i < KEYFRAMES.length - 2 && pp > KEYFRAMES[i + 1].p) i++;
  const a = KEYFRAMES[i];
  const b = KEYFRAMES[i + 1];
  const span = b.p - a.p;
  const raw = span > 0 ? Math.min(1, Math.max(0, (pp - a.p) / span)) : 1;
  const t = EASE[a.ease](raw);
  const A = a.pose;
  const B = b.pose;
  const fold = lerp(A.fold, B.fold, t);
  return {
    pos: [lerp(A.pos[0], B.pos[0], t), lerp(A.pos[1], B.pos[1], t), lerp(A.pos[2], B.pos[2], t)],
    rot: [lerp(A.rot[0], B.rot[0], t), lerp(A.rot[1], B.rot[1], t), lerp(A.rot[2], B.rot[2], t)],
    scale: lerp(A.scale, B.scale, t),
    twist: lerp(A.twist, B.twist, t),
    bend: lerp(A.bend, B.bend, t),
    peel: lerp(A.peel, B.peel, t),
    fold,
    glow: lerp(A.glow, B.glow, t),
    fly: lerp(A.fly, B.fly, t),
    float: (0.08 * (1 - smoothstep(0, 0.12, pp)) + 0.02) * (1 - fold),
  };
}
