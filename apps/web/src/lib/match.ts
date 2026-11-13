/**
 * Skill matching between a candidate and a job.
 *
 * The score is deliberately simple and explainable: the share of the skills a
 * job lists that also appear in the candidate's skills. When either side has no
 * skills there is no score at all, rather than an invented baseline.
 */

export interface MatchResult {
  /** 0–100, or undefined when a score cannot be computed honestly. */
  score: number | undefined;
  matched: string[];
  missing: string[];
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9+#.]/g, ' ').replace(/\s+/g, ' ').trim();

function sameSkill(a: string, b: string): boolean {
  const x = norm(a);
  const y = norm(b);
  if (!x || !y) return false;
  if (x === y) return true;
  // "React" vs "React.js", "Node" vs "Node.js" — whole-word containment only,
  // so "Go" never matches "Google" and "Java" never matches "JavaScript".
  const words = (s: string) => s.split(/[ .]/).filter(Boolean);
  const wx = words(x);
  const wy = words(y);
  const contains = (big: string[], small: string[]) =>
    small.length > 0 && small.every((w) => big.includes(w));
  return contains(wx, wy) || contains(wy, wx);
}

export function matchSkills(jobSkills: string[] = [], userSkills: string[] = []): MatchResult {
  const job = jobSkills.map((s) => String(s).trim()).filter(Boolean);
  const user = userSkills.map((s) => String(s).trim()).filter(Boolean);

  if (job.length === 0 || user.length === 0) {
    return { score: undefined, matched: [], missing: job };
  }

  const matched = job.filter((j) => user.some((u) => sameSkill(j, u)));
  const missing = job.filter((j) => !matched.includes(j));
  return { score: Math.round((matched.length / job.length) * 100), matched, missing };
}

/** Counts how often each skill appears across a set of jobs, most common first. */
export function skillDemand(jobs: Array<{ skills?: string[] }>): Array<{ skill: string; count: number }> {
  const counts = new Map<string, { skill: string; count: number }>();
  for (const job of jobs) {
    const seen = new Set<string>();
    for (const raw of job.skills || []) {
      const key = norm(raw);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const entry = counts.get(key);
      if (entry) entry.count += 1;
      else counts.set(key, { skill: raw.trim(), count: 1 });
    }
  }
  return Array.from(counts.values()).sort((a, b) => b.count - a.count);
}

export function hasSkill(userSkills: string[], skill: string): boolean {
  return userSkills.some((u) => sameSkill(u, skill));
}
