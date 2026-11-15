/** Builds a plain, single-column CV document from profile fields for the ATS scorer. */
export interface CvFields {
  fullName?: string;
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
  skills?: string[];
}

const esc = (s = '') => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const paras = (s = '') =>
  s
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => (/^[-•*]\s*/.test(l) ? `<li>${esc(l.replace(/^[-•*]\s*/, ''))}</li>` : `<p>${esc(l)}</p>`))
    .join('\n')
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`);

export function cvToHtml(cv: CvFields): string {
  const contact = [cv.email, cv.phone, cv.location, cv.linkedin, cv.github].filter(Boolean).map((v) => esc(v)).join(' | ');
  const education = [cv.degree, cv.university, cv.graduationYear].filter(Boolean).map((v) => esc(v)).join(', ');
  return `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif}</style></head><body>
<h1>${esc(cv.fullName || '')}</h1>
<p>${esc(cv.targetRole || '')}</p>
<p>${contact}</p>
${cv.summary ? `<h2>Summary</h2>\n${paras(cv.summary)}` : ''}
${cv.experience ? `<h2>Experience</h2>\n${paras(cv.experience)}` : ''}
${education ? `<h2>Education</h2>\n<p>${education}</p>` : ''}
${cv.skills?.length ? `<h2>Skills</h2>\n<p>${cv.skills.map((s) => esc(s)).join(', ')}</p>` : ''}
</body></html>`;
}

/** Wraps pasted CV text, treating short standalone lines as section headings. */
export function textToHtml(text: string): string {
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  const body = lines
    .filter(Boolean)
    .map((l) =>
      l.length < 40 && /^[A-Za-z &/]+$/.test(l) && (l === l.toUpperCase() || /^(summary|profile|experience|work experience|education|skills|projects|certifications|languages)$/i.test(l))
        ? `<h2>${esc(l)}</h2>`
        : `<p>${esc(l)}</p>`
    )
    .join('\n');
  return `<!doctype html><html><head><meta charset="utf-8"></head><body>${body}</body></html>`;
}
