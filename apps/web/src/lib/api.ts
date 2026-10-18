import type {
  CandidateProfile,
  JobMatch,
  StructuredJob,
  Application as ApplicationType,
  ApplicationStatus,
  TailoredCVCandidate,
  CoverLetterDraft,
  AnswerDraft,
  AgentRequest,
  AgentResponse,
  ContentClassificationResult,
} from '@jobora/types';
import type { CVAnalysis } from '@jobora/backend';

// ─── Auth ────────────────────────────────────────────────────────────────────
export async function login(email: string, password: string) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function signup(firstName: string, lastName: string, email: string, password: string) {
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firstName, lastName, email, password }),
  });
  return res.json();
}

export async function getMe() {
  const res = await fetch('/api/auth/me', { headers: { 'Cookie': document.cookie } });
  return res.json();
}

export async function logout() {
  const res = await fetch('/api/auth/logout', { method: 'POST' });
  return res.json();
}

// ─── Onboarding ─────────────────────────────────────────────────────────────
export async function submitOnboarding(data: Record<string, any>) {
  const res = await fetch('/api/onboarding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getOnboarding() {
  const res = await fetch('/api/onboarding');
  return res.json();
}

// ─── Resumes ─────────────────────────────────────────────────────────────────
export async function uploadResume(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/resumes', { method: 'POST', body: formData });
  return res.json();
}

export async function getResumes() {
  const res = await fetch('/api/resumes');
  return res.json();
}

export async function analyzeResume(id: string) {
  const res = await fetch(`/api/resumes/${id}/analyze`, { method: 'POST' });
  return res.json();
}

// ─── Jobs ────────────────────────────────────────────────────────────────────
export async function searchJobs(params: Record<string, any>) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`/api/jobs/search?${query}`);
  return res.json();
}

export async function getJob(id: string) {
  const res = await fetch(`/api/jobs/${id}`);
  return res.json();
}

export async function matchJob(jobId: string, profileId: string) {
  const res = await fetch(`/api/jobs/${jobId}/match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profileId }),
  });
  return res.json();
}

export async function parseJob(description: string) {
  const res = await fetch('/api/jobs/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description }),
  });
  return res.json();
}

// ─── Applications ────────────────────────────────────────────────────────────
export async function getApplications(status?: ApplicationStatus) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  const query = params.toString();
  const res = await fetch(`/api/applications${query ? `?${query}` : ''}`);
  return res.json();
}

export async function createApplication(jobId: string, data: Record<string, any>) {
  const res = await fetch('/api/applications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId, ...data }),
  });
  return res.json();
}

export async function updateApplication(id: string, data: Record<string, any>) {
  const res = await fetch(`/api/applications/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

// ─── CV Analysis ─────────────────────────────────────────────────────────────
export async function analyzeCV(content: string, profileId: string) {
  const res = await fetch('/api/cv/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, profileId }),
  });
  return res.json();
}

// ─── Tailored CV ─────────────────────────────────────────────────────────────
export async function generateTailoredCV(profileId: string, jobId: string) {
  const res = await fetch(`/api/jobs/${jobId}/tailored-cv`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profileId }),
  });
  return res.json();
}

// ─── Cover Letter ────────────────────────────────────────────────────────────
export async function generateCoverLetter(profileId: string, jobId: string) {
  const res = await fetch(`/api/jobs/${jobId}/cover-letter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profileId }),
  });
  return res.json();
}

// ─── Application answers ─────────────────────────────────────────────────────
export async function draftAnswers(profileId: string, jobId: string, questions: string[]) {
  const res = await fetch('/api/applications/drafts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profileId, jobId, questions }),
  });
  return res.json();
}

// ─── Agent ───────────────────────────────────────────────────────────────────
export async function createAgentTask(request: AgentRequest) {
  const res = await fetch('/api/agent/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return res.json();
}

export async function getAgentTask(id: string) {
  const res = await fetch(`/api/agent/tasks/${id}`);
  return res.json();
}

// ─── Security ────────────────────────────────────────────────────────────────
export async function classifyContent(text: string): Promise<ContentClassificationResult> {
  const res = await fetch('/api/security/classify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  return res.json();
}

// ─── Notifications ───────────────────────────────────────────────────────────
export async function getNotifications() {
  const res = await fetch('/api/notifications');
  return res.json();
}
