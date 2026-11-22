import type { Metadata } from 'next';
import { Bullets, CtaRow, InfoPage, Section } from '@/components/landing/InfoPage';

export const metadata: Metadata = { title: 'For Students · Jobora AI' };

export default function StudentsPage() {
  return (
    <InfoPage
      eyebrow="Solutions"
      title="For students and graduates"
      intro="Land your first internship or graduate role without a spreadsheet of tabs and half-finished cover letters."
    >
      <Section title="Find roles that are open to you">
        <Bullets
          items={[
            'Filter live roles to internships or full-time, in India, the UAE, Saudi Arabia, Qatar or remote.',
            'See which skills each role lists, and which of them are already on your profile.',
          ]}
        />
      </Section>
      <Section title="Turn coursework into a CV that reads well">
        <Bullets
          items={[
            'Build a one-page CV from your profile in CV Studio, then print or save it as a PDF.',
            'Run the ATS check to see whether hiring software can read it, and which job keywords are missing.',
            'Draft cover letters and outreach messages from your own projects, never invented ones.',
          ]}
        />
      </Section>
      <Section title="Practise before the real thing">
        <p>Run a mock interview one question at a time and get a stronger version of each answer built from your own experience.</p>
      </Section>
      <CtaRow primary={{ href: '/auth?tab=signup', label: 'Get started free' }} secondary={{ href: '/#how-it-works', label: 'See how it works' }} />
    </InfoPage>
  );
}
