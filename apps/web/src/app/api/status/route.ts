import { NextResponse } from 'next/server';
import { kvPing } from '@/lib/db/kv';

export const dynamic = 'force-dynamic';

/**
 * Public health check for uptime monitors. Reports only whether the app and its
 * database answer; no configuration, provider or setup details.
 */
export async function GET() {
  const database = await kvPing();
  const healthy = database === 'ok';
  return NextResponse.json(
    { status: healthy ? 'healthy' : 'degraded', database, timestamp: new Date().toISOString() },
    { status: healthy ? 200 : 503, headers: { 'Cache-Control': 'no-store' } }
  );
}
