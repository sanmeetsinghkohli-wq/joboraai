import Link from 'next/link';
import { Header } from './sections/Header';
import { Footer } from './sections/Footer';

/** Shared shell for public, signed-out pages linked from the landing footer. */
export function InfoPage({
  eyebrow,
  title,
  intro,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F2] text-[#2A1728] font-sans">
      <Header />
      <main id="main" className="flex-1">
        <div className="mx-auto max-w-3xl px-6 py-16 lg:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#E05347]">{eyebrow}</p>
          <h1 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl">{title}</h1>
          {intro && <p className="mt-5 text-lg leading-relaxed text-[#63555F]">{intro}</p>}
          {updated && <p className="mt-3 text-sm text-[#63555F]">Last updated {updated}</p>}
          <div className="info-prose mt-10 space-y-8 text-[15px] leading-relaxed text-[#3E2F3B]">{children}</div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-serif text-2xl text-[#2A1728]">{title}</h2>
      {children}
    </section>
  );
}

export function Bullets({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 marker:text-[#E05347]">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export function CtaRow({ primary, secondary }: { primary: { href: string; label: string }; secondary?: { href: string; label: string } }) {
  return (
    <div className="flex flex-wrap gap-3 pt-2">
      <Link
        href={primary.href}
        className="inline-flex items-center rounded-full bg-[#2A1728] px-6 py-3 text-sm font-semibold text-white hover:bg-[#3D223B]"
      >
        {primary.label}
      </Link>
      {secondary && (
        <Link
          href={secondary.href}
          className="inline-flex items-center rounded-full border border-[#EDE5E1] bg-white px-6 py-3 text-sm font-semibold text-[#2A1728] hover:border-[#E05347]/50"
        >
          {secondary.label}
        </Link>
      )}
    </div>
  );
}
