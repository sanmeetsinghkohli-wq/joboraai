# Jobora AI landing: 3D resume spec

Branch `ui-3d-landing`. Stack: Next 14.2.5, React 18.3, three ^0.169, @react-three/fiber ^8.17, drei ^9.114, gsap ^3.12.5 (no SplitText, split text by hand), lenis ^1.1.

Concept: one A4 resume, built in code, is the hero of the whole page. **Global scroll progress `p ∈ [0,1]` is the only thing that drives it.** Nothing in the scene reads `window.scrollY` directly.

## 1. File and component map

Everything goes under `apps/web/src/components/landing/`. Owners: **A** = plumbing/page, **B** = WebGL, **C** = sections/CSS fallback.

| Path | Owner | Exports / contract |
|---|---|---|
| `scroll-state.ts` | A | `type SectionId = 'hero'\|'features'\|'how'\|'pricing'\|'cta'`; `SECTION_RANGES: Record<SectionId,[number,number]>` = hero [0,.12], features [.12,.40], how [.40,.66], pricing [.66,.84], cta [.84,1]; `scrollState: { progress: number; velocity: number }` (a mutable object, read it inside `useFrame`); `setProgress(p, v)` (only ScrollDriver calls it); `subscribe(fn: (p:number)=>void): () => void`; `local(id, p = scrollState.progress): number` (clamped 0..1 within the section); `useSectionProgress(id): number` (React hook, rAF-throttled, for DOM) |
| `ScrollDriver.tsx` | A | `<ScrollDriver />`, renders null. Sets up Lenis `{ lerp: 0.1, smoothWheel: true }`, drives it from `gsap.ticker`, calls `ScrollTrigger.update` on every Lenis scroll. Measures `[data-scroll-section]` tops with a ResizeObserver on `document.body`. Maps raw scroll y piecewise and linearly so each section's DOM span lands on its `SECTION_RANGES` entry; the last span ends at `maxScroll`. Skips Lenis when the tier is `static`. |
| `use-render-tier.ts` | A | `type RenderTier = 'webgl'\|'css'\|'static'`; `useRenderTier(): RenderTier` (returns `'static'` on SSR and the first client render, then resolves); `downgradeTier(t)` |
| `keyframes.ts` | B (data from section 2) | `interface ResumePose { pos:[n,n,n]; rot:[n,n,n] /*deg*/; scale:n; twist:n /*deg*/; bend:n /*1/units*/; peel:n; fold:n; glow:n; float:n }`; `KEYFRAMES: {p:number; pose:ResumePose; ease:EaseName}[]`; `samplePose(p): ResumePose`; `EASE: Record<EaseName,(t)=>number>`. Pure TS, no three import. The CSS tier uses it too. |
| `ResumeStage.tsx` | A | `<ResumeStage />` with no props. A `fixed inset-0 z-0 pointer-events-none` layer that picks the tier. WebGL: `dynamic(() => import('./three/ResumeCanvas'), { ssr:false, loading: () => null })`, mounted in `requestIdleCallback` after first paint. CSS tier: `<ResumeCss/>`. Static tier: renders nothing (the sections draw their own static visuals). |
| `three/ResumeCanvas.tsx` | B | Default export. `<Canvas>` with camera fov 30 at (0,0,9), `gl={{ antialias:true, alpha:true, powerPreference:'high-performance' }}`, a dpr clamp and a `PerformanceMonitor`. Calls `downgradeTier('css')` on `webglcontextlost` or a sustained decline. |
| `three/ResumeScene.tsx` | B | Lights (uniforms only), `ResumeMesh`, `PeelLayers`, `Halo`, `FakeShadow`, `Particles`, `InkBackdrop` |
| `three/ResumeMesh.tsx` | B | PlaneGeometry(2.1, 2.97, 64, 90) with the `resumeMaterial` |
| `three/resumeMaterial.ts` | B | `createResumeMaterial(front, back): ShaderMaterial` with the uniforms from section 3 |
| `three/textures.ts` | B, C consumes | `drawResumeFront(ctx, w, h)`, `drawResumeBack(ctx,w,h)`, `drawLayer(ctx, w, h, kind:'ats'\|'keywords'\|'bullets')`, `whenFontsReady(): Promise<void>`. Each one only draws onto a 2D context, so the CSS tier reuses it. |
| `three/Particles.tsx`, `three/InkBackdrop.tsx` | B | See section 5 |
| `ResumeCss.tsx` | C | CSS-3D version driven by `samplePose` (see section 6) |
| `sections/{Header,Hero,Features,HowItWorks,Pricing,Cta,Footer,VideoModal}.tsx` | C | Each root has `id` and `data-scroll-section="<SectionId>"` (Header, Footer and VideoModal don't). Header, Footer and VideoModal are lifted out of the current page.tsx unchanged apart from the copy fixes in section 8. |
| `apps/web/src/app/page.tsx` | A | Composition only: `<ScrollDriver/><ResumeStage/><Header/><main className="relative z-10">…sections…</main><Footer/>` |

## 2. Keyframe table (global p)

Units: world units. Camera z = 9, so the visible height is about 4.8 units. Rotation is in degrees (XYZ order). The ease is applied going from a row to the next row. Interpolate every field linearly after easing the segment t.

| p | pos x,y,z | rot x,y,z | scale | twist | bend | peel | fold | glow | ease |
|---|---|---|---|---|---|---|---|---|---|
| 0.00 | 1.6, 0, 0 | -8, -22, 4 | 1.00 | 0 | 0.12 | 0 | 0 | 0 | inOutSine |
| 0.06 | 1.5, -0.1, 0.4 | -4, -10, 2 | 1.04 | 22 | 0.28 | 0 | 0 | 0 | inOutCubic |
| 0.12 | 1.7, 0, 0 | 0, -10, 0 | 1.00 | 0 | 0.05 | 0 | 0 | 0 | linear |
| 0.18 | 1.7, 0, 0 | 0, -14, 0 | 1.00 | 0 | 0.05 | 0 | 0 | 0 | outCubic |
| 0.30 | 1.5, 0, -0.4 | -6, -24, 0 | 0.94 | 0 | 0.10 | 1 | 0 | 0 | linear |
| 0.37 | same | same | 0.94 | 0 | 0.10 | 1 | 0 | 0 | inOutCubic |
| 0.42 | 1.6, 0, 0 | 0, -8, 0 | 1.00 | 0 | 0.05 | 0 | 0 | 0 | inOutCubic |
| 0.48 | 1.6, 0.1, 0.3 | -4, 90, -3 | 1.02 | 35 | 0.22 | 0 | 0 | 0 | inOutCubic |
| 0.54 | 1.6, 0, 0 | 0, 180, 0 | 1.00 | 0 | 0.04 | 0 | 0 | 0 | linear |
| 0.62 | 1.6, 0, 0 | 0, 188, 0 | 1.00 | 0 | 0.04 | 0 | 0 | 0 | inOutCubic |
| 0.70 | 0, 0.35, -1.5 | 0, 360, 0 | 0.78 | 0 | 0 | 0 | 0 | 0.4 | outCubic |
| 0.78 | 0, 0.35, -1.5 | 0, 360, 0 | 0.78 | 0 | 0 | 0 | 0 | 1.0 | linear |
| 0.84 | 0, 0.2, -0.5 | 0, 360, 0 | 0.85 | 0 | 0 | 0 | 0 | 0.6 | inOutCubic |
| 0.94 | 0, 0.1, 0 | -20, 360, 0 | 0.80 | 0 | 0 | 0 | 1 | 0.3 | inExpo |
| 1.00 | 4.5, 3, -4 | -70, 385, -15 | 0.60 | 0 | 0 | 0 | 1 | 0 | n/a |

Easing functions: inOutSine `-(cos(πt)-1)/2`; inOutCubic `t<.5 ? 4t³ : 1-(-2t+2)³/2`; outCubic `1-(1-t)³`; inExpo `t==0 ? 0 : 2^(10t-10)`.

Extras that sit on top of the table:
- **Float:** `y += A·sin(t·2π·0.25)` and `rotZ += 1.5°·sin(t·2π·0.17)`, with `A = 0.08·(1-smoothstep(0,.12,p)) + 0.02`, multiplied by `(1 - fold)`.
- **Pointer tilt:** hero only, desktop only, ±6° on rotX/rotY, damped with `1-exp(-dt·6)`.
- **Display smoothing:** the scene shows `pSmooth += (p - pSmooth)·(1-exp(-dt·10))`.
- **Peel per layer** (i = 0, 1, 2):
  - `li = EASE.outCubic(clamp((peel - 0.15i)/0.7, 0, 1))`.
  - Rest position is coplanar on the resume at z +0.002, over band y = +0.9 / 0 / -0.9: ATS over the header, keywords over the skills block, bullets over experience.
  - Target offset is `(-1.1-0.15i, 1.0-1.0i, 0.35+0.3i)` with rotZ `(-4+4i)°`.
  - Layer card size is 1.9 × 1.0.
- **Restack:** p .37 to .42 returns peel to 0, so the layers slide back in.

## 3. Deformation (vertex shader)

Uniforms: `uTwist` (rad), `uBend`, `uFold`, `uGlow`, `uTime`, `uFront`, `uBack` (sampler2D), `uLightDir = normalize(-0.4, 0.6, 0.7)`, `uCoral = #E05347`. Constants: `W = 2.1`, `H = 2.97`.

`vec3 deform(vec3 p)` applies these steps in order:

1. **Folds** (paper space; they only take effect when `uFold > 0`). Take `f1 = smoothstep(0, .45, uFold)` and `f2 = smoothstep(.4, 1, uFold)`.
   - Top-left flap: the region `y > x + H/2` with x < 0. Rotate it by `π·f1` about the axis through `a = (0, H/2, 0)` with direction `d = normalize(-1, -1, 0)`.
   - Top-right flap: mirror of the top-left one (`y > -x + H/2`, `d = normalize(1, -1, 0)`).
   - Use Rodrigues: `p' = a + v·cosθ + (d×v)·sinθ + d(d·v)(1-cosθ)`, with `v = p - a`. Choose the sign of θ so the flap lands on +z. Add `z += 0.003·f1` to avoid z-fighting.
   - Halves: decide from the **rest** x sign, then rotate about the y-axis through the origin by `±70°·f2` so both halves move to +z. That gives the dart keel.
2. **Bend** (cylindrical, along x): if `|uBend| > 1e-4`, then `θ = x·uBend`, `x' = sin θ / uBend`, `z' = z + (1 - cos θ)/uBend`.
3. **Twist** (about the y-axis, proportional to height): `a = uTwist·(y/H)`, then `x' = x cos a - z sin a` and `z' = x sin a + z cos a`. The total twist from top to bottom equals `uTwist`.

**Normals** come from finite differences: `n = normalize(cross(deform(p+εx̂)-deform(p), deform(p+εŷ)-deform(p)))` with ε = 0.01. Pass the varyings `vNormal`, `vViewDir` and `vUv`.

**Fragment shader:**
- Base colour: `tex = gl_FrontFacing ? texture(uFront, vUv) : texture(uBack, vec2(1.-vUv.x, vUv.y))`. When `uFold > 0.001`, back faces use plain ivory instead. Flip n for back faces.
- `shade = 0.62 + 0.38·max(dot(n, L), 0)`, plus spec `0.06·pow(max(dot(reflect(-L,n),V),0), 24)`.
- `rim = pow(1 - abs(dot(n,V)), 3)·uGlow`. Final colour: `tex·shade + uCoral·rim·0.8`.
- `DoubleSide`, `toneMapped:false`, and the textures use `SRGBColorSpace`.

**Peel layers** use the same material code with `uFold = 0`. On top of that they get a curl driven by `k = sin(π·li)`:
- The curl line is `c = mix(-h/2, h/2, li)` and r = 0.12.
- For `d = c - y > 0`: `φ = d/r`. If φ < π, then `y' = c - r sin φ` and `z' = r(1 - cos φ)`. Otherwise `y' = c + (d - πr)` and `z' = 2r`.
- Final position: `mix(flat, curled, k)`.

## 4. Resume texture

- **Sizes:**
  - Front and back: 1024×1448 on WebGL, 620×877 on the CSS tier.
  - Layers: 1024×540.
  - All textures use `anisotropy = min(8, max)` and mipmaps. Draw after `whenFontsReady()` (`document.fonts.load` for '600 64px Newsreader' and '500 24px Plus Jakarta Sans'), then set `needsUpdate`.
- **Front** (fictional sample person, small "SAMPLE" caption bottom-right at 40% plum):
  - Margins are 7% of the width. Background is #FFFFFF, with a 6px coral rule along the top edge.
  - **Name:** "Amira Haddad", Newsreader 600, 6.2% of the height, plum. Under it: "Data Analyst → Machine Learning Engineer" in Jakarta 500, coral. Contact line: "Dubai, UAE · amira@example.com · linkedin.com/in/example".
  - Section headers in Jakarta 700 caps with 0.08em tracking, plum, each followed by a #EDE5E1 hairline.
  - **Summary:** 2 lines.
  - **Experience:** two roles with 3 bullets each: "Data Analyst, Aster Labs, 2024 to now" and "Analytics Intern, Qamar Fintech, 2023". Draw bullets as 13px text lines. Underline matched keywords (Python, SQL, Tableau) in coral at 35% alpha.
  - **Projects:** 2 lines.
  - **Education:** "B.Sc. Computer Science, 2025".
  - **Skills:** chips with a #FAF6F2 fill and #EDE5E1 stroke.
- **Back** ("Your applications" pipeline): five Kanban columns, **Saved, Tailored, Applied, Interview, Offer**.
  - Each column has 1 to 3 cards (fictional companies), each with a source tag "Remotive" or "Arbeitnow" and a stage dot in plum or coral.
  - Header: "Tracked in Jobora" in Newsreader. Background is #FAF6F2.
- **Layers** (each has a white card, a 24px radius drawn in canvas, and the caption "Sample analysis"):
  - `ats`: a ring gauge "82 / 100 ATS match" (coral arc on an #EDE5E1 track) and the line "Strong fit for Junior ML Engineer".
  - `keywords`: "Matched": Python, SQL, Tableau (plum chips). "Missing": Airflow, dbt, A/B testing (coral outline chips).
  - `bullets`: "Before" in muted text with a strikethrough: "Made dashboards for sales team". "After" in plum with coral highlights: "Built 6 Tableau dashboards used weekly by the sales team to track pipeline".

## 5. Lighting, background, particles, colour

- **Palette only:** ivory #FAF6F2, plum #2A1728, coral #E05347, paper #FFFFFF, hairline #EDE5E1, muted #63555F, and peach #F7CEBA for glow tints only. Drop emerald and violet from the landing (that includes the checkmarks). The landing does not use the globals.css coral #E76F72 or plum #351B32.
- **Lighting:** none from three.js. All shading is in the shader (section 3).
- **Background:**
  - Sections keep their CSS backgrounds and the canvas is transparent.
  - **InkBackdrop** is a full-screen quad rendered at half resolution in hero only, faded out by `1 - smoothstep(.05, .12, p)`. It computes `ink = smoothstep(.45, .6, fbm(uv·2.2 + uTime·.03) + .35·(1 - length(uv - (.72, .45))))` with 3-octave value noise. Colour: `mix(ivory, peach, ink)` with a coral fleck where ink > .85. Alpha is 0.5.
  - The CTA section is plum in CSS. Nothing in the scene turns dark.
- **Halo:** a plane at 1.8× resume size, z -0.3 behind the resume, with a radial gradient canvas (coral at 0.35, then peach, then transparent). Opacity `uGlow·0.6`, normal blending.
- **FakeShadow:** an ellipse texture at y -1.9, plum at alpha 0.16. It scales with `pose.scale` and fades with fold.
- **Particles:** `Points`, 500 on desktop and 0 on the CSS tier. Size 2 to 4 px, in coral (70%) and plum (30%) at alpha 0.5. They drift with `curl-ish sin/cos(uTime·.1 + seed)`.
  - At p > .9 the particles near the plane become a trail: emit along the plane's path and fade over 0.8 s.
  - On the plum CTA background they switch to ivory and coral.

## 6. Fallbacks

`useRenderTier` resolves in this order:
1. `prefers-reduced-motion: reduce` gives **static**. It listens to changes.
2. No WebGL (`canvas.getContext('webgl2') || 'webgl'` fails) gives **css**.
3. `innerWidth < 1024`, or `navigator.hardwareConcurrency <= 4`, or `deviceMemory <= 4`, or `connection.saveData` gives **css**.
4. Otherwise **webgl**. At runtime, a `PerformanceMonitor` decline sets dpr to 1. If the decline continues for more than 3 s below 45 fps, or the WebGL context is lost, call `downgradeTier('css')`.

**CSS tier (`ResumeCss`):**
- A 210:297 div of width `min(56vw, 300px)`, with `perspective: 1200px` on its parent.
- Faces are 2D `<canvas>` elements drawn with `drawResumeFront` and `drawResumeBack`, and use `backface-visibility: hidden`.
- Apply `samplePose(p)` as `translate3d(x·k, -y·k, 0) rotateX rotateY rotateZ scale`, where k = 90 px per unit and x is forced to 0 below 1024 px. The resume sits in the top 45 svh. Below 1024 px, sections add a `h-[48svh]` spacer above their sticky text.
- Twist and bend are dropped. Peel uses three absolutely positioned layer canvases that translate by `li`.
- Fold crossfades to an inline SVG paper plane that translates off to the top-right.
- Glow is `box-shadow: 0 0 80px rgba(224,83,71,.35·glow)`. Update through `subscribe`, writing styles straight to the element without re-rendering React.

**Static tier:**
- No Lenis and no fixed layer.
- Hero shows the front canvas with `rotateY(-12deg) rotateX(4deg)`.
- Features shows the three layer cards as a static stack. How It Works shows the back pipeline as a flat card. Every piece of copy stays visible, with no reveal animations.

**SSR:** the first render is always the static layout, so the server markup matches. The Canvas never renders on the server.

## 7. Performance budget

- **Frame rate:** 60 fps on an M1 or Iris Xe at 1440p. The JS frame stays under 4 ms and the GPU frame under 8 ms.
- **dpr:** `[1, 1.75]`, and 1 after a decline. InkBackdrop renders at 0.5×.
- **frameloop:**
  - `'always'` only while the document is visible and `p < 1`.
  - `'never'` when the tab is hidden (`visibilitychange`), or once the footer is in view and the plane has left.
  - The fixed canvas otherwise stays at `'always'`, because float is continuous.
- **Scene size:** draw calls ≤ 10, triangles ≤ 20k, GPU texture memory ≤ 32 MB. Dispose everything on unmount.
- **Hot path:** no React state inside `useFrame`. Read `scrollState` and write uniforms directly.
- **Bundle:**
  - three, fiber and drei are lazy-loaded off the critical path. Import from drei only `PerformanceMonitor`.
  - No drei `Text` or `Environment`, no postprocessing, no model or HDR files.
- **Core Web Vitals:** LCP is the hero h1, which is server-rendered text. CLS = 0, because the fixed layer has no layout impact.

## 8. Sections: layout and copy

Global rules:
- Desktop text sits in columns 1 to 6 of a 12-column grid. The resume owns the right half.
- **Reveals:** headings are split by hand into line spans (`overflow-hidden`) and animated from `yPercent:110` with `expo.out`, 1.1 s, stagger 0.08. Body text fades from y 16.
- **Remove these unverifiable claims:** "Trusted by students & professionals", "Join thousands of university graduates…", the fake "Interview Invitation! Google" card, and the footer's "All AI services operating normally". Plus and Pro feature items and the "7-day trial" are kept as is, but the owner must confirm them before launch.

**Hero** (100 svh):
- Eyebrow: "AI career copilot".
- H1, kept: "Find your fit. / *Make your move.*" with the italic line in coral-gradient.
- Sub: "Jobora finds roles that fit you, tailors your CV and cover letter to each one, and sends the application from your own Gmail or Outlook."
- Primary CTA "Get started free" and secondary "Watch the 30-second tour" (the existing modal).
- Fact row: "No credit card required · Upload PDF or DOCX · Send from Gmail or Outlook".
- Delete the stock photo. Add a scroll cue at the bottom: "Scroll to see your CV, decoded".

**Features** (≥ 240 vh, sticky inner `h-screen`):
- H2: "Your CV, read the way hiring software reads it."
- Three steps light up as the layers peel (active = `floor(local·3)`):
  1. "Match score: see how your CV scores against the job description."
  2. "Keyword gaps: what you have and what the role asks for."
  3. "Rewritten bullets: AI suggestions you review as a diff before anything changes."
- After the sticky block comes a 4-card bento ("Everything you need to move forward") with the existing four features and links. The CV Studio tile is twice as wide.

**How It Works** (≥ 220 vh, sticky):
- H2: "From search to sent, in four steps."
- The existing four steps are a vertical list with a coral progress rail that fills by local progress.
- Step 2 copy names the real sources: "Live roles from Remotive and Arbeitnow, scored against your skills."
- The resume flips to show the pipeline. The "Built for students and professionals" card stays as a small aside.

**Pricing** (≥ 160 vh):
- H2: "Simple, transparent pricing." Same three plans and prices ($0 / $9.99 / $19.99).
- Cards are `bg-white/70 backdrop-blur-xl`. Plus is raised by 24 px with a coral border. The resume glows behind Plus.
- Checkmarks are plum on Free and Pro, coral on Plus.

**CTA** (≥ 150 vh, sticky, plum):
- H2: "Ready to make your next move?"
- Sub: "Set your preferences, tailor your first CV and send it from your own inbox. Free to start."
- The paper plane folds and flies top-right. Buttons: "Get started free" and "Contact sales". The current link to `/email-composer` is wrong, so flag it to the owner.

**Footer:** unchanged apart from the removed status line.

## 9. Acceptance checklist

- [ ] `pnpm build`/`next build` passes, and no three code is in the first-load JS of `/` (check the build output).
- [ ] Scrolling top to bottom plays every keyframe row. Scrubbing backwards plays them in reverse with no jumps. Fold reverses cleanly.
- [ ] The only scroll source is `scrollState.progress`, and no component reads `scrollY`.
- [ ] Section boundaries land on `SECTION_RANGES` (±0.01) at 1280, 1440 and 1920 widths after a resize.
- [ ] Peel shows three readable layer cards. The back shows the 5-column pipeline. Pricing is flat (twist = bend = 0) with a visible coral rim and halo. CTA reads as a dart-shaped paper plane.
- [ ] All resume text is legible at 1440p (body ≥ 11 px on screen when flat).
- [ ] No colours outside the section 5 palette. No emerald.
- [ ] Reduced motion gives the static tier, with no Lenis and no canvas. Below 1024 px or on low-power devices you get the CSS tier. With WebGL disabled you get the CSS tier. A context-loss simulation downgrades with no blank screen.
- [ ] 60 fps in a Chrome performance trace on mid hardware, no long tasks over 50 ms during scroll, and the GPU-memory and draw-call limits from section 7 are met.
- [ ] Lighthouse mobile Performance ≥ 85, CLS 0, and the LCP element is the h1.
- [ ] None of the removed claims appear. Prices and plan names are unchanged.
- [ ] Keyboard and screen reader: the canvas has `aria-hidden`, all copy is real DOM text, focus order is unchanged, and the video modal still works.
