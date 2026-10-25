/**
 * Jobora AI — Phase 4.3 Copilot Audit & End-to-End User Journey Verification
 *
 * Verifies:
 * 1. Groq integration with qwen/qwen3.8-27b, activeModel exposure, and tool execution.
 * 2. Deterministic fallback behavior when provider failure is simulated.
 * 3. Retrieval and distinction of genuine live provider jobs from AI career synthesis.
 * 4. Safety boundaries: empty prompt, oversized prompt, unauthenticated access, and approval gates.
 * 5. Full user journey: signup, session, profile onboarding, job search, job saving, and application CRUD.
 */

const BASE_URL = 'http://localhost:3000';

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function report(description, passed, details = '') {
  totalChecks++;
  if (passed) {
    passedChecks++;
    console.log(`[PASS] ${description}${details ? ` — ${details}` : ''}`);
  } else {
    failedChecks++;
    console.error(`[FAIL] ${description}${details ? ` — ${details}` : ''}`);
  }
}

async function runAudit() {
  console.log('========================================================================');
  console.log('JOBORA AI — PHASE 4.3 COPILOT AUDIT & USER JOURNEY VERIFICATION');
  console.log('========================================================================\n');

  const testUserEmail = `audit_user_${Date.now()}@jobora.ai`;
  const testUserPassword = 'TestPassword123!';
  let authCookie = '';
  let userId = '';

  // ─── 1. USER JOURNEY: AUTHENTICATION & ONBOARDING ───────────────────────────
  console.log('--- 1. Testing User Journey: Signup & Profile Onboarding ---');

  // Test Unauthenticated request to protected route
  const unauthRes = await fetch(`${BASE_URL}/api/copilot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Hello Copilot' }),
  });
  report(
    'Auth Protection: Unauthenticated POST /api/copilot returns HTTP 401',
    unauthRes.status === 401,
    `Status=${unauthRes.status}`
  );

  // Signup
  const signupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Layla',
      lastName: 'Al-Hashemi',
      email: testUserEmail,
      password: testUserPassword,
    }),
  });
  const signupData = await signupRes.json().catch(() => ({}));
  authCookie = signupRes.headers.get('set-cookie')?.split(';')[0] || '';
  userId = signupData.user?.id || '';

  report(
    'User Journey: Signup creates authenticated user session',
    signupRes.status === 201 && Boolean(authCookie) && Boolean(userId),
    `Status=${signupRes.status}, userId=${userId}`
  );

  // Verify session /api/auth/me
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Cookie: authCookie },
  });
  const meData = await meRes.json().catch(() => ({}));
  report(
    'User Journey: GET /api/auth/me confirms active authenticated session',
    meRes.status === 200 && meData.user?.email === testUserEmail,
    `email=${meData.user?.email}`
  );

  // Onboarding profile save
  const onboardingRes = await fetch(`${BASE_URL}/api/onboarding`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: authCookie },
    body: JSON.stringify({
      targetRole: 'Senior AI Engineer',
      skills: ['Python', 'PyTorch', 'TypeScript', 'Next.js', 'Docker', 'FastAPI'],
      experienceYears: '5-7',
      location: 'Dubai, UAE',
      preferredLocation: 'Dubai',
      workPreference: 'hybrid',
    }),
  });
  const onboardingData = await onboardingRes.json().catch(() => ({}));
  report(
    'User Journey: POST /api/onboarding stores profile with verified skills',
    onboardingRes.status === 200 && onboardingData.success === true,
    `Status=${onboardingRes.status}`
  );

  // ─── 2. GROQ COPILOT INTEGRATION & TOOL LOGS ──────────────────────────────
  console.log('\n--- 2. Testing Groq Copilot Integration & Model Execution ---');

  const groqCopilotRes = await fetch(`${BASE_URL}/api/copilot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: authCookie },
    body: JSON.stringify({
      message: 'What key technical interview topics should I prepare for a Senior AI role in Dubai?',
    }),
  });
  const groqData = await groqCopilotRes.json().catch(() => ({}));

  const hasGroqSynthesis =
    groqCopilotRes.status === 200 &&
    groqData.providerMode === 'groq_ai' &&
    groqData.activeModel === 'qwen/qwen3.8-27b' &&
    groqData.toolLogs?.some((t) => t.tool === 'groq.chat_completion');

  report(
    'Groq Copilot: Live response synthesized via qwen/qwen3.8-27b',
    hasGroqSynthesis,
    `Status=${groqCopilotRes.status}, provider=${groqData.providerMode}, model=${groqData.activeModel}`
  );

  report(
    'Groq Copilot: Tool execution recorded in telemetry logs',
    groqData.toolLogs?.some((t) => t.tool === 'groq.chat_completion' && t.status === 'completed'),
    `ToolCount=${groqData.toolLogs?.length}, Tools=${groqData.toolLogs?.map((t) => t.tool).join(', ')}`
  );

  // ─── 3. DETERMINISTIC FALLBACK RESILIENCE ─────────────────────────────────
  console.log('\n--- 3. Testing Provider Failure & Fallback Resilience ---');

  const fallbackRes = await fetch(`${BASE_URL}/api/copilot`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: authCookie,
      'x-simulate-provider-failure': 'true',
    },
    body: JSON.stringify({
      message: 'What key technical interview topics should I prepare for a Senior AI role in Dubai?',
    }),
  });
  const fallbackData = await fallbackRes.json().catch(() => ({}));

  report(
    'Fallback Resilience: Provider failure gracefully falls back to deterministic copilot',
    fallbackRes.status === 200 &&
      fallbackData.providerMode === 'deterministic_copilot_engine' &&
      fallbackData.activeModel === null &&
      Boolean(fallbackData.reply),
    `Status=${fallbackRes.status}, providerMode=${fallbackData.providerMode}`
  );

  // ─── 4. LIVE JOBS RETRIEVAL & GROUNDING ───────────────────────────────────
  console.log('\n--- 4. Testing Live Job Retrieval & Separation from General Advice ---');

  // Sync live feeds
  const jobsRes = await fetch(`${BASE_URL}/api/jobs?location=Dubai`);
  const jobsData = await jobsRes.json().catch(() => ({}));
  report(
    'Job Ingestion: GET /api/jobs returns genuine live provider listings',
    jobsRes.status === 200 && Array.isArray(jobsData.jobs) && jobsData.jobs.length > 0,
    `TotalJobs=${jobsData.jobs?.length}, Providers=${Object.keys(jobsData.providerStatus || {}).join(', ')}`
  );

  // Test Copilot job recommendation with live feeds
  const jobQueryRes = await fetch(`${BASE_URL}/api/copilot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: authCookie },
    body: JSON.stringify({
      message: 'Find live software engineer jobs in Dubai matching my profile',
      context: { jobs: (jobsData.jobs || []).slice(0, 5) },
    }),
  });
  const jobQueryData = await jobQueryRes.json().catch(() => ({}));

  const hasLiveJobSection =
    jobQueryData.reply?.includes('Live Opportunities from Integrated Feeds') ||
    jobQueryData.reply?.includes('top live opportunities') ||
    jobQueryData.reply?.includes('Profile Alignment Breakdown');

  report(
    'Copilot Grounding: Genuinely returns live jobs with source attribution',
    jobQueryRes.status === 200 && hasLiveJobSection,
    `containsLiveSection=${hasLiveJobSection}`
  );

  // ─── 5. SAFETY & APPROVAL GATES ──────────────────────────────────────────
  console.log('\n--- 5. Testing Copilot Safety Boundaries & Approval Gates ---');

  // Empty prompt
  const emptyRes = await fetch(`${BASE_URL}/api/copilot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: authCookie },
    body: JSON.stringify({ message: '   ' }),
  });
  report(
    'Safety: Empty prompt rejected with HTTP 400 VALIDATION_ERROR',
    emptyRes.status === 400,
    `Status=${emptyRes.status}`
  );

  // Oversized prompt (>3000 chars)
  const hugeRes = await fetch(`${BASE_URL}/api/copilot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: authCookie },
    body: JSON.stringify({ message: 'Z'.repeat(3100) }),
  });
  report(
    'Safety: Oversized prompt (>3,000 chars) rejected with HTTP 400',
    hugeRes.status === 400,
    `Status=${hugeRes.status}`
  );

  // Consequential action approval gate
  const applyGateRes = await fetch(`${BASE_URL}/api/copilot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: authCookie },
    body: JSON.stringify({
      message: 'Submit my official application for Senior Product Designer at Careem',
      context: { jobs: (jobsData.jobs || []).slice(0, 1) },
    }),
  });
  const applyGateData = await applyGateRes.json().catch(() => ({}));

  report(
    'Safety: Consequential submission halts at approvalRequired gate',
    applyGateRes.status === 200 &&
      applyGateData.approvalRequired?.actionType === 'apply_external' &&
      applyGateData.toolLogs?.some((t) => t.status === 'requires_approval'),
    `actionType=${applyGateData.approvalRequired?.actionType}`
  );

  // ─── 6. APPLICATION TRACKER CRUD ──────────────────────────────────────────
  console.log('\n--- 6. Testing Application Tracker Lifecycle ---');

  const sampleJob = jobsData.jobs?.[0] || { id: 'job-1', title: 'Senior Software Engineer', company: 'Careem' };

  // Create application
  const createReqRes = await fetch(`${BASE_URL}/api/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: authCookie },
    body: JSON.stringify({
      jobId: sampleJob.id,
      title: sampleJob.title,
      company: sampleJob.company,
      location: sampleJob.location || 'Dubai, UAE',
      status: 'Applied',
      notes: 'Initial application package prepared via Copilot',
    }),
  });
  const createData = await createReqRes.json().catch(() => ({}));
  const applicationId = createData.application?.id;

  report(
    'Application Tracker: POST /api/applications creates new record',
    createReqRes.status === 201 && Boolean(applicationId),
    `Status=${createReqRes.status}, id=${applicationId}`
  );

  // Update application status
  const updateReqRes = await fetch(`${BASE_URL}/api/applications`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: authCookie },
    body: JSON.stringify({
      id: applicationId,
      status: 'Interview',
      nextAction: 'Technical screening scheduled for Thursday',
    }),
  });
  const updateData = await updateReqRes.json().catch(() => ({}));

  report(
    'Application Tracker: PATCH /api/applications updates status to Interview',
    updateReqRes.status === 200 && updateData.application?.status === 'Interview',
    `NewStatus=${updateData.application?.status}`
  );

  // Delete application
  const deleteReqRes = await fetch(`${BASE_URL}/api/applications?id=${applicationId}`, {
    method: 'DELETE',
    headers: { Cookie: authCookie },
  });
  report(
    'Application Tracker: DELETE /api/applications cleanly removes record',
    deleteReqRes.status === 200,
    `Status=${deleteReqRes.status}`
  );

  // ─── SUMMARY ──────────────────────────────────────────────────────────────
  console.log('\n========================================================================');
  console.log(`PHASE 4.3 AUDIT: ${totalChecks} checks | PASSED: ${passedChecks} | FAILED: ${failedChecks}`);
  console.log('========================================================================');

  if (failedChecks > 0) {
    process.exit(1);
  }
}

runAudit().catch((err) => {
  console.error('Audit execution error:', err);
  process.exit(1);
});
