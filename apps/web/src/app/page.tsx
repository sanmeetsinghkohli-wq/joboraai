import Link from 'next/link';
import {
  ArrowRight,
  FileText,
  ListChecks,
  Mic,
  Search,
  Send,
  Sparkles,
  Target,
  Lock,
  ShieldCheck,
  Globe,
} from 'lucide-react';
import { HeroStage } from '@/components/landing/HeroStage';
import { LandingNav } from '@/components/landing/LandingNav';
import { ButtonLink } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { Tilt } from '@/components/ui/tilt';

const FEATURES = [
  {
    icon: Search,
    title: 'Live job search',
    body: 'Roles pulled from public job boards and employer career pages, searchable by keyword and by region — including the UAE, Saudi Arabia, Qatar and remote.',
  },
  {
    icon: Target,
    title: 'Skill comparison you can read',
    body: 'For each role, see exactly which of its listed skills are on your profile and which are not. A count you can check, not a mystery percentage.',
  },
  {
    icon: Send,
    title: 'Application tracker',
    body: 'Every application in one board, from Saved through Applied and Interview to Offer. Move a card when something changes and export the list whenever you like.',
  },
  {
    icon: FileText,
    title: 'CV and cover letter drafts',
    body: 'Start a CV or a cover letter from the details in your own profile, edit freely, then print or save it as a PDF from your browser.',
  },
  {
    icon: Mic,
    title: 'Interview practice',
    body: 'Practice questions built from the skills a role actually lists, with a place to write your answer and a STAR checklist to review it against.',
  },
  {
    icon: Sparkles,
    title: 'Copilot',
    body: 'Ask about your search in plain language. Copilot answers with your profile, your tracked applications and the roles on screen as context.',
  },
];

const SOURCES = ['Remotive', 'Arbeitnow', 'Jobicy', 'Himalayas', 'Employer career pages'];

const TRUST = [
  { icon: ShieldCheck, text: 'Nothing is sent without you' },
  { icon: Lock, text: 'Drafts use only what you entered' },
  { icon: Globe, text: 'UAE, Saudi Arabia, Qatar and remote' },
];

const STEPS = [
  {
    title: 'Tell us what you are looking for',
    body: 'Add your target role, location and skills. It takes a couple of minutes and you can change it any time.',
  },
  {
    title: 'Compare roles against your skills',
    body: 'Browse live roles ordered by how many of their listed skills you already have, and save the ones worth a closer look.',
  },
  {
    title: 'Apply and keep track',
    body: 'Draft your documents, apply on the employer’s own page, and record each application so nothing slips.',
  },
];

const PRINCIPLES = [
  {
    title: 'No invented numbers',
    body: 'When there is not enough information to compare you with a role, Jobora says so instead of showing a score.',
  },
  {
    title: 'Nothing is sent without you',
    body: 'Applications open on the employer’s own site and emails open in your own mail app. You press send.',
  },
  {
    title: 'Your words stay yours',
    body: 'Drafts are built only from what you entered. Jobora never adds experience, employers or qualifications you did not give it.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-ivory">
      <LandingNav />

      <main id="main">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(50rem_28rem_at_50%_-10%,rgba(231,111,114,0.16),transparent_70%)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(53,27,50,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(53,27,50,0.05)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_70%)]"
          />
          <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-10 text-center sm:px-6 sm:pb-24 sm:pt-24">
            <div className="animate-fade-up">
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-paper/80 px-3 py-1 text-xs font-semibold text-plum shadow-card backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-coral" aria-hidden="true" />
                Your job search, in one workspace
              </span>
              <h1 className="mx-auto mt-6 max-w-3xl font-serif text-[2.6rem] leading-[1.05] tracking-tight text-plum sm:text-7xl">
                Find your fit. <em className="text-coral-700">Make your move.</em>
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-lg text-ink-muted">
                Live roles, your skills and every application you send — side by side, so you always know what to
                apply for next.
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <ButtonLink href="/auth?tab=signup" size="lg">
                  Get started free
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </ButtonLink>
                <ButtonLink href="#features" variant="secondary" size="lg">
                  See what it does
                </ButtonLink>
              </div>
            </div>

            <HeroStage />
          </div>
        </section>

        {/* Trust strip */}
        <section aria-label="Where roles come from" className="border-t border-line bg-ivory">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-ink-subtle">
              Live roles from public job boards and employer career pages
            </p>
            <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-semibold text-ink-muted">
              {SOURCES.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <ul className="mx-auto mt-8 grid max-w-4xl gap-3 sm:grid-cols-3">
              {TRUST.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink">
                  <Icon className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Features — bento grid */}
        <section id="features" className="scroll-mt-20 border-t border-line bg-paper">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
            <div className="mx-auto max-w-2xl text-center">
              <p className="eyebrow">What you can do</p>
              <h2 className="mt-3 font-serif text-4xl text-plum">Everything between “looking” and “hired”</h2>
              <p className="mt-3 text-ink-muted">Six tools sharing one profile. Enter your details once, use them everywhere.</p>
            </div>
            <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, body }, i) => (
                <li key={title} className={[0, 3, 5].includes(i) ? 'lg:col-span-2' : ''}>
                  <Tilt max={5} lift={12} sheen className="h-full">
                    <article
                      className={`flex h-full flex-col rounded-2xl border p-7 shadow-card transition-shadow duration-200 hover:shadow-raised ${
                        i === 0 ? 'border-plum bg-plum text-paper' : 'border-line bg-ivory'
                      }`}
                    >
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-xl [transform:translateZ(30px)] ${
                          i === 0 ? 'bg-coral text-white' : 'bg-plum text-coral'
                        }`}
                      >
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <h3 className={`mt-6 font-serif text-2xl ${i === 0 ? 'text-paper' : 'text-plum'}`}>{title}</h3>
                      <p className={`mt-2 max-w-md text-sm ${i === 0 ? 'text-plum-100' : 'text-ink-muted'}`}>{body}</p>
                    </article>
                  </Tilt>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-20 border-t border-line">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
            <div className="max-w-2xl">
              <p className="eyebrow">How it works</p>
              <h2 className="mt-3 font-serif text-3xl text-plum">Three steps, then repeat</h2>
            </div>
            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <li key={step.title} className="relative rounded-lg border border-line bg-paper p-6 shadow-card">
                  <span className="font-serif text-4xl text-coral" aria-hidden="true">
                    {i + 1}
                  </span>
                  <h3 className="mt-3 font-serif text-xl text-plum">{step.title}</h3>
                  <p className="mt-2 text-sm text-ink-muted">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Principles */}
        <section id="principles" className="scroll-mt-20 border-t border-line bg-paper">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.4fr] lg:py-24">
            <div>
              <p className="eyebrow">Our approach</p>
              <h2 className="mt-3 font-serif text-3xl text-plum">Straightforward by design</h2>
              <p className="mt-3 text-ink-muted">
                A job search is stressful enough. Jobora is built to tell you what it knows, show its working, and stay
                out of the way.
              </p>
            </div>
            <ul className="grid gap-4">
              {PRINCIPLES.map((p) => (
                <li key={p.title} className="flex gap-4 rounded-lg border border-line bg-ivory p-5">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success-100 text-success-700">
                    <ListChecks className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-plum">{p.title}</h3>
                    <p className="mt-1 text-sm text-ink-muted">{p.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Closing call to action */}
        <section className="px-4 py-16 sm:px-6 lg:py-24">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-2xl bg-plum px-6 py-14 text-center sm:px-12">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(40rem_20rem_at_50%_120%,rgba(231,111,114,0.45),transparent_70%)]"
            />
            <div className="relative">
              <h2 className="font-serif text-3xl text-paper sm:text-4xl">Ready to make your next move?</h2>
              <p className="mx-auto mt-3 max-w-xl text-plum-100">
                Set up your profile and see how today’s live roles compare with your skills.
              </p>
              <div className="mt-8 flex justify-center">
                <ButtonLink href="/auth?tab=signup" variant="accent" size="lg">
                  Create your account
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </ButtonLink>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <Logo />
            <p className="mt-2 text-sm text-ink-subtle">© {new Date().getFullYear()} Jobora</p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-muted">
            <a href="#features" className="hover:text-plum">
              Features
            </a>
            <a href="#how" className="hover:text-plum">
              How it works
            </a>
            <Link href="/auth?tab=login" className="hover:text-plum">
              Log in
            </Link>
            <Link href="/auth?tab=signup" className="hover:text-plum">
              Create account
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
