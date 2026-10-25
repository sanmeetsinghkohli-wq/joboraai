import { NextResponse } from 'next/server';
import { getDatabaseStatus, checkDatabaseReadiness } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const dbStatus = getDatabaseStatus();
  const readiness = checkDatabaseReadiness();

  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: {
      isConfigured: dbStatus.isConfigured,
      provider: dbStatus.provider,
      storageEngine: dbStatus.storageEngine,
      requireDurableStorage: dbStatus.requireDurableStorage,
      storageBucket: dbStatus.storageBucket,
      statusMessage: dbStatus.statusMessage,
      nextAction: readiness.nextAction,
    },
    version: '1.0.0-phase5',
  });
}
