import { describe, expect, it } from 'vitest';
import { normalizeStatus } from './status';
import { getReminders, daysFromToday } from './reminders';
import { lineDiff, wordDiff } from './wordDiff';
import { isTechRole } from './jobFields';
import { matchSkills } from './match';
import { profileStrength } from './profile';
import { normaliseParsedCv } from './cv-parse';
import { buildMessage, decryptSecret, encryptSecret, signState, verifyState } from './gmail';
import { normalizeLocationAndRegion, inferEmploymentType } from '@/app/api/jobs/_providers';
import type { LiveApplication, LiveUserProfile } from '@/context/AppDataContext';

const iso = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const app = (over: Partial<LiveApplication>): LiveApplication => ({
  id: 'a1',
  jobId: 'j1',
  title: 'Data Analyst',
  company: 'Acme',
  location: 'Dubai',
  status: 'Applied',
  syncChannel: '',
  nextAction: '',
  recruiterName: '',
  recruiterEmail: '',
  appliedAt: '',
  timeline: [],
  attachments: [],
  ...over,
});

describe('application stages', () => {
  it('maps legacy and free-text statuses onto the 8 stages', () => {
    expect(normalizeStatus('Saved')).toBe('Interested');
    expect(normalizeStatus('Sent Today')).toBe('Applied');
    expect(normalizeStatus('Phone screen')).toBe('Assessment');
    expect(normalizeStatus('Interviewing')).toBe('Interview');
    expect(normalizeStatus('Offer accepted')).toBe('Accepted');
    expect(normalizeStatus('Withdrawn')).toBe('Rejected');
  });
});

describe('reminders', () => {
  it('flags overdue follow-ups, upcoming interviews and closing deadlines only for the right stages', () => {
    const r = getReminders([
      app({ id: 'f', status: 'Applied', followUpAt: iso(-2) }),
      app({ id: 'i', status: 'Interview', interviewAt: iso(1) }),
      app({ id: 'd', status: 'Interested', deadline: iso(2) }),
      app({ id: 'x', status: 'Rejected', followUpAt: iso(-1) }),
      app({ id: 'far', status: 'Interview', interviewAt: iso(30) }),
    ]);
    expect(r.map((x) => x.appId)).toEqual(['f', 'i', 'd']);
    expect(r[0].title).toBe('Follow-up overdue by 2 days');
  });

  it('reads date-only strings as local dates', () => {
    expect(daysFromToday(iso(0))).toBe(0);
    expect(daysFromToday(iso(3))).toBe(3);
  });
});

describe('before/after comparison', () => {
  it('marks only real word changes', () => {
    const parts = wordDiff('built a model', 'built a churn model');
    expect(parts.filter((p) => p.type === 'added').map((p) => p.text.trim())).toEqual(['churn']);
    expect(parts.some((p) => p.type === 'removed')).toBe(false);
  });

  it('treats reordered lines as unchanged', () => {
    const parts = lineDiff('- one\n- two', '- two\n- one\n- three');
    expect(parts.filter((p) => p.type === 'added').map((p) => p.text.trim())).toEqual(['- three']);
    expect(parts.some((p) => p.type === 'removed')).toBe(false);
  });
});

describe('job fields', () => {
  it('recognises CS and cyber roles and ignores sales roles that mention tech', () => {
    expect(isTechRole('Analyst II - SIEM/SecOps')).toBe(true);
    expect(isTechRole('Software Engineering Intern')).toBe(true);
    expect(isTechRole('AI Security Sales Executive')).toBe(false);
    expect(isTechRole('Marketing Intern')).toBe(false);
  });

  it('tags India, Gulf and wider MENA locations', () => {
    expect(normalizeLocationAndRegion('Bangalore, Karnataka', '', 'On-site').regionTag).toBe('India');
    expect(normalizeLocationAndRegion('Dubai', '', 'On-site').regionTag).toBe('UAE');
    expect(normalizeLocationAndRegion('Al Khobar', '', 'On-site').country).toBe('Saudi Arabia');
    expect(normalizeLocationAndRegion('Cairo, Egypt', '', 'On-site').regionTag).toBe('GCC / MENA');
  });

  it('detects internships from the title', () => {
    expect(inferEmploymentType('ML Intern/Co-op', 'Full-time')).toBe('Internship');
    expect(inferEmploymentType('Data Analyst', 'Full-time')).toBe('Full-Time');
  });

  it('matches skills case-insensitively', () => {
    const m = matchSkills(['Python', 'SQL', 'Tableau'], ['python', 'sql']);
    expect(m.matched).toHaveLength(2);
    expect(m.missing).toEqual(['Tableau']);
  });
});

describe('profile', () => {
  it('scores profile strength from the 8 checks', () => {
    const p = { targetRole: 'Analyst', skills: ['a', 'b', 'c', 'd', 'e'], location: 'Dubai', projects: [] } as unknown as LiveUserProfile;
    const s = profileStrength(p);
    expect(s.score).toBe(38);
    expect(s.next?.key).toBe('summary');
  });

  it('cleans AI CV output without inventing fields', () => {
    const cv = normaliseParsedCv({ fullName: ' Aisha ', skills: ['Python', 'Python', ''], education: [{ degree: 'BSc' }], links: null });
    expect(cv.fullName).toBe('Aisha');
    expect(cv.skills).toEqual(['Python']);
    expect(cv.education[0]).toEqual({ degree: 'BSc', institution: '', year: '', gpa: '' });
    expect(cv.links).toEqual({ linkedin: '', github: '', portfolio: '' });
  });
});

describe('gmail security', () => {
  it('encrypts tokens and detects tampering', () => {
    const enc = encryptSecret('refresh-token');
    expect(enc).not.toContain('refresh-token');
    expect(decryptSecret(enc)).toBe('refresh-token');
    expect(() => decryptSecret(`${enc.slice(0, -2)}AA`)).toThrow();
  });

  it('blocks header injection and bad recipients', () => {
    const raw = Buffer.from(buildMessage({ from: 'a@x.test', to: 'b@x.test', subject: 'Hi\r\nBcc: c@x.test', body: 'x' }), 'base64url').toString();
    expect(raw).not.toMatch(/^Bcc:/m);
    expect(() => buildMessage({ from: 'a@x.test', to: 'b@x.test\r\nBcc: c@x.test', subject: 's', body: 'b' })).toThrow();
  });

  it('only accepts OAuth state it signed', () => {
    expect(verifyState(signState('user-1'))).toBe('user-1');
    expect(verifyState('forged.state.value')).toBeNull();
  });
});
