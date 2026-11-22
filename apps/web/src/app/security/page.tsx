import type { Metadata } from 'next';
import { Bullets, InfoPage, Section } from '@/components/landing/InfoPage';

export const metadata: Metadata = { title: 'Security · Jobora AI' };

export default function SecurityPage() {
  return (
    <InfoPage
      eyebrow="Trust"
      title="Security"
      intro="How we protect your account and data today, stated as it actually is."
    >
      <Section title="Accounts and sign-in">
        <Bullets
          items={[
            'Passwords are hashed with bcrypt; we never store or display them in plain text.',
            'Sessions use a signed token in an HttpOnly, SameSite cookie that scripts on the page cannot read.',
            'Workspace pages and APIs require a valid session.',
          ]}
        />
      </Section>
      <Section title="In transit">
        <p>All traffic to Jobora is served over HTTPS.</p>
      </Section>
      <Section title="Limits and checks">
        <Bullets
          items={[
            'Requests to AI and checking tools are rate-limited per user.',
            'Uploaded files are checked for type and size before they are read.',
            'Job postings are treated as untrusted text: hidden instructions aimed at AI tools are flagged, not followed.',
          ]}
        />
      </Section>
      <Section title="What Jobora never does">
        <Bullets
          items={[
            'Submit applications on your behalf.',
            'Send email from your accounts.',
            'Ask for your email or job-board passwords.',
          ]}
        />
      </Section>
      <Section title="Reporting a problem">
        <p>
          If you find a security issue, please tell us through the Contact page before sharing it publicly, so we can
          fix it first.
        </p>
      </Section>
    </InfoPage>
  );
}
