'use client';

import { AppShell } from '@/components/AppShell';
import { AiDraftTool } from '@/components/AiDraftTool';
import { PageHeader } from '@/components/ui/primitives';
import { useAppData } from '@/context/AppDataContext';

export default function LinkedInOptimiserPage() {
  const { profile, authStatus } = useAppData();
  return (
    <AppShell>
      <PageHeader
        eyebrow="LinkedIn optimiser"
        title="Get found by recruiters"
        description="Paste your current LinkedIn sections. You get headline options, a rewritten About, stronger experience bullets, the skills to list and connection messages, all from your real experience."
      />
      {authStatus !== 'loading' && (
        <AiDraftTool
          mode="linkedin"
          title="Optimise your profile"
          description="Copy each section from your LinkedIn profile and paste it below. Leave out anything you have not written yet."
          button="Optimise my LinkedIn"
          fields={[
            { id: 'target', label: 'Target role', placeholder: 'e.g. AI Engineer', initial: profile.targetRole },
            { id: 'headline', label: 'Current headline', optional: true, placeholder: 'e.g. Computer Science student at …' },
            { id: 'about', label: 'Current About section', kind: 'textarea', rows: 5, optional: true },
            {
              id: 'experience',
              label: 'Experience, projects and skills',
              kind: 'textarea',
              rows: 8,
              optional: true,
              hint: 'Paste your LinkedIn experience entries. Your Jobora profile is used too.',
            },
          ]}
        />
      )}
    </AppShell>
  );
}
