import { NextRequest, NextResponse } from 'next/server';
import { getCookie } from '../auth/_lib';
import type { StructuredJob } from '@jobora/types';

declare global {
  var __jobora_custom_jobs: StructuredJob[] | undefined;
}

const customJobs: StructuredJob[] = global.__jobora_custom_jobs || (global.__jobora_custom_jobs = []);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').trim();
    const location = (searchParams.get('location') || '').trim();
    const workMode = (searchParams.get('workMode') || '').trim().toLowerCase();

    const jobs: Array<any> = [...customJobs];

    // Fetch live remote tech jobs from Remotive public API (free, no key required)
    try {
      const remotiveUrl = query
        ? `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}&limit=25`
        : 'https://remotive.com/api/remote-jobs?category=software-dev&limit=25';
      const remotiveRes = await fetch(remotiveUrl, { next: { revalidate: 300 } });
      if (remotiveRes.ok) {
        const remotiveData = await remotiveRes.json();
        if (Array.isArray(remotiveData?.jobs)) {
          for (const rJob of remotiveData.jobs.slice(0, 20)) {
            const plainDesc = (rJob.description || '')
              .replace(/<[^>]+>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
            const tags: string[] = Array.isArray(rJob.tags) ? rJob.tags.slice(0, 6) : [];
            jobs.push({
              id: `remotive-${rJob.id}`,
              title: rJob.title || 'Software Engineer',
              company: rJob.company_name || 'Technology Company',
              companyLogo: rJob.company_logo || null,
              location: rJob.candidate_required_location || 'Remote',
              workMode: 'Hybrid / Remote',
              employmentType: rJob.job_type === 'full_time' ? 'Full-Time' : rJob.job_type || 'Full-Time',
              salaryRange: rJob.salary || 'Competitive Market Rate',
              description: plainDesc.slice(0, 900),
              responsibilities: plainDesc
                .split('. ')
                .filter((s: string) => s.length > 30)
                .slice(0, 4),
              skills: tags.length > 0 ? tags : ['Software Engineering', 'APIs', 'Cloud'],
              postedAt: rJob.publication_date
                ? new Date(rJob.publication_date).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Recently posted',
              sourceUrl: rJob.url || '',
              source: 'Remotive Live API',
              recruiterEmail: '',
              recruiterName: 'Hiring Team',
            });
          }
        }
      }
    } catch {
      // Continue if external fetch fails or offline
    }

    // Fetch live tech jobs from Arbeitnow public API (free, no key required)
    try {
      const arbeitRes = await fetch('https://www.arbeitnow.com/api/job-board-api', {
        next: { revalidate: 300 },
      });
      if (arbeitRes.ok) {
        const arbeitData = await arbeitRes.json();
        if (Array.isArray(arbeitData?.data)) {
          for (const aJob of arbeitData.data.slice(0, 15)) {
            const plainDesc = (aJob.description || '')
              .replace(/<[^>]+>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
            const tags: string[] = Array.isArray(aJob.tags) ? aJob.tags.slice(0, 6) : [];
            jobs.push({
              id: `arbeitnow-${aJob.slug}`,
              title: aJob.title || 'Software Developer',
              company: aJob.company_name || 'Tech Partner',
              companyLogo: null,
              location: aJob.location || 'Remote / Hybrid',
              workMode: aJob.remote ? 'Remote' : 'Hybrid / On-site',
              employmentType: 'Full-Time',
              salaryRange: 'Competitive Package',
              description: plainDesc.slice(0, 900),
              responsibilities: plainDesc
                .split('. ')
                .filter((s: string) => s.length > 30)
                .slice(0, 4),
              skills: tags.length > 0 ? tags : ['Engineering', 'Cloud', 'Modern Stack'],
              postedAt: aJob.created_at
                ? new Date(aJob.created_at * 1000).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Recently posted',
              sourceUrl: aJob.url || '',
              source: 'Arbeitnow Live API',
              recruiterEmail: '',
              recruiterName: 'Talent Acquisition',
            });
          }
        }
      }
    } catch {
      // Continue if external fetch fails
    }

    // Filter by query / location / workMode if specified
    const filtered = jobs.filter((job) => {
      if (query) {
        const q = query.toLowerCase();
        const hay = `${job.title} ${job.company} ${job.description} ${(job.skills || []).join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (location) {
        const loc = location.toLowerCase();
        if (!job.location.toLowerCase().includes(loc)) return false;
      }
      if (workMode && workMode !== 'all') {
        if (!job.workMode.toLowerCase().includes(workMode)) return false;
      }
      return true;
    });

    return NextResponse.json({
      success: true,
      jobs: filtered,
      total: filtered.length,
    });
  } catch (error) {
    console.error('Live jobs fetch error:', error);
    return NextResponse.json({ success: false, jobs: [], total: 0 }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newJob: any = {
      id: `custom-${Date.now()}`,
      title: body.title || 'Untitled Role',
      company: body.company || 'Company',
      companyLogo: null,
      location: body.location || 'Remote',
      workMode: body.workMode || 'Hybrid',
      employmentType: body.employmentType || 'Full-Time',
      salaryRange: body.salaryRange || 'Competitive',
      description: body.description || '',
      responsibilities: Array.isArray(body.responsibilities)
        ? body.responsibilities
        : (body.description || '')
            .split('\n')
            .map((s: string) => s.trim())
            .filter(Boolean)
            .slice(0, 5),
      skills: Array.isArray(body.skills)
        ? body.skills
        : (body.skills || '')
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean),
      postedAt: new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      sourceUrl: body.sourceUrl || '',
      source: 'Custom Job Description',
      recruiterEmail: body.recruiterEmail || '',
      recruiterName: body.recruiterName || 'Hiring Manager',
    };
    customJobs.unshift(newJob);
    return NextResponse.json({ success: true, job: newJob });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid job payload' }, { status: 400 });
  }
}
