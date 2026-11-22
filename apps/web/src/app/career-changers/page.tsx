import type { Metadata } from 'next';
import { Bullets, CtaRow, InfoPage, Section } from '@/components/landing/InfoPage';

export const metadata: Metadata = { title: 'For Career Changers · Jobora AI' };

export default function CareerChangersPage() {
  return (
    <InfoPage
      eyebrow="Solutions"
      title="For career changers"
      intro="Moving into a new field? See exactly which skills carry over and which gaps to close first."
    >
      <Section title="Know where you stand">
        <Bullets
          items={[
            'Compare your current skills with what roles in your new field actually list.',
            'Skill gaps ranks the skills that come up most often across your target roles, so you learn the right things first.',
            'Fit reports quote your own experience as evidence for each requirement, and suggest honest ways to cover the gaps.',
          ]}
        />
      </Section>
      <Section title="Reframe your experience, truthfully">
        <p>
          Tailor your CV and cover letters to emphasise transferable work you have really done. Jobora reorders and
          rewords; it never adds employers, titles or results you did not give it.
        </p>
      </Section>
      <Section title="Explore adjacent roles">
        <p>Search roles in India, the UAE and remote, and filter by full-time or internship and apprenticeship-style roles.</p>
      </Section>
      <CtaRow primary={{ href: '/auth?tab=signup', label: 'Get started free' }} secondary={{ href: '/#features', label: 'See the features' }} />
    </InfoPage>
  );
}
