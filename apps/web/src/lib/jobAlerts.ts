import { isTechRole } from './jobFields';
import { matchesLocationFilter, matchesQuery, type MatchableJob } from './jobMatch';

export interface AlertFilters {
  query: string;
  region: string;
  jobType: string;
  techOnly: boolean;
}

type AlertJob = MatchableJob & { id: string; employmentType?: string };

export function alertMatches(job: AlertJob, a: AlertFilters): boolean {
  return (
    matchesQuery(job, a.query.toLowerCase().trim()) &&
    matchesLocationFilter(job, a.region.toLowerCase().trim()) &&
    (!a.jobType || job.employmentType === a.jobType) &&
    (!a.techOnly || isTechRole(job.title))
  );
}

/** Matching jobs the user has not seen yet for this alert. */
export function newMatches<J extends AlertJob>(jobs: J[], a: AlertFilters & { seenIds: string[] }): J[] {
  const seen = new Set(a.seenIds);
  return jobs.filter((j) => !seen.has(j.id) && alertMatches(j, a));
}

export function describeAlert(a: AlertFilters): string {
  const parts = [a.query && `“${a.query}”`, a.techOnly && 'Tech & CS', a.jobType, a.region && `in ${a.region}`].filter(Boolean);
  return parts.length ? parts.join(' · ') : 'All roles';
}
