import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneShared } from './shared';

const INK_VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const INK_FRAG = /* glsl */ `
uniform float uTime;
uniform float uAspect;
uniform vec3 uIvory;
uniform vec3 uPeach;
uniform vec3 uCoral;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++) { v += a * vnoise(p); p *= 2.0; a *= 0.5; }
  return v;
}
void main() {
  vec2 q = vUv * vec2(uAspect, 1.0);
  float ink = smoothstep(0.45, 0.6, fbm(q * 2.2 + uTime * 0.03) + 0.35 * (1.0 - length(vUv - vec2(0.72, 0.45))));
  vec3 col = mix(uIvory, uPeach, ink);
  col = mix(col, uCoral, smoothstep(0.85, 0.95, ink) * 0.6);
  gl_FragColor = vec4(col, 1.0);
}
`;

const SHOW_VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.9999, 1.0); }
`;
const SHOW_FRAG = /* glsl */ `
uniform sampler2D uTex;
uniform float uOpacity;
varying vec2 vUv;
void main() {
  gl_FragColor = vec4(texture2D(uTex, vUv).rgb, uOpacity);
  #include <colorspace_fragment>
}
`;

/** Hero-only ink wash, rendered to a half-resolution target then shown as a full-screen quad. */
export default function InkBackdrop({ shared }: { shared: React.MutableRefObject<SceneShared> }) {
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);

  const res = useMemo(() => {
    const rt = new THREE.WebGLRenderTarget(2, 2, { depthBuffer: false });
    const inkMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uAspect: { value: 1 },
        uIvory: { value: new THREE.Color('#FAF6F2') },
        uPeach: { value: new THREE.Color('#F7CEBA') },
        uCoral: { value: new THREE.Color('#E05347') },
      },
      vertexShader: INK_VERT,
      fragmentShader: INK_FRAG,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });
    const quadGeo = new THREE.PlaneGeometry(2, 2);
    const scene = new THREE.Scene();
    const inkMesh = new THREE.Mesh(quadGeo, inkMat);
    inkMesh.frustumCulled = false;
    scene.add(inkMesh);
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const showMat = new THREE.ShaderMaterial({
      uniforms: { uTex: { value: rt.texture }, uOpacity: { value: 0.5 } },
      vertexShader: SHOW_VERT,
      fragmentShader: SHOW_FRAG,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    });
    return { rt, inkMat, quadGeo, scene, cam, showMat };
  }, []);

  useEffect(() => {
    res.rt.setSize(Math.max(2, Math.floor((size.width * dpr) / 2)), Math.max(2, Math.floor((size.height * dpr) / 2)));
    res.inkMat.uniforms.uAspect.value = size.width / size.height;
  }, [res, size.width, size.height, dpr]);

  useEffect(
    () => () => {
      res.rt.dispose();
      res.inkMat.dispose();
      res.showMat.dispose();
      res.quadGeo.dispose();
    },
    [res],
  );

  const mesh = useMemo(() => {
    const m = new THREE.Mesh(res.quadGeo, res.showMat);
    m.frustumCulled = false;
    m.renderOrder = -10;
    return m;
  }, [res]);

  useFrame(() => {
    const sh = shared.current;
    const t = Math.min(1, Math.max(0, (sh.p - 0.05) / 0.07));
    const fade = 1 - t * t * (3 - 2 * t);
    mesh.visible = fade > 0.003;
    if (!mesh.visible) return;
    res.showMat.uniforms.uOpacity.value = 0.5 * fade;
    res.inkMat.uniforms.uTime.value = sh.time;
    const prev = gl.getRenderTarget();
    gl.setRenderTarget(res.rt);
    gl.render(res.scene, res.cam);
    gl.setRenderTarget(prev);
  });

  return <primitive object={mesh} />;
}
