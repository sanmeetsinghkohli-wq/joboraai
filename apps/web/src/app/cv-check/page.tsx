import type { Metadata } from 'next';
import { InfoPage, Section } from '@/components/landing/InfoPage';
import { CvChecker } from './CvChecker';

export const metadata: Metadata = {
  title: 'Free CV checker: can ATS software read your CV? · Jobora AI',
  description:
    'Free ATS CV check for job seekers in the UAE, GCC and India. Upload your CV and see your score, what to fix and which job keywords are missing. No sign-up, and your CV is not stored.',
  alternates: { canonical: '/cv-check' },
  openGraph: {
    title: 'Free CV checker · Jobora AI',
    description: 'See whether applicant tracking systems can read your CV. Free, no sign-up, nothing stored.',
    url: '/cv-check',
  },
};

export default function CvCheckPage() {
  return (
    <InfoPage
      eyebrow="Free tool"
      title="Can hiring software read your CV?"
      intro="Most large employers in the Gulf and India screen CVs with an applicant tracking system (ATS) before a person sees them. Check yours in seconds. Free, no sign-up, and your CV is never stored."
    >
      <CvChecker />
      <Section title="How the score works">
        <p>
          The score out of 100 comes from the open-source career-ops ATS checker, used unchanged. No AI is involved, so the same
          CV always gets the same score. It adds up points for readable text, standard section headings (Experience, Education,
          Skills), contact details (email and phone), and a simple layout.
        </p>
        <p>What it can see depends on the file:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Word (.docx):</strong> the real structure, so tables used for layout and text inside images are caught.
          </li>
          <li>
            <strong>PDF:</strong> the text and how it sits on the page, so two-column layouts are caught. Fonts and hidden text
            inside a PDF are not checked.
          </li>
          <li>
            <strong>Pasted text:</strong> headings, contact details and keywords only, because pasted text has no layout.
          </li>
        </ul>
        <p>Job keywords are shown separately and never change the score.</p>
      </Section>
      <Section title="Your privacy">
        <p>
          Your file is read in memory to produce the score and then discarded. It is not saved, not sent to an AI model and not
          used for training. We only count that a check happened.
        </p>
      </Section>
    </InfoPage>
  );
}
