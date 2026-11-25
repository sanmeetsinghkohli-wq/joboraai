'use client';

import { AppShell } from '@/components/AppShell';
import { AiDraftTool } from '@/components/AiDraftTool';
import { PageHeader } from '@/components/ui/primitives';

import { SubNav, DOCUMENT_TABS } from '@/components/SubNav';
const DOCUMENTS = [
  'Statement of purpose',
  'Personal statement',
  'Professional bio',
  'Internship application letter',
  'Thank-you email after an interview',
  'Recruiter follow-up email',
  'Recommendation letter draft',
  'Resignation letter',
];

export default function DocumentStudioPage() {
  return (
    <AppShell>
      <SubNav items={DOCUMENT_TABS} label="CV and documents" />
      <PageHeader
        eyebrow="Document studio"
        title="Career documents, drafted from your profile"
        description="Statements of purpose, bios, letters and emails. Anything Jobora cannot take from your profile is marked [add …] instead of being made up."
      />
      <AiDraftTool
        mode="document"
        title="Draft a document"
        description="Pick the document, then add the details only you know: the programme, company, recipient or occasion."
        button="Draft document"
        fields={[
          { id: 'type', label: 'Document type', kind: 'select', options: DOCUMENTS },
          {
            id: 'details',
            label: 'Details',
            kind: 'textarea',
            rows: 7,
            placeholder:
              'e.g. MSc Artificial Intelligence at …; why this programme; what I want to research\nor: Interview on Tuesday with … for the Data Analyst role; we discussed …',
          },
        ]}
      />
    </AppShell>
  );
}
