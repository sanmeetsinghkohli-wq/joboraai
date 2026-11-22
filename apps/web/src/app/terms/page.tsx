import type { Metadata } from 'next';
import { Bullets, InfoPage, Section } from '@/components/landing/InfoPage';
import { SITE } from '@/lib/site';

export const metadata: Metadata = { title: 'Terms of Service · Jobora AI' };

export default function TermsPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Terms of Service"
      intro="The ground rules for using Jobora."
      updated={SITE.legalUpdated}
    >
      <Section title="Using Jobora">
        <p>
          Jobora helps you find roles, compare them with your skills, draft documents and track applications. You need
          an account to use the workspace, and you are responsible for keeping your login details safe.
        </p>
      </Section>
      <Section title="Your content">
        <p>
          You own everything you enter or upload, including your CV, profile and drafts. You give us permission to
          store and process it only to run the features you use.
        </p>
        <p>
          You are responsible for the accuracy of what you send to employers. Review every draft before you use it.
        </p>
      </Section>
      <Section title="Job listings">
        <p>
          Listings come from third-party job boards and employer career pages. We do not employ, endorse or vouch for
          any employer, and a role may close or change before you apply. Always confirm details on the employer&apos;s
          own site.
        </p>
      </Section>
      <Section title="AI-generated drafts">
        <p>
          AI features produce suggestions, not guarantees. Fit verdicts, ATS scores and drafts can be wrong or
          incomplete, and they are not career, legal or financial advice.
        </p>
      </Section>
      <Section title="Acceptable use">
        <Bullets
          items={[
            'Do not use Jobora to misrepresent your qualifications or someone else’s identity.',
            'Do not try to break, overload or gain unauthorised access to the service.',
            'Do not scrape or resell the service or its listings.',
          ]}
        />
      </Section>
      <Section title="Availability">
        <p>
          Jobora is free during launch. We may change or stop features, and we will give notice in the app before
          introducing paid plans. The service is provided as is, without warranties.
        </p>
      </Section>
      <Section title="Ending your account">
        <p>
          You can stop using Jobora at any time and ask us to delete your account. We may suspend accounts that break
          these terms.
        </p>
      </Section>
    </InfoPage>
  );
}
