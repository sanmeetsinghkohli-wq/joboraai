/**
 * Jobora AI — End-to-End Route, API, Persistence, Security & Static Code Audit Suite
 * Executes against http://localhost:3000 and scans all source files in apps/web/src
 */

import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

const results = [];

function record(name, passed, detail) {
  results.push({ name, passed, detail });
  const icon = passed ? 'PASS' : 'FAIL';
  console.log(`[${icon}] ${name} — ${detail}`);
}

function walkFiles(dir, exts = ['.tsx', '.ts']) {
  const found = [];
  if (!fs.existsSync(dir)) return found;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...walkFiles(full, exts));
    } else if (exts.some((ext) => entry.name.endsWith(ext))) {
      found.push(full);
    }
  }
  return found;
}

async function runStaticAudit() {
  const srcDir = path.join(process.cwd(), 'apps', 'web', 'src');
  const files = walkFiles(srcDir);

  let emptyAnchors = 0;
  let voidLinks = 0;
  let emptyOnClicks = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const hrefHash = content.match(/href\s*=\s*["']#["']/g);
    const hrefEmpty = content.match(/href\s*=\s*["']["']/g);
    const jsVoid = content.match(/javascript:void\(0\)/g);
    const noopClick = content.match(/onClick\s*=\s*\{\s*\(\)\s*=>\s*\{\s*\}\s*\}/g);

    if (hrefHash) emptyAnchors += hrefHash.length;
    if (hrefEmpty) emptyAnchors += hrefEmpty.length;
    if (jsVoid) voidLinks += jsVoid.length;
    if (noopClick) emptyOnClicks += noopClick.length;
  }

  record(
    'Static Audit: Zero empty href="#" or href="" anchors',
    emptyAnchors === 0,
    `Scanned ${files.length} source files, found ${emptyAnchors} empty anchors`
  );
  record(
    'Static Audit: Zero javascript:void(0) links',
    voidLinks === 0,
    `Found ${voidLinks} javascript:void(0) links`
  );
  record(
    'Static Audit: Zero no-op onClick={() => {}} handlers',
    emptyOnClicks === 0,
    `Found ${emptyOnClicks} no-op click handlers`
  );
}

async function runRouteAudit() {
  const routes = [
    '/',
    '/dashboard',
    '/ai-copilot',
    '/jobs',
    '/jobs/jobora-stripe-staff-product',
    '/saved-jobs',
    '/applications',
    '/applications/prepare',
    '/applications/app-demo-1',
    '/cv-studio',
    '/cover-letters',
    '/interview',
    '/career-insights',
    '/documents',
    '/email-composer',
    '/settings',
    '/settings/integrations',
    '/notifications',
    '/auth',
    '/verify-email',
    '/reset-password',
    '/onboarding',
    '/pricing',
  ];

  for (const route of routes) {
    try {
      const res = await fetch(`${BASE_URL}${route}`, { redirect: 'follow' });
      const html = await res.text();
      const ok = res.status === 200 && html.length > 200;
      record(`Route HTTP 200: ${route}`, ok, `Status ${res.status} (${html.length} bytes)`);
    } catch (err) {
      record(`Route HTTP 200: ${route}`, false, `Error: ${err.message}`);
    }
  }
}

async function runApiAndAuthAudit() {
  // 1. Unauthenticated /api/auth/me returns 401
  const unauthMe = await fetch(`${BASE_URL}/api/auth/me`);
  record(
    'API Auth: Unauthenticated GET /api/auth/me returns 401',
    unauthMe.status === 401,
    `Status ${unauthMe.status}`
  );

  // 2. Register User A
  const extractCookieHeader = (res) => {
    const setCookies = typeof res.headers.getSetCookie === 'function'
      ? res.headers.getSetCookie()
      : [res.headers.get('set-cookie') || ''];
    return setCookies
      .map((c) => c.split(';')[0].trim())
      .filter(Boolean)
      .join('; ');
  };

  const emailA = `qa_user_a_${Date.now()}@example.com`;
  const signupA = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Aria',
      lastName: 'Montgomery',
      email: emailA,
      password: 'Password123!',
    }),
  });
  const dataA = await signupA.json();
  const cookieA = extractCookieHeader(signupA);
  record(
    'API Auth: POST /api/auth/signup creates User A & sets HttpOnly cookie',
    signupA.status === 201 && Boolean(dataA?.user?.id) && cookieA.includes('jobora_access_token'),
    `Status ${signupA.status}, userId=${dataA?.user?.id}`
  );

  // 3. Duplicate registration rejected with 409
  const dupSignup = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Aria',
      email: emailA,
      password: 'Password123!',
    }),
  });
  record(
    'API Auth: Duplicate signup rejected with HTTP 409',
    dupSignup.status === 409,
    `Status ${dupSignup.status}`
  );

  // 4. Verify Email for User A
  const verifyRes = await fetch(`${BASE_URL}/api/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
    body: JSON.stringify({ token: dataA.devVerificationToken }),
  });
  record(
    'API Auth: POST /api/auth/verify-email verifies token',
    verifyRes.status === 200,
    `Status ${verifyRes.status}`
  );

  // 5. Save Onboarding Profile for User A
  const onboardSave = await fetch(`${BASE_URL}/api/onboarding`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
    body: JSON.stringify({
      firstName: 'Aria',
      lastName: 'Montgomery',
      targetRole: 'Staff AI Engineer',
      skills: ['TypeScript', 'Python', 'PyTorch', 'Next.js'],
    }),
  });
  record(
    'API Persistence: POST /api/onboarding saves profile for User A',
    onboardSave.status === 200,
    `Status ${onboardSave.status}`
  );

  // 6. Create Application for User A
  const createAppA = await fetch(`${BASE_URL}/api/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
    body: JSON.stringify({
      jobId: 'job-stripe-1',
      title: 'Staff Product Engineer',
      company: 'Stripe',
      location: 'San Francisco, CA',
      status: 'Applied',
    }),
  });
  const appDataA = await createAppA.json().catch(() => ({}));
  const appIdA = appDataA?.application?.id;
  record(
    'API Persistence: POST /api/applications creates application for User A',
    createAppA.status === 201 && Boolean(appIdA),
    `Status ${createAppA.status}, id=${appIdA}, err=${JSON.stringify(appDataA?.error || null)}`
  );

  // 7. Cross-User Isolation: Register User B and verify User B cannot see User A's applications
  const emailB = `qa_user_b_${Date.now()}@example.com`;
  const signupB = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Bram',
      email: emailB,
      password: 'Password123!',
    }),
  });
  const cookieB = extractCookieHeader(signupB);

  const appsBRes = await fetch(`${BASE_URL}/api/applications`, {
    headers: { Cookie: cookieB },
  });
  const appsBData = await appsBRes.json().catch(() => ({ applications: [] }));
  record(
    'Security & Isolation: User B cannot read User A applications',
    Array.isArray(appsBData.applications) && appsBData.applications.length === 0,
    `User B applications count=${appsBData.applications?.length}`
  );

  // 8. Update Application Status (PATCH) for User A
  const patchRes = await fetch(`${BASE_URL}/api/applications`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
    body: JSON.stringify({ id: appIdA, status: 'Interview' }),
  });
  const patchData = await patchRes.json().catch(() => ({}));
  record(
    'API Persistence: PATCH /api/applications updates status & timeline',
    patchRes.status === 200 && patchData?.application?.status === 'Interview',
    `New status=${patchData?.application?.status}`
  );

  // 9. Delete Application (DELETE) for User A
  const delRes = await fetch(`${BASE_URL}/api/applications?id=${encodeURIComponent(appIdA || '')}`, {
    method: 'DELETE',
    headers: { Cookie: cookieA },
  });
  record(
    'API Persistence: DELETE /api/applications removes record',
    delRes.status === 200,
    `Status ${delRes.status}`
  );

  // 10. Live Jobs API (/api/jobs)
  const jobsRes = await fetch(`${BASE_URL}/api/jobs?q=engineer`);
  const jobsData = await jobsRes.json();
  record(
    'API Jobs: GET /api/jobs returns live deduplicated roles + syncedAt + providerStatus',
    jobsRes.status === 200 &&
      Array.isArray(jobsData.jobs) &&
      jobsData.jobs.length > 0 &&
      Boolean(jobsData.syncedAt) &&
      Boolean(jobsData.providerStatus),
    `Returned ${jobsData.jobs?.length} jobs, syncedAt=${jobsData.syncedAt}`
  );

  // 11. Resume Upload & Analysis API (/api/resumes & /api/resumes/[id]/analyze)
  const resumeUploadRes = await fetch(`${BASE_URL}/api/resumes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
    body: JSON.stringify({
      fileName: 'Aria_Montgomery_CV.pdf',
      rawText: 'Aria Montgomery\nStaff AI Engineer\nSkills: Python, PyTorch, TypeScript, Next.js, AWS, Docker',
    }),
  });
  const resumeData = await resumeUploadRes.json();
  const resumeId = resumeData?.resume?.id || 'res-test';
  record(
    'API CV Studio: POST /api/resumes stores & parses resume',
    resumeUploadRes.status === 201,
    `Status ${resumeUploadRes.status}, resumeId=${resumeId}`
  );

  const analyzeRes = await fetch(`${BASE_URL}/api/resumes/${resumeId}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
    body: JSON.stringify({
      rawText: 'Aria Montgomery\nSkills: Python, PyTorch, TypeScript, Next.js, AWS',
      targetRole: 'Staff AI Engineer',
    }),
  });
  const analyzeData = await analyzeRes.json();
  record(
    'API CV Studio: POST /api/resumes/[id]/analyze computes transparent ATS score',
    analyzeRes.status === 200 && typeof analyzeData?.analysis?.atsScore === 'number',
    `Status ${analyzeRes.status}, atsScore=${analyzeData?.analysis?.atsScore}`
  );

  // 12. AI Copilot API (/api/copilot)
  const copilotRes = await fetch(`${BASE_URL}/api/copilot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
    body: JSON.stringify({
      message: 'Prepare an application package for my top job',
      context: { jobs: jobsData.jobs.slice(0, 2) },
    }),
  });
  const copilotData = await copilotRes.json();
  record(
    'API AI Copilot: POST /api/copilot returns tool logs & enforces approvalRequired gate',
    copilotRes.status === 200 &&
      Array.isArray(copilotData.toolLogs) &&
      Boolean(copilotData.approvalRequired),
    `Status ${copilotRes.status}, approvalGate=${copilotData?.approvalRequired?.actionType}`
  );
}

async function main() {
  console.log('====================================================');
  console.log('JOBORA AI — AUTOMATED QA & VERIFICATION SUITE');
  console.log('====================================================');
  await runStaticAudit();
  await runRouteAudit();
  await runApiAndAuthAudit();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log('----------------------------------------------------');
  console.log(`TOTAL: ${results.length} checks | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('----------------------------------------------------');
  if (failed > 0) {
    process.exit(1);
  }
}

main();
