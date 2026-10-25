import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId } from '../auth/_lib';

export const dynamic = 'force-dynamic';

export interface StoredApplication {
  id: string;
  userId: string;
  jobId: string;
  title: string;
  company: string;
  location: string;
  status: string;
  matchScore: number;
  syncChannel: string;
  nextAction: string;
  recruiterName: string;
  recruiterEmail: string;
  appliedAt: string;
  timeline: Array<{ title: string; timestamp: string; description: string }>;
  attachments: Array<{ name: string; size: string; badge: string }>;
}

function getStore(): Map<string, StoredApplication[]> {
  if (!global.__jobora_applications || !(global.__jobora_applications instanceof Map)) {
    global.__jobora_applications = new Map<string, StoredApplication[]>();
  }
  return global.__jobora_applications as Map<string, StoredApplication[]>;
}

function getUserApplications(userId: string): StoredApplication[] {
  const store = getStore();
  const existing = store.get(userId);
  if (Array.isArray(existing)) return existing;
  const fresh: StoredApplication[] = [];
  store.set(userId, fresh);
  return fresh;
}

export async function GET(req: NextRequest) {
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

export async function POST(req: NextRequest) {
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
      location: String(body.location || 'Remote').trim(),
      status: String(body.status || 'Sent Today').trim(),
      matchScore: typeof body.matchScore === 'number' ? body.matchScore : 90,
      syncChannel: String(body.syncChannel || 'Direct Application').trim(),
      nextAction: String(body.nextAction || 'Follow up in 5 days').trim(),
      recruiterName: String(body.recruiterName || `${company} Talent Acquisition`).trim(),
      recruiterEmail: String(
        body.recruiterEmail || `careers@${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`
      ).trim(),
      appliedAt: formattedDate,
      timeline: body.timeline || [
        {
          title: 'Application Logged',
          timestamp: `${formattedDate} • ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          description: `Tracked application for ${title} at ${company}.`,
        },
      ],
      attachments: body.attachments || [
        {
          name: `${title.replace(/\s+/g, '_')}_Tailored_CV.pdf`,
          size: '420 KB',
          badge: 'TAILORED',
        },
      ],
    };

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

export async function PATCH(req: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
        { status: 401 }
      );
    }
    const body = await req.json();
    const { id, status, nextAction, recruiterName, recruiterEmail, title, company, location } = body;

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
        title: `Stage Updated: ${status}`,
        timestamp: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        description: `Moved application stage to "${status}".`,
      });
    }
    if (typeof nextAction === 'string') target.nextAction = nextAction;
    if (typeof recruiterName === 'string') target.recruiterName = recruiterName;
    if (typeof recruiterEmail === 'string') target.recruiterEmail = recruiterEmail;
    if (typeof title === 'string' && title.trim()) target.title = title.trim();
    if (typeof company === 'string' && company.trim()) target.company = company.trim();
    if (typeof location === 'string') target.location = location.trim();

    store.set(userId, apps);
    return NextResponse.json({ application: target });
  } catch {
    return NextResponse.json({ error: 'Failed to update application' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
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
