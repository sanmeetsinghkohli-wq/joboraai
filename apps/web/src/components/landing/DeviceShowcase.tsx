'use client';

import { useScrollProgress } from './useScrollProgress';

const CAPTIONS = [
  {
    step: 1,
    title: 'Every live role, one list.',
    body: 'Roles from public job boards and employer career pages, searchable by keyword and region.',
  },
  {
    step: 2,
    title: 'See exactly where you fit.',
    body: 'Each role shows which of its listed skills are on your profile — and which are not.',
  },
  {
    step: 3,
    title: 'Never lose track again.',
    body: 'Move every application from Saved to Offer on one board.',
  },
];

/**
 * Apple-style product reveal: as the section scrolls past, the laptop lid
 * swings open, the device rises and straightens, and the screen lights up.
 * Driven entirely by the `--p` CSS variable from useScrollProgress.
 *
 * The screen shows abstract shapes only — no invented companies or numbers.
 */
export function DeviceShowcase() {
  const ref = useScrollProgress<HTMLElement>();

  return (
    <section
      ref={ref}
      aria-label="Jobora in one screen"
      data-step="1"
      className="group relative h-[260vh] bg-plum-900 [--p:0]"
    >
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden px-4 pt-16">
        {/* Glow that brightens as the screen opens */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[60vmin] w-[90vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-coral/40 blur-[90px]"
          style={{ opacity: 'calc(var(--p) * 0.9)' }}
        />

        {/* Captions — one visible per step */}
        <div className="relative mb-6 h-24 w-full max-w-2xl text-center sm:mb-10 sm:h-28">
          {CAPTIONS.map((c) => (
            <div
              key={c.step}
              className={[
                'absolute inset-0 translate-y-3 opacity-0 transition-[opacity,transform] duration-500 ease-out',
                c.step === 1 && 'group-data-[step="1"]:translate-y-0 group-data-[step="1"]:opacity-100',
                c.step === 2 && 'group-data-[step="2"]:translate-y-0 group-data-[step="2"]:opacity-100',
                c.step === 3 && 'group-data-[step="3"]:translate-y-0 group-data-[step="3"]:opacity-100',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <h2 className="font-serif text-3xl text-paper sm:text-5xl">{c.title}</h2>
              <p className="mx-auto mt-3 max-w-lg text-sm text-plum-100 sm:text-base">{c.body}</p>
            </div>
          ))}
        </div>

        {/* The laptop */}
        {/* Width is capped by screen height too, so caption + laptop always fit. */}
        <div
          aria-hidden="true"
          className="relative w-[min(92vw,54rem,calc((100vh-17rem)*1.55))] [perspective:2400px]"
        >
          <div
            className="preserve-3d will-change-transform"
            style={{
              transform:
                'translateY(calc((1 - var(--p)) * 12%)) rotateX(calc(28deg - var(--p) * 20deg)) scale(calc(0.82 + var(--p) * 0.18))',
            }}
          >
            {/* Lid */}
            <div
              className="preserve-3d relative origin-bottom will-change-transform"
              style={{ transform: 'rotateX(calc((1 - min(1, var(--p) * 1.6)) * -86deg))' }}
            >
              <div className="rounded-t-[1.6rem] border border-paper/10 bg-[#140912] p-[1.6%] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.7)]">
                <div className="relative aspect-[16/10] overflow-hidden rounded-[0.9rem] bg-ivory">
                  <Screen />
                  {/* Glass reflection sweeping across as it opens */}
                  <div
                    className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.35)_50%,transparent_65%)]"
                    style={{ transform: 'translateX(calc(-60% + var(--p) * 120%))' }}
                  />
                  {/* Dark until the lid opens */}
                  <div className="absolute inset-0 bg-[#140912]" style={{ opacity: 'calc(1 - var(--p) * 2.2)' }} />
                </div>
              </div>
            </div>

            {/* Base */}
            <div className="relative mx-[-4%] h-[0.9rem] rounded-b-[1.4rem] bg-gradient-to-b from-[#d9cfd6] to-[#9c8f99] shadow-[0_30px_60px_-10px_rgba(0,0,0,0.6)] sm:h-[1.25rem]">
              <div className="absolute left-1/2 top-0 h-[40%] w-[16%] -translate-x-1/2 rounded-b-lg bg-[#b5a9b2]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** An abstract Jobora screen: sidebar, list and board, in brand colours. */
function Screen() {
  return (
    // Sized off the viewport so every bar scales with the laptop.
    <div className="flex h-full text-[min(1.5vw,13px)]" style={{ opacity: 'calc(var(--p) * 2 - 0.3)' }}>
      {/* Sidebar */}
      <div className="flex w-[17%] flex-col gap-[6%] border-r border-line bg-ivory p-[2.2%]">
        <div className="flex items-center gap-[8%]">
          <span className="aspect-square w-[22%] rounded-[25%] bg-gradient-to-br from-coral to-plum" />
          <span className="h-[0.5em] w-1/2 rounded-full bg-plum/70" />
        </div>
        {[true, false, false, false, false, false].map((active, i) => (
          <span key={i} className={`h-[1.4em] rounded-md ${active ? 'bg-plum' : 'bg-sand'}`} />
        ))}
      </div>

      {/* Main */}
      <div className="flex flex-1 flex-col gap-[3%] p-[2.5%]">
        <span className="h-[1.1em] w-[38%] rounded-full bg-plum/80" />
        <div className="grid flex-1 grid-cols-[1.1fr_1fr] gap-[3%]">
          {/* Job list with skill bars */}
          <div className="flex flex-col gap-[4%]">
            {[0.33, 0.25, 0.25, 0.2].map((fill, i) => (
              <div key={i} className="flex flex-1 items-center gap-[5%] rounded-lg border border-line bg-paper px-[5%]">
                <span className="aspect-square w-[11%] rounded-md bg-plum-50" />
                <div className="flex flex-1 flex-col gap-[0.35em]">
                  <span className="h-[0.45em] w-3/4 rounded-full bg-ink/70" />
                  <span className="h-[0.35em] w-1/2 rounded-full bg-ink/25" />
                  <span className="h-[0.3em] w-2/5 overflow-hidden rounded-full bg-sand">
                    <span className="block h-full rounded-full bg-coral" style={{ width: `${fill * 100 + 30}%` }} />
                  </span>
                </div>
              </div>
            ))}
          </div>
          {/* Board */}
          <div className="grid grid-cols-3 gap-[4%] rounded-lg border border-line bg-paper p-[4%]">
            {[3, 2, 1].map((n, col) => (
              <div key={col} className="flex flex-col gap-[6%] rounded-md bg-ivory p-[6%]">
                <span className={`h-[0.4em] w-2/3 rounded-full ${col === 2 ? 'bg-success' : col === 1 ? 'bg-coral' : 'bg-plum'}`} />
                {Array.from({ length: n }).map((_, i) => (
                  <span key={i} className="h-[2.2em] rounded border border-line bg-paper" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
