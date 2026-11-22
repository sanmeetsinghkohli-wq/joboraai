import type { Metadata } from 'next';
import { Bullets, CtaRow, InfoPage, Section } from '@/components/landing/InfoPage';

export const metadata: Metadata = { title: 'Enterprise · Jobora AI' };

export default function EnterprisePage() {
  return (
    <InfoPage
      eyebrow="Solutions"
      title="For organisations"
      intro="Outplacement, bootcamps, workforce programmes and recruiting partners."
    >
      <Section title="Who this is for">
        <Bullets
          items={[
            'Companies supporting employees through a restructure or outplacement.',
            'Bootcamps and training providers helping graduates into work.',
            'Government and non-profit employment programmes.',
          ]}
        />
      </Section>
      <Section title="What we can set up together">
        <p>
          Team access to the Jobora workspace for your participants, with the same honest matching, drafting and
          tracking tools. Organisation features are being shaped with our first partners, so tell us what you need
          rather than picking from a fixed list.
        </p>
      </Section>
      <CtaRow primary={{ href: '/contact', label: 'Talk to us' }} secondary={{ href: '/security', label: 'Read about security' }} />
    </InfoPage>
  );
}
