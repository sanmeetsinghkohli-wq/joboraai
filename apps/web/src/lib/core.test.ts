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

import { alertMatches, newMatches } from './jobAlerts';
import { inThisWeek, weekStart } from './workspace';

describe('job alerts', () => {
  const job = (id: string, title: string, location: string, employmentType = 'Full-Time') => ({
    id, title, company: 'Acme', description: '', location, skills: ['python'], employmentType,
  });
  const jobs = [job('1', 'Data Analyst', 'Dubai'), job('2', 'ML Intern', 'Bengaluru, India', 'Internship'), job('3', 'Sales Lead', 'Dubai')];

  it('matches on query, region, type and tech filter', () => {
    expect(jobs.filter((j) => alertMatches(j, { query: 'python', region: 'Dubai', jobType: '', techOnly: true })).map((j) => j.id)).toEqual(['1']);
    expect(jobs.filter((j) => alertMatches(j, { query: '', region: '', jobType: 'Internship', techOnly: false })).map((j) => j.id)).toEqual(['2']);
  });

  it('counts only unseen matches', () => {
    expect(newMatches(jobs, { query: '', region: 'Dubai', jobType: '', techOnly: false, seenIds: ['1'] }).map((j) => j.id)).toEqual(['3']);
  });
});

describe('weekly goals', () => {
  it('starts weeks on Monday', () => {
    expect(weekStart(new Date(2026, 10, 26))).toBe('2026-11-23');
    expect(weekStart(new Date(2026, 10, 23))).toBe('2026-11-23');
    expect(inThisWeek('2026-11-22', new Date(2026, 10, 26))).toBe(false);
    expect(inThisWeek('2026-11-29', new Date(2026, 10, 26))).toBe(true);
  });
});

import { isAdminEmail } from './admin';

describe('admin allowlist', () => {
  it('allows only listed emails and nobody when the list is empty', () => {
    expect(isAdminEmail('Boss@Jobora.app', 'a@x.test, boss@jobora.app')).toBe(true);
    expect(isAdminEmail('other@jobora.app', 'boss@jobora.app')).toBe(false);
    expect(isAdminEmail('boss@jobora.app', '')).toBe(false);
  });
});

import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, HeadingLevel } from 'docx';
import { auditAts } from './career-ops/verify-ats.mjs';
import { docxToAtsHtml, looksLikeHeading, pdfToAtsHtml, textToAtsHtml } from './cvAtsHtml';

/** A tiny hand-written PDF: each [x, y, text] is drawn in Helvetica on one page. */
function makePdf(lines: Array<[number, number, string]>): Buffer {
  const stream = lines.map(([x, y, t]) => `BT /F1 10 Tf ${x} ${y} Td (${t.replace(/[()\\]/g, '')}) Tj ET`).join('\n');
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 800] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let out = '%PDF-1.4\n';
  const offsets: number[] = [];
  objs.forEach((o, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`;
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(out, 'latin1');
}

const CV_LINES = ['Aisha Khan', 'aisha@example.test +971 50 000 0000', 'EXPERIENCE', 'Data Analyst, Acme LLC', 'EDUCATION', 'BSc Computer Science', 'SKILLS', 'SQL, Python, Power BI'];

// Builds real .docx/.pdf files, which can be slow when the machine is busy.
describe('ATS scoring of uploads (career-ops auditAts)', { timeout: 30_000 }, () => {
  it('recognises headings in any script, but not sentences or contact lines', () => {
    expect(looksLikeHeading('Work Experience')).toBe(true);
    expect(looksLikeHeading('الخبرة العملية')).toBe(true);
    expect(looksLikeHeading('Skills:')).toBe(true);
    expect(looksLikeHeading('Built dashboards used by 40 managers across the region.')).toBe(false);
    expect(looksLikeHeading('aisha@example.test')).toBe(false);
  });

  // Uses the Arabic heading forms career-ops recognises (الخبرات, التعليم, مهارات).
  // career-ops does not yet match المهارات (with the article), an upstream gap.
  it('gives an Arabic CV its section-heading points', () => {
    const ar = textToAtsHtml('عائشة خان\naisha@example.test +971500000000\nالخبرات\nمحللة بيانات\nالتعليم\nبكالوريوس علوم الحاسوب\nمهارات\nSQL, Python');
    const issues = auditAts(ar).issues.map((i: { id: string }) => i.id);
    expect(issues).not.toContain('section-headings');
  });

  it('flags a table-based Word CV that plain text would hide', async () => {
    const cell = (t: string) => new TableCell({ children: [new Paragraph(t)] });
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({ text: 'Aisha Khan', heading: HeadingLevel.TITLE }),
            new Paragraph('aisha@example.test +971 50 000 0000'),
            new Paragraph({ children: [new TextRun({ text: 'EXPERIENCE', bold: true })] }),
            new Table({ rows: [new TableRow({ children: [cell('Data Analyst, Acme LLC'), cell('2024 to 2026')] })] }),
            new Paragraph({ children: [new TextRun({ text: 'EDUCATION', bold: true })] }),
            new Paragraph('BSc Computer Science'),
            new Paragraph({ children: [new TextRun({ text: 'SKILLS', bold: true })] }),
            new Paragraph('SQL, Python, Power BI'),
          ],
        },
      ],
    });
    const html = await docxToAtsHtml(Buffer.from(await Packer.toBuffer(doc)));
    const result = auditAts(html);
    expect(result.issues.map((i: { id: string }) => i.id)).toContain('layout-tables');
    expect(result.issues.map((i: { id: string }) => i.id)).not.toContain('section-headings');
  });

  it('detects a two-column PDF and leaves a single-column one alone', async () => {
    const single: Array<[number, number, string]> = [];
    const double: Array<[number, number, string]> = [];
    for (let i = 0; i < 20; i++) {
      const y = 760 - i * 18;
      single.push([50, y, CV_LINES[i % CV_LINES.length]]);
      double.push([40, y, CV_LINES[i % CV_LINES.length]], [330, y, `Detail line ${i}`]);
    }
    const one = await pdfToAtsHtml(makePdf(single), CV_LINES.join('\n'));
    const two = await pdfToAtsHtml(makePdf(double), CV_LINES.join('\n'));
    expect(one.multiColumn).toBe(false);
    expect(two.multiColumn).toBe(true);
    expect(auditAts(two.html).issues.map((i: { id: string }) => i.id)).toContain('multi-column');
  });
});
