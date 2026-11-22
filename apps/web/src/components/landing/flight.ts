/** Shared paper-plane flight maths (pure TS), used by both the WebGL scene and the CSS tier. Units: screen px, y down. */

/** Cubic bezier point (out[0], out[1]) and tangent (out[2], out[3]) at u. */
export function bez(p0: number[], p1: number[], p2: number[], p3: number[], u: number, out: number[]): void {
  const v = 1 - u;
  const b0 = v * v * v;
  const b1 = 3 * v * v * u;
  const b2 = 3 * v * u * u;
  const b3 = u * u * u;
  out[0] = b0 * p0[0] + b1 * p1[0] + b2 * p2[0] + b3 * p3[0];
  out[1] = b0 * p0[1] + b1 * p1[1] + b2 * p2[1] + b3 * p3[1];
  const d0 = 3 * v * v;
  const d1 = 6 * v * u;
  const d2 = 3 * u * u;
  out[2] = d0 * (p1[0] - p0[0]) + d1 * (p2[0] - p1[0]) + d2 * (p3[0] - p2[0]);
  out[3] = d0 * (p1[1] - p0[1]) + d1 * (p2[1] - p1[1]) + d2 * (p3[1] - p2[1]);
}

/** Heading (rad, CCW about z, nose = +y, world y up) for a screen-px tangent (y down). */
export const headingOf = (dx: number, dy: number): number => Math.atan2(-dx, -dy);
