import { NextRequest, NextResponse } from 'next/server';

declare global {
  var __jobora_applications: Array<any> | undefined;
}

const applicationsStore: Array<any> = global.__jobora_applications || (global.__jobora_applications = []);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const filtered =
    status && status !== 'all'
      ? applicationsStore.filter((a) => a.status?.toLowerCase() === status.toLowerCase())
      : applicationsStore;

  return NextResponse.json({
    success: true,
    applications: filtered,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const now = new Date();
    const newApp = {
      id: `app-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      jobId: body.jobId || '',
      title: body.title || 'Untitled Position',
      company: body.company || 'Organization',
      location: body.location || 'Remote',
      status: body.status || 'applied',
      matchScore: typeof body.matchScore === 'number' ? body.matchScore : 90,
      syncChannel: body.syncChannel || 'Direct',
      nextAction: body.nextAction || 'Follow-up in 3 days',
      recruiterName: body.recruiterName || 'Hiring Team',
      recruiterEmail: body.recruiterEmail || '',
      appliedAt: now.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      timeline: body.timeline || [
        {
          title: `Applied via ${body.syncChannel || 'Jobora'}`,
          timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          description: body.notes || 'Application submitted and tracked.',
        },
      ],
      attachments: body.attachments || [],
    };
    applicationsStore.unshift(newApp);
    return NextResponse.json({ success: true, application: newApp });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create application' }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const idx = applicationsStore.findIndex((a) => a.id === body.id);
    if (idx === -1) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }
    applicationsStore[idx] = { ...applicationsStore[idx], ...body };
    return NextResponse.json({ success: true, application: applicationsStore[idx] });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to update application' }, { status: 400 });
  }
}
