'use client';

import { AppShell } from '@/components/AppShell';
import { AiDraftTool } from '@/components/AiDraftTool';
import { PageHeader } from '@/components/ui/primitives';
import { useAppData } from '@/context/AppDataContext';

import { SubNav, GROWTH_TABS } from '@/components/SubNav';
export default function CareerGrowthPage() {
  const { profile, authStatus } = useAppData();
  return (
    <AppShell>
      <SubNav items={GROWTH_TABS} label="Career growth" />
      <PageHeader
        eyebrow="Career growth"
        title="Your learning roadmap"
        description="See where you stand against a target role, then follow a week-by-week plan with projects that prove the skills you are missing."
      />
      {authStatus !== 'loading' && (
        <AiDraftTool
          mode="roadmap"
          title="Build my roadmap"
          description="Your current level for each skill is judged only from what your profile shows. Add your projects and experience in your profile for a sharper plan."
          button="Build my roadmap"
          fields={[
            { id: 'target', label: 'Target role', placeholder: 'e.g. AI Engineer', initial: profile.targetRole },
            { id: 'weeks', label: 'Number of weeks', kind: 'select', options: ['8 weeks', '4 weeks', '12 weeks', '16 weeks'] },
            { id: 'hours', label: 'Hours per week', kind: 'select', options: ['8 hours', '5 hours', '12 hours', '20 hours'] },
            {
              id: 'context',
              label: 'Anything else',
              kind: 'textarea',
              rows: 3,
              optional: true,
              placeholder: 'e.g. I prefer free resources; I want a job in Dubai by June',
            },
          ]}
        />
      )}
    </AppShell>
  );
}
