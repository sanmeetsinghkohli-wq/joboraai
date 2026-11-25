import type { Metadata } from 'next';
import { Bullets, InfoPage, Section } from '@/components/landing/InfoPage';
import { SITE } from '@/lib/site';

export const metadata: Metadata = { title: 'Privacy Policy · Jobora AI' };

export default function PrivacyPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Privacy Policy"
      intro="What Jobora collects, why, and what happens to it. Written in plain language."
      updated={SITE.legalUpdated}
    >
      <Section title="What we collect">
        <Bullets
          items={[
            'Account details: your name, email address and a hashed (never plain-text) password.',
            'Profile details you choose to enter: target role, location, skills, education, experience and links.',
            'Your activity in the app: saved roles, tracked applications and their status, and drafts you create.',
            'CV files you upload, which are read to fill in your profile.',
          ]}
        />
      </Section>
      <Section title="Where it is stored">
        <p>
          Your account and profile are kept on our server, and some preferences and drafts are kept in your own
          browser&apos;s local storage so the app works quickly. Clearing your browser data removes the local copy.
        </p>
        <p>
          We use one essential sign-in cookie to keep you logged in. It is marked HttpOnly, lasts up to 7 days and is
          not used for advertising or tracking.
        </p>
      </Section>
      <Section title="AI features">
        <p>
          When you use Copilot or a Career Ops tool (fit report, outreach, follow-ups, mock interview, offers), the text
          you submit and the relevant parts of your profile are sent to our AI provider, Groq (or Google Gemini as a
          backup when Groq is unavailable), to generate the reply.
          We only send what that request needs. The ATS check and red-flag scan run on our own server without AI.
        </p>
      </Section>
      <Section title="Job listings">
        <p>
          Job listings come from public job boards and employers&apos; own career pages. Searching does not send your
          personal details to those sites. When you apply, you do so on the employer&apos;s own site or from your own
          mail app, or from your connected Gmail after you approve that specific email. Jobora never submits
          applications or sends email on its own.
        </p>
      </Section>
      <Section title="Gmail connection (optional)">
        <Bullets
          items={[
            'If you connect Gmail, Jobora asks Google only for permission to send email as you. It cannot read, search or delete your inbox.',
            'An email is sent only when you press Approve & send on that email in your outbox. At most 20 a day.',
            'The access token Google gives us is encrypted before it is stored, and is never shown in your browser.',
            'You can disconnect at any time in Settings, or in your Google account under third-party access. Deleting your account also revokes it.',
          ]}
        />
      </Section>
      <Section title="What we do not do">
        <Bullets
          items={[
            'We do not sell your personal information.',
            'We do not use advertising or cross-site tracking cookies.',
            'We do not add experience, employers or qualifications to your documents that you did not give us.',
          ]}
        />
      </Section>
      <Section title="Your choices">
        <p>
          You can edit or clear your profile at any time in Settings, and sign out to end your session. To ask for a
          copy of your data or for your account to be deleted, use the contact details on our Contact page.
        </p>
      </Section>
      <Section title="Changes">
        <p>We will update this page when our practices change, and change the date at the top.</p>
      </Section>
    </InfoPage>
  );
}
