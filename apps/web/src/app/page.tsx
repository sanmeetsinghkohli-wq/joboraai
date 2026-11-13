import Link from 'next/link';
import {
  ArrowRight,
  Check,
  FileText,
  ListChecks,
  Mic,
  Search,
  Send,
  Sparkles,
  Target,
} from 'lucide-react';
import { LandingNav } from '@/components/landing/LandingNav';
import { Scene3D } from '@/components/landing/Scene3D';
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
        <section className="relative">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-[38rem] bg-[radial-gradient(60rem_30rem_at_80%_10%,rgba(231,111,114,0.14),transparent_60%)]"
          />
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-6 lg:pb-24 lg:pt-20">
            <div className="animate-fade-up">
              <p className="eyebrow">Job search workspace</p>
              <h1 className="mt-4 font-serif text-4xl text-plum sm:text-5xl">
                Find your fit.
                <br />
                <em className="text-coral-700">Make your move.</em>
              </h1>
              <p className="mt-5 max-w-xl text-lg text-ink-muted">
                Jobora brings live roles, your skills and every application you send into one calm workspace — so you
                always know what to apply for next and where each application stands.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/auth?tab=signup" size="lg">
                  Create your account
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </ButtonLink>
                <ButtonLink href="#how" variant="secondary" size="lg">
                  See how it works
                </ButtonLink>
              </div>
              <ul className="mt-8 flex flex-col gap-2 text-sm text-ink-muted sm:flex-row sm:gap-6">
                {['Live roles from public job boards', 'Skill-by-skill comparison', 'One tracker for every application'].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Check className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                      {item}
                    </li>
                  )
                )}
              </ul>
            </div>

            <Scene3D />
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-20 border-t border-line bg-paper">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
            <div className="max-w-2xl">
              <p className="eyebrow">What you can do</p>
              <h2 className="mt-3 font-serif text-3xl text-plum">Everything between “looking” and “hired”</h2>
              <p className="mt-3 text-ink-muted">
                Six tools that share one profile, so you enter your details once and use them everywhere.
              </p>
            </div>
            <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, body }) => (
                <li key={title}>
                  <Tilt max={5} lift={12} className="h-full">
                    <article className="flex h-full flex-col rounded-lg border border-line bg-ivory p-6 shadow-card transition-shadow duration-200 hover:shadow-raised">
                      <div className="flex h-11 w-11 items-center justify-center rounded bg-plum text-coral [transform:translateZ(24px)]">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <h3 className="mt-5 font-serif text-xl text-plum">{title}</h3>
                      <p className="mt-2 text-sm text-ink-muted">{body}</p>
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
