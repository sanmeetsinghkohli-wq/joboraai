import { NextRequest, NextResponse } from 'next/server';
import { applicationsStore, getAuthenticatedUserId, withUserData } from '../auth/_lib';

export const dynamic = 'force-dynamic';

export interface StoredApplication {
  id: string;
  userId: string;
  jobId: string;
  title: string;
  company: string;
  location: string;
  status: string;
  matchScore: number | null;
  syncChannel: string;
  nextAction: string;
  recruiterName: string;
  recruiterEmail: string;
  appliedAt: string;
  timeline: Array<{ title: string; timestamp: string; description: string }>;
  attachments: Array<{ name: string; size: string; badge: string }>;
  /** ISO date (YYYY-MM-DD) the application was sent. */
  appliedOn?: string;
  /** ISO date the application closes. */
  deadline?: string;
  /** ISO date-time of the next interview. */
  interviewAt?: string;
  /** ISO date to follow up. */
  followUpAt?: string;
  salary?: string;
  notes?: string;
}

const TEXT_FIELDS = ['nextAction', 'recruiterName', 'recruiterEmail', 'salary', 'notes'] as const;
const DATE_FIELDS = ['appliedOn', 'deadline', 'interviewAt', 'followUpAt'] as const;

/** Accepts YYYY-MM-DD or a full ISO date-time; anything else is dropped. */
function cleanDate(v: unknown): string | undefined {
  if (v === '' || v === null) return '';
  if (typeof v !== 'string') return undefined;
  const t = v.trim();
  return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/.test(t) ? t : undefined;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

/** 7 business days after a date: the usual point to follow up on an application. */
function followUpFrom(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  let added = 0;
  while (added < 7) {
    d.setUTCDate(d.getUTCDate() + 1);
    const day = d.getUTCDay();
    if (day !== 0 && day !== 6) added++;
  }
  return d.toISOString().slice(0, 10);
}

const SENT = /^(applied|assessment|interview|offer|accepted|rejected)$/i;

function getStore(): Map<string, StoredApplication[]> {
  return applicationsStore as unknown as Map<string, StoredApplication[]>;
}

function getUserApplications(userId: string): StoredApplication[] {
  const store = getStore();
  const existing = store.get(userId);
  // Reading never writes: a new list is only saved when something is added to it.
  return Array.isArray(existing) ? existing : [];
}

async function GET_handler(req: NextRequest) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required to view applications.' } },
      { status: 401 }
    );
  }
  const apps = getUserApplications(userId);
  return NextResponse.json({ applications: apps });
}

async function POST_handler(req: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required to create applications.' } },
        { status: 401 }
      );
    }
    const body = await req.json();

    const title = String(body?.title || '').trim();
    const company = String(body?.company || '').trim();

    if (!title || !company) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Job title and company name are required.' } },
        { status: 400 }
      );
    }

    const store = getStore();
    const apps = getUserApplications(userId);

    const jobId = body.jobId || `job-${Date.now()}`;
    const duplicate = apps.find(
      (a) =>
        (body.jobId && a.jobId === body.jobId) ||
        (a.title.toLowerCase() === title.toLowerCase() &&
          a.company.toLowerCase() === company.toLowerCase())
    );
    if (duplicate && !body.allowDuplicate) {
      return NextResponse.json({ application: duplicate, duplicate: true }, { status: 200 });
    }

    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const newApp: StoredApplication = {
      id: `app-${Date.now()}`,
      userId,
      jobId,
      title,
      company,
      // Only values the user or the job feed actually supplied are stored;
      // nothing is guessed on their behalf.
      location: String(body.location || '').trim(),
      status: String(body.status || 'Applied').trim(),
      matchScore: typeof body.matchScore === 'number' ? body.matchScore : null,
      syncChannel: String(body.syncChannel || '').trim(),
      nextAction: String(body.nextAction || '').trim(),
      recruiterName: String(body.recruiterName || '').trim(),
      recruiterEmail: String(body.recruiterEmail || '').trim(),
      appliedAt: formattedDate,
      timeline: Array.isArray(body.timeline)
        ? body.timeline
        : [
            {
              title: 'Added to tracker',
              timestamp: `${formattedDate} • ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
              description: `${title} at ${company}.`,
            },
          ],
      attachments: Array.isArray(body.attachments) ? body.attachments : [],
      salary: String(body.salary || '').slice(0, 200).trim(),
      notes: String(body.notes || '').slice(0, 5000),
      deadline: cleanDate(body.deadline) ?? '',
      interviewAt: cleanDate(body.interviewAt) ?? '',
      followUpAt: cleanDate(body.followUpAt) ?? '',
      appliedOn: '',
    };
    if (SENT.test(newApp.status)) {
      newApp.appliedOn = cleanDate(body.appliedOn) || todayIso();
      if (!newApp.followUpAt) newApp.followUpAt = followUpFrom(newApp.appliedOn);
    }

    apps.unshift(newApp);
    store.set(userId, apps);
    return NextResponse.json({ application: newApp }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Invalid application payload', detail: err?.message },
      { status: 400 }
    );
  }
}

async function PATCH_handler(req: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
        { status: 401 }
      );
    }
    const body = await req.json();
    const { id, status, title, company, location } = body;

    if (!id) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
    }

    const store = getStore();
    const apps = getUserApplications(userId);
    const target = apps.find((a) => a.id === id);
    if (!target) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (status && status !== target.status) {
      target.status = status;
      target.timeline.unshift({
        title: `Moved to ${status}`,
        timestamp: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        description: `Moved application stage to "${status}".`,
      });
    }
    // Moving into a sent stage for the first time records the date and a follow-up.
    if (status && SENT.test(status) && !target.appliedOn) {
      target.appliedOn = todayIso();
      if (!target.followUpAt) target.followUpAt = followUpFrom(target.appliedOn);
    }
    for (const f of TEXT_FIELDS) {
      if (typeof body[f] === 'string') (target as any)[f] = body[f].slice(0, f === 'notes' ? 5000 : 300);
    }
    for (const f of DATE_FIELDS) {
      const v = cleanDate(body[f]);
      if (v !== undefined) (target as any)[f] = v;
    }
    if (typeof title === 'string' && title.trim()) target.title = title.trim();
    if (typeof company === 'string' && company.trim()) target.company = company.trim();
    if (typeof location === 'string') target.location = location.trim();

    store.set(userId, apps);
    return NextResponse.json({ application: target });
  } catch {
    return NextResponse.json({ error: 'Failed to update application' }, { status: 400 });
  }
}

async function DELETE_handler(req: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
        { status: 401 }
      );
    }
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');
    if (!id) {
      try {
        const body = await req.json();
        id = body?.id;
      } catch {}
    }

    if (!id) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
    }

    const store = getStore();
    const apps = getUserApplications(userId);
    const idx = apps.findIndex((a) => a.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const [removed] = apps.splice(idx, 1);
    store.set(userId, apps);
    return NextResponse.json({ deleted: true, id: removed.id });
  } catch {
    return NextResponse.json({ error: 'Failed to delete application' }, { status: 400 });
  }
}

export const GET = withUserData(GET_handler);
export const POST = withUserData(POST_handler);
export const PATCH = withUserData(PATCH_handler);
export const DELETE = withUserData(DELETE_handler);
