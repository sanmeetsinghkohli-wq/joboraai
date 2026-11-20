import * as THREE from 'three';

export const RESUME_W = 2.1;
export const RESUME_H = 2.97;

const VERT = /* glsl */ `
uniform float uTwist;
uniform float uBend;
uniform float uFold;
uniform float uCurl;
uniform float uCurlC;
uniform float uCurlR;

varying vec3 vNormal;
varying vec3 vViewDir;
varying vec2 vUv;

#define PI 3.14159265359
const float W = ${RESUME_W.toFixed(2)};
const float H = ${RESUME_H.toFixed(2)};
const float SFIN = 0.25;

vec3 rodrigues(vec3 p, vec3 a, vec3 d, float th) {
  vec3 v = p - a;
  return a + v * cos(th) + cross(d, v) * sin(th) + d * dot(d, v) * (1.0 - cos(th));
}

vec3 deform(vec3 p) {
  // Peel-layer curl (uCurl = 0 for the resume itself)
  if (uCurl > 0.0001) {
    float d = uCurlC - p.y;
    if (d > 0.0) {
      float r = uCurlR;
      float phi = d / r;
      vec3 q = p;
      if (phi < PI) {
        q.y = uCurlC - r * sin(phi);
        q.z = p.z + r * (1.0 - cos(phi));
      } else {
        q.y = uCurlC + (d - PI * r);
        q.z = p.z + 2.0 * r;
      }
      p = mix(p, q, uCurl);
    }
  }

  // 1. Folds (paper space): a classic dart, four sequential stages (uFold 0..1). Every stage works on the
  //    point as left by the previous (completed) stage, so the creases are always where the paper really is.
  //    Moving flaps go behind the sheet (-z) so the printed side stays on top of the finished wings.
  //    z offsets keep stacked layers from z-fighting.
  if (uFold > 0.0) {
    float f1 = smoothstep(0.0, 0.22, uFold);   // top corners to the centre line
    float f2 = smoothstep(0.22, 0.44, uFold);  // new slanted edges to the centre line
    float f3 = smoothstep(0.44, 0.68, uFold);  // fold in half along the keel (fin hangs below, print outside)
    float f4 = smoothstep(0.68, 0.90, uFold);  // wings fold out from the fin, slight dihedral
    vec3 a = vec3(0.0, H * 0.5, 0.0);
    vec3 q = p;
    if (f1 > 0.0) {
      if (p.x < 0.0 && p.y > p.x + H * 0.5 + 1e-4) {
        q = rodrigues(p, a, normalize(vec3(-1.0, -1.0, 0.0)), PI * f1);
        q.z -= 0.006 * f1;
      } else if (p.x > 0.0 && p.y > -p.x + H * 0.5 + 1e-4) {
        q = rodrigues(p, a, normalize(vec3(1.0, -1.0, 0.0)), -PI * f1);
        q.z -= 0.006 * f1;
      }
    }
    if (f2 > 0.0) {
      // crease through the nose at 22.5 deg from the keel: the slanted edge lands exactly on the keel
      float ca = 0.92388;
      float sa = 0.38268;
      vec2 r = q.xy - a.xy;
      float dl = dot(r, vec2(-ca, sa));
      float dr = dot(r, vec2(ca, sa));
      if (dl > 1e-4) {
        q = rodrigues(q, a, vec3(-sa, -ca, 0.0), PI * f2);
        q.z -= 0.02 * f2;
      } else if (dr > 1e-4) {
        q = rodrigues(q, a, vec3(sa, -ca, 0.0), -PI * f2);
        q.z -= 0.02 * f2;
      }
    }
    if (f3 > 0.0) {
      float sgn = q.x < 0.0 ? -1.0 : 1.0;
      float u = abs(q.x);                          // distance from the keel
      float al3 = -PI * 0.5 * f3;                  // fin direction angle (0 = flat outward, -90 = hanging down)
      float m = min(u, SFIN);                      // fin part
      float w = max(u - SFIN, 0.0);                // wing part
      float alw = al3 + radians(100.0) * f4;       // wing direction (100 deg => 10 deg dihedral)
      float alz = w > 0.0 ? alw : al3;
      vec2 d3 = vec2(sgn * cos(al3), sin(al3));
      vec2 dw = vec2(sgn * cos(alw), sin(alw));
      vec2 nz = vec2(-sgn * sin(alz), cos(alz));
      vec2 xz = m * d3 + w * dw + q.z * nz;
      q = vec3(xz.x, q.y, xz.y);
    }
    p = q;
  }

  // 2. Bend (cylindrical, along x)
  if (abs(uBend) > 1e-4) {
    float th = p.x * uBend;
    p.z = p.z + (1.0 - cos(th)) / uBend;
    p.x = sin(th) / uBend;
  }

  // 3. Twist about y, proportional to height
  float a2 = uTwist * (p.y / H);
  float c2 = cos(a2);
  float s2 = sin(a2);
  p = vec3(p.x * c2 - p.z * s2, p.y, p.x * s2 + p.z * c2);
  return p;
}

void main() {
  vec3 p0 = position;
  float e = 0.01;
  vec3 P = deform(p0);
  vec3 Px = deform(p0 + vec3(e, 0.0, 0.0));
  vec3 Py = deform(p0 + vec3(0.0, e, 0.0));
  vec3 n = normalize(cross(Px - P, Py - P));
  vec4 mv = modelViewMatrix * vec4(P, 1.0);
  vNormal = normalize(normalMatrix * n);
  vViewDir = normalize(-mv.xyz);
  vUv = uv;
  gl_Position = projectionMatrix * mv;
}
`;

const FRAG = /* glsl */ `
uniform sampler2D uFront;
uniform sampler2D uBack;
uniform vec3 uLightDir;
uniform vec3 uCoral;
uniform float uGlow;
uniform float uFold;
uniform float uAlpha;

varying vec3 vNormal;
varying vec3 vViewDir;
varying vec2 vUv;

void main() {
  vec3 n = normalize(vNormal);
  vec3 V = normalize(vViewDir);
  vec3 L = normalize(uLightDir);
  vec4 tex;
  if (gl_FrontFacing) {
    tex = texture2D(uFront, vUv);
  } else {
    n = -n;
    tex = uFold > 0.001 ? vec4(0.980, 0.965, 0.949, 1.0) : texture2D(uBack, vec2(1.0 - vUv.x, vUv.y));
    if (uFold > 0.001) tex.rgb = pow(tex.rgb, vec3(2.2));
  }
  float shade = 0.62 + 0.38 * max(dot(n, L), 0.0);
  float spec = 0.06 * pow(max(dot(reflect(-L, n), V), 0.0), 24.0);
  float rim = pow(1.0 - abs(dot(n, V)), 3.0) * uGlow;
  vec3 col = tex.rgb * shade + vec3(spec) + uCoral * rim * 0.8;
  gl_FragColor = vec4(col, tex.a * uAlpha);
  #include <colorspace_fragment>
}
`;

export type ResumeUniforms = {
  uTwist: THREE.IUniform<number>;
  uBend: THREE.IUniform<number>;
  uFold: THREE.IUniform<number>;
  uGlow: THREE.IUniform<number>;
  uTime: THREE.IUniform<number>;
  uFront: THREE.IUniform<THREE.Texture>;
  uBack: THREE.IUniform<THREE.Texture>;
  uLightDir: THREE.IUniform<THREE.Vector3>;
  uCoral: THREE.IUniform<THREE.Color>;
  uCurl: THREE.IUniform<number>;
  uCurlC: THREE.IUniform<number>;
  uCurlR: THREE.IUniform<number>;
  uAlpha: THREE.IUniform<number>;
};

export function createResumeMaterial(
  front: THREE.Texture,
  back: THREE.Texture,
  opts: { transparent?: boolean } = {},
): THREE.ShaderMaterial {
  const uniforms: ResumeUniforms = {
    uTwist: { value: 0 },
    uBend: { value: 0 },
    uFold: { value: 0 },
    uGlow: { value: 0 },
    uTime: { value: 0 },
    uFront: { value: front },
    uBack: { value: back },
    uLightDir: { value: new THREE.Vector3(-0.4, 0.6, 0.7).normalize() },
    uCoral: { value: new THREE.Color('#E05347') },
    uCurl: { value: 0 },
    uCurlC: { value: 0 },
    uCurlR: { value: 0.12 },
    uAlpha: { value: 1 },
  };
  return new THREE.ShaderMaterial({
    uniforms: uniforms as unknown as { [k: string]: THREE.IUniform },
    vertexShader: VERT,
    fragmentShader: FRAG,
    side: THREE.DoubleSide,
    toneMapped: false,
    transparent: !!opts.transparent,
  });
}
