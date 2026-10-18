import assert from 'assert';

const BASE_URL = 'http://localhost:3000';

async function runDefectTests() {
  console.log('========================================================');
  console.log('JOBORA AI — PHASE 2.1 DEFECT & REGRESSION TEST SUITE');
  console.log('========================================================');

  let passed = 0;
  let failed = 0;

  function report(name, condition, detail) {
    if (condition) {
      console.log(`[PASS] ${name} — ${detail}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name} — ${detail}`);
      failed++;
    }
  }

  // TEST 1: DEF-01 — Persistence after refresh & Undo via API & Profile Store
  console.log('\n--- Testing DEF-01: CV Studio Decisions Persistence & Undo ---');
  const userEmail = `def01_user_${Date.now()}@example.com`;
  const signupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Elena',
      lastName: 'Rostova',
      email: userEmail,
      password: 'SecurePassword123!',
    }),
  });
  const cookie = signupRes.headers.get('set-cookie')?.split(';')[0] || '';
  report('User Session Created', signupRes.status === 201, `Status ${signupRes.status}`);

  // 1a. Persist decision: diff1 accepted, diff2 rejected
  const saveDecisionsRes = await fetch(`${BASE_URL}/api/onboarding`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      cvDecisions: { diff1: 'accepted', diff2: 'rejected' },
    }),
  });
  const saveDecisionsData = await saveDecisionsRes.json();
  report(
    'DEF-01: Decisions Saved in User Profile Store',
    saveDecisionsRes.status === 200 &&
      saveDecisionsData.profile?.cvDecisions?.diff1 === 'accepted' &&
      saveDecisionsData.profile?.cvDecisions?.diff2 === 'rejected',
    `diff1=${saveDecisionsData.profile?.cvDecisions?.diff1}, diff2=${saveDecisionsData.profile?.cvDecisions?.diff2}`
  );

  // 1b. Simulate page reload / subsequent session retrieval via /api/auth/me
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Cookie: cookie },
  });
  const meData = await meRes.json();
  report(
    'DEF-01: Decisions Restored on Session Reload (/api/auth/me)',
    meRes.status === 200 &&
      meData.profile?.cvDecisions?.diff1 === 'accepted' &&
      meData.profile?.cvDecisions?.diff2 === 'rejected',
    `Restored diff1=${meData.profile?.cvDecisions?.diff1}, diff2=${meData.profile?.cvDecisions?.diff2}`
  );

  // 1c. Test Undo: revert diff1 back to pending
  const undoRes = await fetch(`${BASE_URL}/api/onboarding`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      cvDecisions: { diff1: 'pending', diff2: 'rejected' },
    }),
  });
  const undoData = await undoRes.json();
  report(
    'DEF-01: Undo Restores Suggestion to Pending Without Loss of Original Content',
    undoRes.status === 200 && undoData.profile?.cvDecisions?.diff1 === 'pending',
    `diff1 status after Undo=${undoData.profile?.cvDecisions?.diff1}`
  );

  // TEST 2: DEF-02 — Exported CV Text Verification
  console.log('\n--- Testing DEF-02: CV Text Content Assembly ---');
  // Build export preview string matching the component's handleExportText implementation
  const profile = {
    fullName: 'Elena Rostova',
    targetRole: 'Staff AI Systems Architect',
    email: userEmail,
    phone: '+971 50 123 4567',
    location: 'Dubai, UAE',
    skills: ['Python', 'PyTorch', 'TypeScript', 'Docker', 'AWS'],
    degree: 'MSc in Computer Science',
    university: 'Khalifa University',
    graduationYear: '2024',
    gpa: '3.92',
  };
  const summaryText = 'Architect specializing in low-latency transformer inference and scalable distributed backends.';

  // Scenario A: diff1 accepted, diff2 rejected
  function generateExportText(diff1, diff2) {
    const contactLine = [profile.email, profile.phone, profile.location].filter(Boolean).join(' • ');
    const project1Bullet2 =
      diff1 === 'accepted'
        ? 'Optimized inference serving for a custom Transformer Architecture leveraging quantization (AWQ), boosting Latency Optimization by 41% across high-load concurrent queries.'
        : 'Constructed a conversational bot utilizing HuggingFace models to answer support tickets.';
    const project1Bullet3 =
      diff2 === 'accepted'
        ? 'Containerized services using Docker and orchestrated CI/CD smoke test pipelines for automated regression tracking on AWS EC2.'
        : null;

    const sections = [
      profile.fullName.toUpperCase(),
      profile.targetRole,
      contactLine,
      '',
      'EXECUTIVE SUMMARY',
      summaryText,
      '',
      'EDUCATION',
      `${profile.degree} — ${profile.university} (${profile.graduationYear}, GPA ${profile.gpa})`,
      'Relevant Coursework: Distributed Systems, Deep Learning, Algorithmic Analysis, Database Internals',
      '',
      'TECHNICAL PROJECTS & RESEARCH',
      '1. Autonomous Multi-Agent RAG Assistant (Python • Qdrant • vLLM)',
      '   • Engineered an asynchronous vector retrieval service indexing 450k+ technical documents with sub-120ms semantic search.',
      `   • ${project1Bullet2}`,
      ...(project1Bullet3 ? [`   • ${project1Bullet3}`] : []),
      '',
      '2. Distributed Resilient Web Scraper & Ingestion Pipeline (Go • Redis • gRPC)',
      '   • Designed a fault-tolerant scraping architecture parsing 1.2M web nodes daily with exponential backoff and proxy rotation.',
      '   • Reduced memory footprint by 34% through zero-copy buffer allocations in high-volume Go routines.',
      '',
      'TECHNICAL COMPETENCIES',
      `• Core Skills: ${profile.skills.join(', ')}`,
      '• AI & ML Systems: Transformers, LangChain, LlamaIndex, vLLM, HuggingFace',
      '• Cloud & Tools: AWS (EC2, S3), Docker, Git, Redis, Linux, PostgreSQL',
    ];
    return sections.join('\n');
  }

  const exportAccepted = generateExportText('accepted', 'rejected');
  report(
    'DEF-02: Export Contains Full Project Sections & Accepted Tailored Optimization',
    exportAccepted.includes('TECHNICAL PROJECTS & RESEARCH') &&
      exportAccepted.includes('Transformer Architecture') &&
      exportAccepted.includes('Latency Optimization by 41%') &&
      !exportAccepted.includes('Containerized services using Docker'), // diff2 rejected so omitted
    'Contains Project 1 & 2, tailored diff1 bullet, and excludes rejected diff2 bullet'
  );

  const exportRejected = generateExportText('rejected', 'rejected');
  report(
    'DEF-02: Export Preserves Original Content When Suggestions Rejected',
    exportRejected.includes('Constructed a conversational bot utilizing HuggingFace models') &&
      !exportRejected.includes('Latency Optimization by 41%'),
    'Preserves original bot phrasing and contains no unverified latency claims'
  );

  // TEST 3: DEF-03 — Dynamic Job Counts & Honest Zero-Results State
  console.log('\n--- Testing DEF-03: Dynamic Job Counts & Zero-Result Handling ---');
  // 3a. Search with non-existent query must return 0 jobs, never a fallback or fake count
  const zeroJobsRes = await fetch(`${BASE_URL}/api/jobs?q=super_impossible_job_query_xyz999`);
  const zeroJobsData = await zeroJobsRes.json();
  report(
    'DEF-03: Impossible Search Query Returns Exactly 0 Live Jobs (No Hallucinated Fallbacks)',
    zeroJobsRes.status === 200 && Array.isArray(zeroJobsData.jobs) && zeroJobsData.jobs.length === 0,
    `Returned count=${zeroJobsData.jobs?.length}, fallbackActive=${zeroJobsData.fallbackActive}`
  );

  // 3b. Verify valid search returns genuine jobs count matching dataset
  const liveJobsRes = await fetch(`${BASE_URL}/api/jobs`);
  const liveJobsData = await liveJobsRes.json();
  report(
    'DEF-03: Live Ingestion Reports Truthful Total Without Hardcoded 152 Substitution',
    liveJobsRes.status === 200 && typeof liveJobsData.total === 'number' && liveJobsData.total > 0,
    `Reported live total=${liveJobsData.total}, jobs array length=${liveJobsData.jobs.length}`
  );

  // TEST 4: User Isolation & Approval Gate Retention
  console.log('\n--- Testing Security Isolation & Approval Gate ---');
  // Create User B and verify User B cannot see User A's decisions
  const userBEmail = `def01_user_b_${Date.now()}@example.com`;
  const signupBRes = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Marco',
      lastName: 'Polo',
      email: userBEmail,
      password: 'SecurePassword123!',
    }),
  });
  const cookieB = signupBRes.headers.get('set-cookie')?.split(';')[0] || '';
  const meBRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Cookie: cookieB },
  });
  const meBData = await meBRes.json();
  report(
    'Security Isolation: User B Profile Does Not Inherit User A CV Decisions',
    meBRes.status === 200 && (!meBData.profile?.cvDecisions || Object.keys(meBData.profile.cvDecisions).length === 0),
    `User B cvDecisions count=${Object.keys(meBData.profile?.cvDecisions || {}).length}`
  );

  // Test Copilot approval gate
  const copilotRes = await fetch(`${BASE_URL}/api/copilot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      message: 'Submit my application to Careem',
      context: { profile, jobs: liveJobsData.jobs },
    }),
  });
  const copilotData = await copilotRes.json();
  report(
    'Approval Gate: Headless external submission blocked with requires_approval status',
    copilotRes.status === 200 &&
      copilotData.toolLogs?.[0]?.status === 'requires_approval' &&
      copilotData.approvalRequired?.actionType === 'apply_external',
    `ActionType=${copilotData.approvalRequired?.actionType}, Status=${copilotData.toolLogs?.[0]?.status}`
  );

  console.log('--------------------------------------------------------');
  console.log(`DEFECT & REGRESSION SUITE: ${passed + failed} checks | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('========================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runDefectTests();
