/**
 * Builds an ATS-friendly CV as a Word document in the browser: one column,
 * standard headings, a standard font, real bullet lists, no tables or images.
 */
import type { ProfileCertification, ProfileProject } from '@/context/AppDataContext';

export interface CvDoc {
  fullName: string;
  targetRole?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  summary?: string;
  experience?: string;
  degree?: string;
  university?: string;
  graduationYear?: string;
  gpa?: string;
  skills?: string[];
  projects?: ProfileProject[];
  certifications?: ProfileCertification[];
  achievements?: string[];
  languages?: string[];
}

/** Splits free-text experience into roles: a heading line followed by "- " bullets. */
export function parseRoles(text = ''): Array<{ heading: string; bullets: string[]; lines: string[] }> {
  return text
    .split(/\n\s*\n/)
    .map((block) => block.split('\n').map((l) => l.trim()).filter(Boolean))
    .filter((lines) => lines.length)
    .map((lines) => ({
      heading: /^[-•*]/.test(lines[0]) ? '' : lines[0],
      bullets: lines.filter((l) => /^[-•*]/.test(l)).map((l) => l.replace(/^[-•*]\s*/, '')),
      lines: lines.slice(/^[-•*]/.test(lines[0]) ? 0 : 1).filter((l) => !/^[-•*]/.test(l)),
    }));
}

export async function buildCvDocx(cv: CvDoc): Promise<Blob> {
  const { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } = await import('docx');

  const heading = (text: string) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 80 },
      children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 22, color: '351B32' })],
    });
  const para = (text: string, opts: { bold?: boolean; italics?: boolean } = {}) =>
    new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text, size: 21, ...opts })] });
  const bullet = (text: string) =>
    new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text, size: 21 })] });

  const body: InstanceType<typeof Paragraph>[] = [];
  body.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 40 },
      children: [new TextRun({ text: cv.fullName || 'Your name', bold: true, size: 36 })],
    })
  );
  if (cv.targetRole) body.push(para(cv.targetRole));
  const contact = [cv.email, cv.phone, cv.location, cv.linkedin, cv.github].filter(Boolean).join(' | ');
  if (contact) body.push(para(contact));

  if (cv.summary?.trim()) {
    body.push(heading('Summary'), para(cv.summary.trim()));
  }

  const roles = parseRoles(cv.experience);
  if (roles.length) {
    body.push(heading('Experience'));
    for (const r of roles) {
      if (r.heading) body.push(para(r.heading, { bold: true }));
      r.lines.forEach((l) => body.push(para(l)));
      r.bullets.forEach((b) => body.push(bullet(b)));
    }
  }

  const projects = (cv.projects || []).filter((p) => p.name);
  if (projects.length) {
    body.push(heading('Projects'));
    for (const p of projects) {
      body.push(para([p.name, p.link].filter(Boolean).join(' | '), { bold: true }));
      if (p.description) body.push(bullet(p.description));
      if (p.tech?.length) body.push(para(`Tech: ${p.tech.join(', ')}`, { italics: true }));
    }
  }

  const education = [cv.degree, cv.university, cv.graduationYear].filter(Boolean).join(', ');
  if (education) {
    body.push(heading('Education'), para(education + (cv.gpa ? ` | GPA ${cv.gpa}` : '')));
  }

  if (cv.skills?.length) body.push(heading('Skills'), para(cv.skills.join(', ')));

  const certs = (cv.certifications || []).filter((c) => c.name);
  if (certs.length) {
    body.push(heading('Certifications'));
    certs.forEach((c) => body.push(bullet([c.name, c.issuer, c.year].filter(Boolean).join(', '))));
  }
  if (cv.achievements?.length) {
    body.push(heading('Achievements'));
    cv.achievements.forEach((a) => body.push(bullet(a)));
  }
  if (cv.languages?.length) body.push(heading('Languages'), para(cv.languages.join(', ')));

  const doc = new Document({
    creator: 'Jobora AI',
    title: `${cv.fullName || 'CV'}`,
    styles: { default: { document: { run: { font: 'Calibri' } } } },
    sections: [{ properties: { page: { margin: { top: 900, bottom: 900, left: 1000, right: 1000 } } }, children: body }],
  });
  return Packer.toBlob(doc);
}

export function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
