import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneShared } from './shared';

const COUNT = 500;
const TRAIL_N = 24;
const TRAIL_LIFE = 0.8;
const TRAIL_FRAC = 120 / COUNT;

const VERT = /* glsl */ `
uniform float uTime;
uniform float uDpr;
uniform float uTrailOn;
uniform float uCta;
uniform vec4 uTrail[${TRAIL_N}];
uniform vec3 uCoral;
uniform vec3 uPlum;
uniform vec3 uIvory;
attribute vec4 aSeed; // x seed, y size px, z colour pick (0 coral / 1 plum), w index 0..1
varying vec3 vCol;
varying float vA;
void main() {
  float s = aSeed.x;
  vec3 p = position;
  float t = uTime * 0.1;
  p.x += sin(t * 6.2831 + s * 17.0) * 0.55 + cos(t * 3.7 + s * 5.0) * 0.35;
  p.y += cos(t * 6.2831 + s * 11.0) * 0.55 + sin(t * 2.9 + s * 7.0) * 0.35;
  p.z += sin(t * 4.1 + s * 3.0) * 0.3;
  float a = 0.5;
  if (aSeed.w < ${TRAIL_FRAC.toFixed(4)}) {
    int j = int(clamp(floor(aSeed.w / ${TRAIL_FRAC.toFixed(4)} * ${TRAIL_N}.0), 0.0, ${TRAIL_N - 1}.0));
    vec4 tp = uTrail[j];
    vec3 off = vec3(sin(s * 91.0), cos(s * 57.0), sin(s * 33.0)) * 0.05;
    float ta = clamp(1.0 - tp.w / ${TRAIL_LIFE.toFixed(1)}, 0.0, 1.0) * 0.6;
    p = mix(p, tp.xyz + off, uTrailOn);
    a = mix(a, ta, uTrailOn);
  }
  vec3 plumC = mix(uPlum, uIvory, uCta);
  vCol = mix(uCoral, plumC, aSeed.z);
  vA = a;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aSeed.y * uDpr;
}
`;

const FRAG = /* glsl */ `
varying vec3 vCol;
varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.25, d) * vA;
  if (a < 0.01) discard;
  gl_FragColor = vec4(vCol, a);
  #include <colorspace_fragment>
}
`;

function sstep(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export default function Particles({ shared }: { shared: React.MutableRefObject<SceneShared> }) {
  const dpr = useThree((s) => s.viewport.dpr);
  const { geometry, material } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const seed = new Float32Array(COUNT * 4);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 7;
      pos[i * 3 + 2] = -3 + Math.random() * 4;
      seed[i * 4] = Math.random() * 100;
      seed[i * 4 + 1] = 2 + Math.random() * 2;
      seed[i * 4 + 2] = Math.random() < 0.7 ? 0 : 1;
      seed[i * 4 + 3] = i / COUNT;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
    const m = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uDpr: { value: 1 },
        uTrailOn: { value: 0 },
        uCta: { value: 0 },
        uTrail: { value: Array.from({ length: TRAIL_N }, () => new THREE.Vector4(0, 0, -99, 99)) },
        uCoral: { value: new THREE.Color('#E05347') },
        uPlum: { value: new THREE.Color('#2A1728') },
        uIvory: { value: new THREE.Color('#FAF6F2') },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    });
    return { geometry: g, material: m };
  }, []);
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  const hist = useRef({ head: 0, lx: 0, ly: 0, pts: Array.from({ length: TRAIL_N }, () => ({ x: 0, y: 0, z: -99, age: 99 })) });

  useFrame((_, dt) => {
    const sh = shared.current;
    const u = material.uniforms;
    u.uTime.value = sh.time;
    u.uDpr.value = dpr;
    u.uCta.value = sstep(0.82, 0.9, sh.p);
    const h = hist.current;
    let alive = false;
    for (const q of h.pts) {
      q.age += dt;
      if (q.age < TRAIL_LIFE) alive = true;
    }
    // Emit along the flight path by distance moved (scroll-driven, so no time-based emission), both directions.
    const flying = sh.fly > 0.003 && sh.fly < 0.995;
    const moved = Math.hypot(sh.worldPos.x - h.lx, sh.worldPos.y - h.ly);
    const k = 1 - Math.exp(-dt * 6);
    u.uTrailOn.value += ((alive || flying ? 1 : 0) - u.uTrailOn.value) * k;
    if (flying && moved > 0.045) {
      h.lx = sh.worldPos.x;
      h.ly = sh.worldPos.y;
      {
        const q = h.pts[h.head];
        q.x = sh.worldPos.x;
        q.y = sh.worldPos.y;
        q.z = sh.worldPos.z;
        q.age = 0;
        h.head = (h.head + 1) % TRAIL_N;
      }
    }
    if (!flying) {
      h.lx = sh.worldPos.x;
      h.ly = sh.worldPos.y;
    }
    const arr = u.uTrail.value as THREE.Vector4[];
    for (let i = 0; i < TRAIL_N; i++) {
      const q = h.pts[i];
      arr[i].set(q.x, q.y, q.z, q.age);
    }
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
