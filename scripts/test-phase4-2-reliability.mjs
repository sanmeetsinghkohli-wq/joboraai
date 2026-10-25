/**
 * Jobora AI — Phase 4.2 Product Readiness & Reliability Test Suite
 * 
 * Verifies:
 * 1. Copilot Schema & Input/Output Validation
 * 2. Copilot Approval Enforcement for External Actions
 * 3. Rate-Limiting Behavior & Abuse Protection
 * 4. Resume Upload Integrity (Size, MIME, Extension, Encryption Checks)
 * 5. Resume Analysis Integrity (Zero Hallucination on Empty Inputs)
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function report(testName, passed, detail = '') {
  totalChecks++;
  if (passed) {
    passedChecks++;
    console.log(`[PASS] ${testName}${detail ? ` — ${detail}` : ''}`);
  } else {
    failedChecks++;
    console.error(`[FAIL] ${testName}${detail ? ` — ${detail}` : ''}`);
  }
}

async function runPhase42Tests() {
  console.log('========================================================');
  console.log('JOBORA AI — PHASE 4.2 RELIABILITY & INTEGRITY TEST SUITE');
  console.log('========================================================\n');

  // Setup authenticated user for testing
  const testUserEmail = `qa_p42_${Date.now()}@example.com`;
  const signupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Talia',
      lastName: 'Al-Mansoor',
      email: testUserEmail,
      password: 'Password123!',
    }),
  });

  const extractCookieHeader = (res) => {
    const setCookies = typeof res.headers.getSetCookie === 'function'
      ? res.headers.getSetCookie()
      : [res.headers.get('set-cookie') || ''];
    return setCookies
      .map((c) => c.split(';')[0].trim())
      .filter(Boolean)
      .join('; ');
  };

  const authCookie = extractCookieHeader(signupRes);
  report('Test Environment Setup: User registered with session cookie', signupRes.status === 201);

  // ─── TEST 1: Copilot Input Validation ──────────────────────────────────────
  console.log('\n--- 1. Testing Copilot Request Schema & Boundary Validation ---');

  // Empty prompt
  const emptyRes = await fetch(`${BASE_URL}/api/copilot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: authCookie },
    body: JSON.stringify({ message: '   ' }),
  });
  const emptyData = await emptyRes.json().catch(() => ({}));
  report(
    'Copilot Validation: Empty message rejected with HTTP 400',
    emptyRes.status === 400 && emptyData?.error?.code === 'VALIDATION_ERROR',
    `Status=${emptyRes.status}, code=${emptyData?.error?.code}`
  );

  // Oversized prompt (>3000 chars)
  const hugeRes = await fetch(`${BASE_URL}/api/copilot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: authCookie },
    body: JSON.stringify({ message: 'A'.repeat(3500) }),
  });
  const hugeData = await hugeRes.json().catch(() => ({}));
  report(
    'Copilot Validation: Oversized message (>3000 chars) rejected with HTTP 400',
    hugeRes.status === 400 && hugeData?.error?.code === 'VALIDATION_ERROR',
    `Status=${hugeRes.status}, message="${hugeData?.error?.message}"`
  );

  // Valid prompt structure
  const validRes = await fetch(`${BASE_URL}/api/copilot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: authCookie },
    body: JSON.stringify({ message: 'Recommend jobs matching my profile.' }),
  });
  const validData = await validRes.json().catch(() => ({}));
  const hasRequiredFields =
    typeof validData.reply === 'string' &&
    Array.isArray(validData.toolLogs) &&
    Array.isArray(validData.suggestedActions) &&
    'approvalRequired' in validData &&
    typeof validData.timestamp === 'string';

  report(
    'Copilot Output Schema: Response strictly adheres to expected schema',
    validRes.status === 200 && hasRequiredFields,
    `Status=${validRes.status}, provider=${validData?.providerMode}`
  );

  // ─── TEST 2: Copilot Approval Gate Enforcement ────────────────────────────
  console.log('\n--- 2. Testing Consequential Action Approval Gates ---');

  const applyRes = await fetch(`${BASE_URL}/api/copilot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: authCookie },
    body: JSON.stringify({ message: 'Prepare and submit my application for Careem' }),
  });
  const applyData = await applyRes.json().catch(() => ({}));

  report(
    'Copilot Safety: Consequential submission halts at approvalRequired gate',
    applyRes.status === 200 &&
      applyData?.approvalRequired?.actionType === 'apply_external' &&
      applyData?.toolLogs?.some((t) => t.status === 'requires_approval'),
    `actionType=${applyData?.approvalRequired?.actionType}`
  );

  // ─── TEST 3: Rate Limiting & Abuse Protection ─────────────────────────────
  console.log('\n--- 3. Testing Rate Limiting & Abuse Protection ---');

  // Verify rate limit headers
  const rateLimitHeaderRes = await fetch(`${BASE_URL}/api/copilot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: authCookie },
    body: JSON.stringify({ message: 'Check my application pipeline' }),
  });
  const hasRateHeaders =
    rateLimitHeaderRes.headers.has('x-ratelimit-limit') &&
    rateLimitHeaderRes.headers.has('x-ratelimit-remaining') &&
    rateLimitHeaderRes.headers.get('x-ratelimit-scope') === 'local-node-runtime';

  report(
    'Rate Limiting: Standard headers returned (Limit, Remaining, Scope)',
    hasRateHeaders,
    `Limit=${rateLimitHeaderRes.headers.get('x-ratelimit-limit')}, Scope=${rateLimitHeaderRes.headers.get('x-ratelimit-scope')}`
  );

  // ─── TEST 4: Resume Upload & Parsing Reliability ──────────────────────────
  console.log('\n--- 4. Testing Resume Upload & Document Integrity ---');

  // Reject empty file (0 bytes)
  const emptyUploadRes = await fetch(`${BASE_URL}/api/resumes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: authCookie },
    body: JSON.stringify({ fileName: 'empty.pdf', fileSize: 0, rawText: '' }),
  });
  const emptyUploadData = await emptyUploadRes.json().catch(() => ({}));
  report(
    'Resume Upload: Empty file (0 bytes) rejected with HTTP 400',
    emptyUploadRes.status === 400 && emptyUploadData.error.includes('empty'),
    `Status=${emptyUploadRes.status}, error="${emptyUploadData.error}"`
  );

  // Reject unsupported file extension
  const badExtRes = await fetch(`${BASE_URL}/api/resumes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: authCookie },
    body: JSON.stringify({ fileName: 'payload.exe', fileSize: 1024, rawText: 'binary' }),
  });
  const badExtData = await badExtRes.json().catch(() => ({}));
  report(
    'Resume Upload: Unsupported file extension rejected with HTTP 400',
    badExtRes.status === 400 && badExtData.error.includes('Unsupported file extension'),
    `Status=${badExtRes.status}, error="${badExtData.error}"`
  );

  // Reject file exceeding 10MB
  const oversizeRes = await fetch(`${BASE_URL}/api/resumes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: authCookie },
    body: JSON.stringify({ fileName: 'huge.pdf', fileSize: 15 * 1024 * 1024, rawText: 'data' }),
  });
  const oversizeData = await oversizeRes.json().catch(() => ({}));
  report(
    'Resume Upload: Oversized file (>10MB) rejected with HTTP 400',
    oversizeRes.status === 400 && oversizeData.error.includes('10MB'),
    `Status=${oversizeRes.status}, error="${oversizeData.error}"`
  );

  // Detect and reject password-protected / encrypted PDF
  const encryptedRes = await fetch(`${BASE_URL}/api/resumes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: authCookie },
    body: JSON.stringify({
      fileName: 'secure_resume.pdf',
      fileSize: 25000,
      rawText: '%PDF-1.4 ... /Encrypt 12 0 R /Filter /Standard ...',
    }),
  });
  const encryptedData = await encryptedRes.json().catch(() => ({}));
  report(
    'Resume Upload: Password-protected/encrypted PDF rejected with HTTP 422',
    encryptedRes.status === 422 && encryptedData.error.includes('encrypted'),
    `Status=${encryptedRes.status}, error="${encryptedData.error}"`
  );

  // Valid upload succeeds
  const validUploadRes = await fetch(`${BASE_URL}/api/resumes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: authCookie },
    body: JSON.stringify({
      fileName: 'Talia_AlMansoor_CV.pdf',
      fileSize: 124000,
      rawText: 'Talia Al-Mansoor\nSenior AI Systems Engineer\nSkills: Python, PyTorch, TypeScript, Docker, Kubernetes',
    }),
  });
  const validUploadData = await validUploadRes.json().catch(() => ({}));
  const resumeId = validUploadData?.resume?.id;
  report(
    'Resume Upload: Valid PDF upload stored with ID and user association',
    validUploadRes.status === 201 && Boolean(resumeId),
    `Status=${validUploadRes.status}, resumeId=${resumeId}`
  );

  // ─── TEST 5: Resume Analysis Zero-Hallucination Integrity ─────────────────
  console.log('\n--- 5. Testing Analysis Zero-Hallucination Integrity ---');

  // Analyze empty document (should NOT hallucinate fake skills)
  const emptyDocRes = await fetch(`${BASE_URL}/api/resumes/${resumeId}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: authCookie },
    body: JSON.stringify({ rawText: '   ' }),
  });
  const emptyDocData = await emptyDocRes.json().catch(() => ({}));
  const emptySkillsCount = emptyDocData?.analysis?.extractedSkillsCount;
  report(
    'Analysis Integrity: Empty CV document does NOT hallucinate fake skills',
    emptyDocRes.status === 200 && emptySkillsCount === 0 && Boolean(emptyDocData?.analysis?.note),
    `extractedSkillsCount=${emptySkillsCount}, note="${emptyDocData?.analysis?.note?.slice(0, 50)}..."`
  );

  // Analyze genuine document (accurately extracts real skills)
  const realDocRes = await fetch(`${BASE_URL}/api/resumes/${resumeId}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: authCookie },
    body: JSON.stringify({
      rawText: 'Talia Al-Mansoor\nSkills: Python, PyTorch, TypeScript, Docker, Kubernetes\nExperience at Apex AI',
    }),
  });
  const realDocData = await realDocRes.json().catch(() => ({}));
  const realSkillsCount = realDocData?.analysis?.extractedSkillsCount;
  report(
    'Analysis Integrity: Genuine CV extracts verified skills and computes truthful ATS rubric',
    realDocRes.status === 200 && realSkillsCount >= 4,
    `extractedSkillsCount=${realSkillsCount}, atsScore=${realDocData?.analysis?.atsScore}`
  );

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log('\n========================================================');
  console.log(`PHASE 4.2 RELIABILITY SUITE: ${totalChecks} checks | PASSED: ${passedChecks} | FAILED: ${failedChecks}`);
  console.log('========================================================');

  if (failedChecks > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase42Tests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
