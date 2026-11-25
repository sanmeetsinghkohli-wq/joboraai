'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Info } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { Card, PageHeader } from '@/components/ui/primitives';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n';

type Country = {
  name: string;
  points: string[];
  localHiring: string;
  links: Array<{ label: string; href: string }>;
};

/**
 * General orientation only. Rules change often, so every country lists the
 * official sources and the page says plainly that it is not legal advice.
 */
const COUNTRIES: Country[] = [
  {
    name: 'United Arab Emirates',
    points: [
      'Most people work on an employer-sponsored residence visa: the employer applies for the work permit and visa after you accept the offer.',
      'Self-sponsored options exist for some skilled people, such as the Green visa and the Golden visa. The UAE also offers a job-seeker visit visa for looking for work in the country.',
      'Employers often ask for your degree to be attested before the visa is issued. Start this early; it can take weeks.',
      'Private-sector contracts are registered with the Ministry of Human Resources and Emiratisation (MOHRE).',
    ],
    localHiring: 'Emiratisation targets require many private companies to hire UAE nationals, which affects some roles.',
    links: [
      { label: 'MOHRE (work permits, contracts)', href: 'https://www.mohre.gov.ae' },
      { label: 'ICP (visas and Emirates ID)', href: 'https://icp.gov.ae' },
      { label: 'GDRFA Dubai (Dubai visas)', href: 'https://gdrfad.gov.ae' },
      { label: 'UAE government portal: working in the UAE', href: 'https://u.ae/en/information-and-services/jobs' },
    ],
  },
  {
    name: 'Saudi Arabia',
    points: [
      'Work visas are employer-sponsored. Your residence permit is called the Iqama.',
      'Employment contracts and transfers between employers are handled through the Qiwa platform.',
      'Premium Residency offers some self-sponsored routes for qualifying professionals and investors.',
    ],
    localHiring: 'Saudization (the Nitaqat programme) sets quotas for Saudi nationals by sector and company size.',
    links: [
      { label: 'Ministry of Human Resources (HRSD)', href: 'https://www.hrsd.gov.sa' },
      { label: 'Qiwa (contracts and work permits)', href: 'https://qiwa.sa' },
      { label: 'Saudi visa portal (MOFA)', href: 'https://visa.mofa.gov.sa' },
    ],
  },
  {
    name: 'Qatar',
    points: [
      'Work and residence permits are arranged by the employer; you receive a Qatar ID (QID).',
      'Changing employers is possible under the current labour rules, subject to notice requirements.',
    ],
    localHiring: 'Qatarization programmes prioritise Qatari nationals in some sectors.',
    links: [
      { label: 'Ministry of Labour', href: 'https://www.mol.gov.qa' },
      { label: 'Ministry of Interior (visas)', href: 'https://portal.moi.gov.qa' },
      { label: 'Hukoomi government portal', href: 'https://hukoomi.gov.qa' },
    ],
  },
  {
    name: 'Kuwait',
    points: ['Private-sector work permits are issued through the Public Authority for Manpower (PAM) and are employer-sponsored.'],
    localHiring: 'Kuwaitization targets apply in parts of the private sector and strongly in government.',
    links: [{ label: 'Public Authority for Manpower (PAM)', href: 'https://www.pam.gov.kw' }],
  },
  {
    name: 'Bahrain',
    points: ['Work permits are handled by the Labour Market Regulatory Authority (LMRA). Bahrain also offers a long-term Golden Residency for some residents.'],
    localHiring: 'Bahrainisation quotas apply by sector.',
    links: [{ label: 'Labour Market Regulatory Authority (LMRA)', href: 'https://www.lmra.gov.bh' }],
  },
  {
    name: 'Oman',
    points: ['Work permits are employer-sponsored and issued through the Ministry of Labour; residence cards come from the Royal Oman Police.'],
    localHiring: 'Omanisation reserves some job titles for Omani nationals, so check whether a role is open to expatriates.',
    links: [{ label: 'Ministry of Labour', href: 'https://www.mol.gov.om' }],
  },
];

const TERMS: Array<[string, string]> = [
  ['Package', 'Pay is often quoted as a monthly package: a basic salary plus allowances such as housing and transport. Ask for the split, because some benefits are calculated on basic pay only.'],
  ['End-of-service gratuity', 'A payment at the end of employment, usually based on basic salary and years of service. Many GCC countries use this instead of a pension for expatriates.'],
  ['Probation', 'A trial period at the start of a contract. The maximum length and notice rules during probation differ by country.'],
  ['Notice period', 'How long you must work after resigning, often 30 to 90 days. Recruiters ask about it early.'],
  ['Attestation', 'Official stamping of degrees and documents, usually in the country that issued them and then by that country’s embassy or the foreign ministry. Often needed for a work visa.'],
  ['Sponsor', 'The employer (or person) legally responsible for your residence visa.'],
  ['Emirates ID / Iqama / QID', 'The national residence identity cards of the UAE, Saudi Arabia and Qatar.'],
  ['Nationalisation programmes', 'Emiratisation, Saudization, Qatarization and similar quotas reserve some jobs or set hiring targets for citizens.'],
];

const GRADUATE_SEARCHES = [
  { label: 'Graduate roles', q: 'graduate' },
  { label: 'Internships', q: 'intern' },
  { label: 'Trainee programmes', q: 'trainee' },
  { label: 'Entry level', q: 'junior' },
];

export default function GccGuidePage() {
  return (
    <AppShell>
      <GuideBody />
    </AppShell>
  );
}

function GuideBody() {
  const t = useT();
  const [open, setOpen] = useState(COUNTRIES[0].name);

  return (
    <>
      <PageHeader
        eyebrow={t('GCC career guide')}
        title={t('Working in the Gulf')}
        description="Plain-English basics on work visas, local hiring rules and the terms recruiters use, with links to the official sources."
      />

      <div className="mb-6 flex gap-3 rounded-2xl border border-coral-100 bg-coral-50 p-4 text-sm text-ink">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-coral-700" aria-hidden="true" />
        <p>
          {t(
            'This is general guidance, not legal or immigration advice. Rules change often and depend on your nationality, role and employer. Always check the official site linked for each country, or ask your employer’s HR team, before you act.'
          )}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section aria-label="Countries" className="space-y-3">
          {COUNTRIES.map((c) => {
            const isOpen = open === c.name;
            return (
              <Card key={c.name} padded={false}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? '' : c.name)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between px-5 py-4 text-start"
                >
                  <span className="font-serif text-lg text-plum">{c.name}</span>
                  <span className={cn('text-ink-subtle transition-transform', isOpen && 'rotate-45')} aria-hidden="true">
                    +
                  </span>
                </button>
                {isOpen && (
                  <div className="space-y-4 border-t border-line px-5 py-4 text-sm">
                    <ul className="list-disc space-y-2 ps-5 text-ink">
                      {c.points.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                    <p className="text-ink-muted">
                      <span className="font-medium text-ink">{t('Local hiring: ')}</span>
                      {c.localHiring}
                    </p>
                    <div>
                      <p className="mb-2 font-medium text-ink">{t('Official sources')}</p>
                      <ul className="space-y-1.5">
                        {c.links.map((l) => (
                          <li key={l.href}>
                            <a
                              href={l.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-plum underline-offset-4 hover:underline"
                            >
                              {l.label}
                              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </section>

        <div className="space-y-6">
          <Card>
            <h2 className="mb-1 font-serif text-xl text-plum">{t('Graduate and early-career roles')}</h2>
            <p className="mb-4 text-sm text-ink-muted">
              Many large Gulf employers, banks and government-linked companies run graduate and trainee programmes, usually opening
              once a year. Some are reserved for nationals, so read the eligibility line first.
            </p>
            <div className="flex flex-wrap gap-2">
              {GRADUATE_SEARCHES.map((s) => (
                <Link
                  key={s.q}
                  href={`/jobs?q=${encodeURIComponent(s.q)}`}
                  className="rounded-full border border-line px-3.5 py-1.5 text-sm font-medium text-plum hover:border-plum-200 hover:bg-plum-50"
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="mb-3 font-serif text-xl text-plum">{t('Terms you will hear')}</h2>
            <dl className="space-y-3 text-sm">
              {TERMS.map(([term, def]) => (
                <div key={term}>
                  <dt className="font-medium text-ink">{term}</dt>
                  <dd className="text-ink-muted">{def}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}
