/** Shared job matching, used by the jobs API and by job alerts in the browser. */
export interface MatchableJob {
  title: string;
  company: string;
  description: string;
  location: string;
  skills: string[];
  city?: string;
  country?: string;
  regionTag?: string;
  workMode?: string;
}

export function matchesQuery(job: MatchableJob, query: string): boolean {
  if (!query) return true;
  return (
    job.title.toLowerCase().includes(query) ||
    job.company.toLowerCase().includes(query) ||
    job.description.toLowerCase().includes(query) ||
    job.location.toLowerCase().includes(query) ||
    job.skills.some((s) => s.toLowerCase().includes(query))
  );
}

export function matchesLocationFilter(job: MatchableJob, locationFilter: string): boolean {
  if (!locationFilter) return true;
  const f = locationFilter.toLowerCase().trim();
  const loc = (job.location || '').toLowerCase();
  const city = (job.city || '').toLowerCase();
  const country = (job.country || '').toLowerCase();
  const region = (job.regionTag || '').toLowerCase();
  const mode = (job.workMode || '').toLowerCase();

  if (f === 'uae' || f === 'united arab emirates') {
    return (
      region === 'uae' ||
      country === 'united arab emirates' ||
      loc.includes('dubai') ||
      loc.includes('abu dhabi') ||
      loc.includes('sharjah') ||
      loc.includes('uae') ||
      loc.includes('emirates')
    );
  }
  if (f === 'gcc' || f === 'mena') {
    return (
      region === 'uae' ||
      region === 'saudi arabia' ||
      region === 'qatar' ||
      region === 'gcc / mena'
    );
  }
  if (f === 'saudi arabia' || f === 'saudi' || f === 'riyadh') {
    return (
      region === 'saudi arabia' ||
      country === 'saudi arabia' ||
      city === 'riyadh' ||
      loc.includes('saudi') ||
      loc.includes('riyadh') ||
      loc.includes('jeddah')
    );
  }
  if (f === 'qatar' || f === 'doha') {
    return (
      region === 'qatar' ||
      country === 'qatar' ||
      city === 'doha' ||
      loc.includes('qatar') ||
      loc.includes('doha')
    );
  }
  if (f === 'dubai') {
    return city === 'dubai' || loc.includes('dubai');
  }
  if (f === 'abu dhabi') {
    return city === 'abu dhabi' || loc.includes('abu dhabi');
  }
  if (f === 'sharjah') {
    return city === 'sharjah' || loc.includes('sharjah');
  }
  if (f === 'india') {
    return region === 'india' || country === 'india';
  }
  const INDIA_CITIES: Record<string, string[]> = {
    bengaluru: ['bengaluru', 'bangalore'],
    mumbai: ['mumbai'],
    hyderabad: ['hyderabad'],
    pune: ['pune'],
    'delhi ncr': ['delhi', 'gurugram', 'gurgaon', 'noida'],
  };
  if (INDIA_CITIES[f]) {
    return INDIA_CITIES[f].some((c) => city.includes(c) || loc.includes(c));
  }
  if (f === 'remote') {
    return mode === 'remote' || region === 'remote' || loc.includes('remote');
  }

  return (
    loc.includes(f) ||
    city.includes(f) ||
    country.includes(f) ||
    mode.includes(f) ||
    region.includes(f)
  );
}
