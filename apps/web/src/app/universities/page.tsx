import type { Metadata } from 'next';
import { Bullets, CtaRow, InfoPage, Section } from '@/components/landing/InfoPage';

export const metadata: Metadata = { title: 'For Universities · Jobora AI' };

export default function UniversitiesPage() {
  return (
    <InfoPage
      eyebrow="Solutions"
      title="For universities and career services"
      intro="Give every student a structured job-search workspace that complements your careers team."
    >
      <Section title="What students get">
        <Bullets
          items={[
            'Live internships and graduate roles with a skill-by-skill comparison against their profile.',
            'CV building, ATS checks, cover letters and mock interviews in one place.',
            'An application tracker from Saved to Offer, so advisers can talk about progress, not just intentions.',
          ]}
        />
      </Section>
      <Section title="Built to be trusted">
        <Bullets
          items={[
            'Drafts never invent experience or qualifications.',
            'Nothing is sent or submitted without the student approving it first.',
            'Job postings are scanned for scam signs and hidden instructions.',
          ]}
        />
      </Section>
      <Section title="Working with us">
        <p>
          Jobora is free for individual students during launch. If you would like to roll it out to a cohort, tell us
          about your institution and we will talk through what you need.
        </p>
      </Section>
      <CtaRow primary={{ href: '/contact', label: 'Contact us' }} secondary={{ href: '/students', label: 'See the student view' }} />
    </InfoPage>
  );
}
