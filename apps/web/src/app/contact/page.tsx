import type { Metadata } from 'next';
import { CtaRow, InfoPage, Section } from '@/components/landing/InfoPage';
import { SITE } from '@/lib/site';

export const metadata: Metadata = { title: 'Contact · Jobora AI' };

export default function ContactPage() {
  return (
    <InfoPage eyebrow="Help" title="Contact us" intro="Questions, feedback, partnerships or data requests.">
      <Section title="Email">
        {SITE.contactEmail ? (
          <p>
            Write to{' '}
            <a className="font-semibold text-[#E05347] underline underline-offset-4" href={`mailto:${SITE.contactEmail}`}>
              {SITE.contactEmail}
            </a>
            . We read every message.
          </p>
        ) : (
          <p>Our support inbox is being set up. Until then, the fastest way to reach us is from inside the app.</p>
        )}
      </Section>
      <Section title="Universities and organisations">
        <p>
          If you would like to offer Jobora to your students or team, mention your organisation and roughly how many
          people would use it.
        </p>
      </Section>
      <Section title="Your data">
        <p>
          To ask for a copy of your data or to delete your account, write from the email address on your account so we
          can confirm it is you.
        </p>
      </Section>
      <CtaRow primary={{ href: '/auth?tab=signup', label: 'Create your account' }} secondary={{ href: '/', label: 'Back to home' }} />
    </InfoPage>
  );
}
