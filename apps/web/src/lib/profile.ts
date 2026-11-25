import type { LiveUserProfile } from '@/context/AppDataContext';

export interface ProfileCheck {
  key: string;
  label: string;
  done: boolean;
  /** Anchor on /profile where the user fixes it. */
  anchor: string;
}

/** The checks behind "profile strength". Shared by the dashboard, sidebar and profile page. */
export function profileChecks(p: LiveUserProfile): ProfileCheck[] {
  return [
    { key: 'role', label: 'Target role', done: Boolean(p.targetRole), anchor: 'goals' },
    { key: 'skills', label: 'At least 5 skills', done: p.skills.length >= 5, anchor: 'skills' },
    { key: 'location', label: 'Location', done: Boolean(p.location), anchor: 'about' },
    { key: 'summary', label: 'Summary', done: Boolean(p.summary), anchor: 'summary' },
    { key: 'education', label: 'Education', done: Boolean(p.degree || p.university), anchor: 'education' },
    { key: 'experience', label: 'Experience or internships', done: Boolean(p.experience), anchor: 'experience' },
    { key: 'projects', label: 'At least one project', done: (p.projects?.length ?? 0) > 0, anchor: 'projects' },
    { key: 'links', label: 'LinkedIn or GitHub', done: Boolean(p.linkedin || p.github), anchor: 'about' },
  ];
}

export function profileStrength(p: LiveUserProfile): { score: number; checks: ProfileCheck[]; next: ProfileCheck | null } {
  const checks = profileChecks(p);
  const done = checks.filter((c) => c.done).length;
  return {
    score: Math.round((done / checks.length) * 100),
    checks,
    next: checks.find((c) => !c.done) ?? null,
  };
}
