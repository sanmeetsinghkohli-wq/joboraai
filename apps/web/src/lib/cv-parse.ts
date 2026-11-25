/**
 * CV text extraction (PDF, DOCX, TXT) and AI extraction into structured
 * profile data. The AI is told to copy facts only; anything not in the CV
 * stays empty rather than being guessed.
 */

export interface ParsedEducation {
  degree: string;
  institution: string;
  year: string;
  gpa: string;
}

export interface ParsedExperience {
  title: string;
  company: string;
  location: string;
  start: string;
  end: string;
  bullets: string[];
}

export interface ParsedProject {
  name: string;
  description: string;
  tech: string[];
  link: string;
}

export interface ParsedCertification {
  name: string;
  issuer: string;
  year: string;
}

export interface ParsedCv {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  headline: string;
  summary: string;
  skills: string[];
  education: ParsedEducation[];
  experience: ParsedExperience[];
  projects: ParsedProject[];
  certifications: ParsedCertification[];
  achievements: string[];
  languages: string[];
  links: { linkedin: string; github: string; portfolio: string };
}

export async function extractCvText(fileName: string, buffer: Buffer): Promise<string> {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  if (ext === 'pdf') {
    const { extractText, getDocumentProxy } = await import('unpdf');
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });
    return String(text || '');
  }
  if (ext === 'docx') {
    const mammoth = await import('mammoth');
    const { value } = await mammoth.extractRawText({ buffer });
    return value || '';
  }
  if (ext === 'txt') return buffer.toString('utf8');
  throw new Error('Unsupported file type. Upload a PDF, DOCX or TXT file.');
}

const PROMPT = `Extract this CV into JSON. Copy facts exactly as written; never invent, infer or embellish.
If something is not in the CV, use "" or [].
Return ONLY a JSON object with exactly these keys:
{
 "fullName": "", "email": "", "phone": "", "location": "",
 "headline": "the person's own title or target role if stated, else \\"\\"",
 "summary": "their profile/summary paragraph if present, else \\"\\"",
 "skills": ["each distinct technical or professional skill listed"],
 "education": [{"degree": "", "institution": "", "year": "graduation year or range", "gpa": ""}],
 "experience": [{"title": "", "company": "", "location": "", "start": "", "end": "", "bullets": [""]}],
 "projects": [{"name": "", "description": "one or two sentences from the CV", "tech": [""], "link": ""}],
 "certifications": [{"name": "", "issuer": "", "year": ""}],
 "achievements": ["awards, hackathons, competitions, scholarships, publications"],
 "languages": ["spoken languages"],
 "links": {"linkedin": "", "github": "", "portfolio": ""}
}
Internships and part-time jobs go in "experience". Hackathons and competitions go in "achievements".`;

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const strs = (v: unknown) =>
  Array.isArray(v) ? [...new Set(v.map(str).filter(Boolean))].slice(0, 60) : [];
const objs = <T,>(v: unknown, map: (o: Record<string, unknown>) => T): T[] =>
  Array.isArray(v) ? v.filter((o) => o && typeof o === 'object').map((o) => map(o as Record<string, unknown>)).slice(0, 25) : [];

/** Normalises whatever the model returned into the ParsedCv shape. */
export function normaliseParsedCv(raw: Record<string, unknown>): ParsedCv {
  const links = (raw.links && typeof raw.links === 'object' ? raw.links : {}) as Record<string, unknown>;
  return {
    fullName: str(raw.fullName),
    email: str(raw.email),
    phone: str(raw.phone),
    location: str(raw.location),
    headline: str(raw.headline),
    summary: str(raw.summary),
    skills: strs(raw.skills),
    education: objs(raw.education, (o) => ({ degree: str(o.degree), institution: str(o.institution), year: str(o.year), gpa: str(o.gpa) })),
    experience: objs(raw.experience, (o) => ({
      title: str(o.title),
      company: str(o.company),
      location: str(o.location),
      start: str(o.start),
      end: str(o.end),
      bullets: strs(o.bullets),
    })),
    projects: objs(raw.projects, (o) => ({ name: str(o.name), description: str(o.description), tech: strs(o.tech), link: str(o.link) })),
    certifications: objs(raw.certifications, (o) => ({ name: str(o.name), issuer: str(o.issuer), year: str(o.year) })),
    achievements: strs(raw.achievements),
    languages: strs(raw.languages),
    links: { linkedin: str(links.linkedin), github: str(links.github), portfolio: str(links.portfolio) },
  };
}

export async function parseCvWithAi(text: string): Promise<ParsedCv> {
  const { generate } = await import('./llm');
  const out = await generate({
    system: PROMPT,
    user: `<cv>\n${text.slice(0, 24000)}\n</cv>`,
    maxTokens: 4000,
    temperature: 0,
    json: true,
  });
  const content = out.text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  return normaliseParsedCv(JSON.parse(content));
}

/** Turns parsed roles into the free-text experience field the CV builder uses. */
export function experienceToText(items: ParsedExperience[]): string {
  return items
    .map((e) => {
      const head = [e.title, e.company].filter(Boolean).join(' at ');
      const meta = [e.location, [e.start, e.end].filter(Boolean).join(' – ')].filter(Boolean).join(' · ');
      const bullets = e.bullets.map((b) => `- ${b}`).join('\n');
      return [head + (meta ? ` (${meta})` : ''), bullets].filter(Boolean).join('\n');
    })
    .join('\n\n');
}
