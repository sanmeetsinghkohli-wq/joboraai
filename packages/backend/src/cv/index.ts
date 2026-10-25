import { z } from 'zod';
import type { CandidateProfile, CandidateProfileDraft, CVAnalysis, CVAnalysisCategory, CVIssue, ExtractionResult, CVExtractionInput, Experience, Education, Project, Skill, Certification, Language, ProfileLink } from './types';
import { SEED_SKILLS } from '@jobora/mocks';

// ─── Parsers ─────────────────────────────────────────────────────────────────
const ContactSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  linkedin: z.string().optional(),
  website: z.string().optional(),
});

const SkillSchema = z.object({
  name: z.string(),
  proficiency: z.enum(['beginner', 'intermediate', 'proficient', 'expert']).optional(),
});

const DateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/, 'Expected YYYY-MM format')
  .or(
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD format')
  )
  .optional();

const ExperienceSchema = z.object({
  company: z.string(),
  title: z.string(),
  startDate: DateSchema,
  endDate: DateSchema,
  current: z.boolean().optional(),
  description: z.string().optional(),
  achievements: z.array(z.string()).optional(),
});

const EducationSchema = z.object({
  institution: z.string(),
  degree: z.string(),
  fieldOfStudy: z.string().optional(),
  startDate: DateSchema,
  endDate: DateSchema,
  gpa: z.string().optional(),
});

const ProjectSchema = z.object({
  name: z.string(),
  description: z.string(),
  technologies: z.array(z.string()).optional(),
  startDate: DateSchema,
  endDate: DateSchema,
  link: z.string().url().optional(),
});

const CertificationSchema = z.object({
  name: z.string(),
  issuingOrganization: z.string().optional(),
  date: z.string().optional(),
  link: z.string().url().optional(),
});

const LanguageSchema = z.object({
  name: z.string(),
  proficiency: z.enum(['basic', 'conversational', 'professional', 'native']).optional(),
});

const LinkSchema = z.object({
  label: z.string(),
  url: z.string().url(),
});

// ─── Extract profile draft from raw CV text ───────────────────────────────────
export function extractCandidateProfile(input: CVExtractionInput): ExtractionResult {
  const { fileName, content, userId } = input;
  const lower = content.toLowerCase();

  // Name: first line or title
  const lines = content.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const name = lines[0] || 'Unknown Candidate';

  // Contacts
  const contactMatch = content.match(
    /(?:email|contact|email:|contact:|email \S{2,}):\s*([\w.+-]+@[\w-]+\.\w{2,})/i
  );
  const email = contactMatch?.[1] || null;

  const phoneMatch = content.match(/(\+\d{1,3}[-.\s]?\d{2,4}[-.\s]?\d{3,4}[-.\s]?\d{3,4})/);
  const phone = phoneMatch?.[0] || null;

  const location = lines.find((l) => /^[A-Z][a-z]+(?: [A-Z][a-z]+)?(?:,\s*[A-Z][a-z]+)?$/u.test(l) && !l.includes('@') && !l.includes('http')) || null;

  // Skills
  const skillLines = content.split(/\n/).filter((l) => {
    const s = l.trim();
    return s.length > 2 && !/http/i.test(s) && !/[0-9]{4}/.test(s);
  });

  const detectedSkills = detectSkills(skillLines, lower);
  const inferredSkills = detectInferredSkills(lower);

  const missingInformation: string[] = [];
  const presentFields = new Set<string>();

  // Summary
  const summaryMatch = content.match(/(?:(?:professional|objective|summary|profile|about|core competencies)[^:]*?:\s*)?(.{10,300})/i);
  const summary = summaryMatch?.[1]?.trim() || null;

  // Experiences
  const experiences = parseExperiences(content);

  // Education
  const education = parseEducation(content);

  // Projects
  const projects = parseProjects(content);

  // Certifications
  const certifications = parseCertifications(content);

  // Languages
  const languages = parseLanguages(content);

  // Links
  const links = parseLinks(content);

  // Build profile draft
  const draft: CandidateProfileDraft = {
    id: `draft-${Date.now()}`,
    name,
    summary,
    location,
    targetRoles: [],
    skills: detectedSkills.map((s) => s.name),
    experiences,
    education,
    projects,
    certifications: certifications.map((c) => c.name),
    languages: languages.map((l) => l.name),
    links: links.map((l) => ({ label: l.label, url: l.url })),
    missingInformation,
  };

  // Build verified profile
  const profileId = `profile-${Date.now()}`;
  const profile: CandidateProfile = {
    id: profileId,
    userId,
    name,
    summary: summary || '',
    location: location || '',
    targetRoles: [],
    preferredLocations: [],
    workModePreference: 'remote',
    industries: [],
    salaryExpectation: null,
    workAuthorization: null,
    jobTypes: ['full-time'],
    education,
    experiences,
    skills: detectedSkills.map((s) => ({
      id: `skill-${s.name}-${Date.now()}`,
      profileId,
      name: s.name,
      verified: true,
      proficiency: 'intermediate' as const,
    })),
    projects,
    certifications,
    languages,
    links,
    createdByWizard: true,
    updatedAt: new Date(),
  };

  const missing = extractMissingFields(profile, lower, content.length);

  return {
    success: true,
    profile,
    draft,
    missingInformation: missing,
    entities: [],
    confidence: 0.82,
    warnings: [],
  };
}

function detectSkills(lines: string[], lower: string): Array<{ name: string; proficiency?: string }> {
  const known = new Set(SEED_SKILLS.map((s) => s.toLowerCase()));
  const found: Array<{ name: string; proficiency?: string }> = [];
  const seen = new Set<string>();

  for (const line of lines) {
    const isExplicitSkillLine = /skills\s*:/i.test(line);
    const clean = line.replace(/^(?:technical\s+|core\s+)?skills\s*:\s*/i, '');
    const parts = clean.split(/[,;•·]+/).map((p) => p.trim());
    for (const part of parts) {
      const key = part.toLowerCase();
      if (!key) continue;
      if ((known.has(key) || (isExplicitSkillLine && part.length >= 2 && part.length <= 35 && !/experience|education|university/i.test(part))) && !seen.has(key)) {
        seen.add(key);
        found.push({ name: part, proficiency: guessProficiency(part, lower) });
      }
    }
  }

  // Also combine regex-inferred skills from document body
  for (const inf of detectInferredSkills(lower)) {
    const key = inf.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      found.push({ name: inf, proficiency: guessProficiency(inf, lower) });
    }
  }

  return found;
}

function detectInferredSkills(lower: string): string[] {
  if (!lower || !lower.trim()) return [];
  const inferred = new Set<string>();
  const patterns: { regex: RegExp; name: string }[] = [
    { regex: /\b(?:react|reactjs|react.js)\b/gi, name: 'React' },
    { regex: /\b(?:typescript|ts)\b/gi, name: 'TypeScript' },
    { regex: /\b(?:node\.js|nodejs|node js)\b/gi, name: 'Node.js' },
    { regex: /\b(?:python)\b/gi, name: 'Python' },
    { regex: /\b(?:fastapi)\b/gi, name: 'FastAPI' },
    { regex: /\b(?:next\.?js|nextjs|next.js)\b/gi, name: 'Next.js' },
    { regex: /\b(?:tailwind|css|postcss)\b/gi, name: 'Tailwind CSS' },
    { regex: /\b(?:postgresql|postgres|supabase)\b/gi, name: 'PostgreSQL' },
    { regex: /\b(?:docker|dockerize|container)\b/gi, name: 'Docker' },
    { regex: /\b(?:git|github|version control)\b/gi, name: 'Git' },
    { regex: /\b(?:graphql|rest|api)\b/gi, name: 'REST APIs' },
    { regex: /\b(?:playwright|selenium|cypress)\b/gi, name: 'Playwright' },
    { regex: /\b(?:pytorch|torch)\b/gi, name: 'PyTorch' },
    { regex: /\b(?:kubernetes|k8s)\b/gi, name: 'Kubernetes' },
    { regex: /\b(?:aws|amazon web services)\b/gi, name: 'AWS' },
    { regex: /\b(?:redis)\b/gi, name: 'Redis' },
  ];

  for (const { regex, name } of patterns) {
    if (regex.test(lower)) {
      inferred.add(name);
    }
  }

  return Array.from(inferred);
}

function guessProficiency(skill: string, lower: string): string {
  const count = (lower.match(new RegExp(skill, 'gi')) || []).length;
  if (count >= 2) return 'expert';
  if (count === 1) return 'intermediate';
  return 'beginner';
}

function parseExperiences(content: string): Experience[] {
  const experiences: Experience[] = [];
  const lines = content.split(/\n/).map((l) => l.trim()).filter(Boolean);

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/experience/i.test(line) && /company/i.test(line)) {
      const titleLine = lines[i + 1] || '';
      const companyLine = lines[i + 2] || '';
      const dateLine = lines[i + 3] || '';
      const descMatch = content.match(
        new RegExp(`${line.replace(/[.*+?^${}()|[\]\\\\]/g, '\\$&')}.*?((?:(?:found|led|built|managed|responsible|worked)[^.]{0,150}))`, 'is')
      );

      const description = descMatch?.[1]?.trim() || '';
      const achievements: string[] = [];
      if (description) {
        const achMatches = description.matchAll(/(?:achieved|improved|reduced|increased|led|built|released)[^.!]{3,120}\./g);
        for (const m of achMatches) {
          if (m[0].length > 20 && m[0].length < 200) achievements.push(m[0].replace(/\.$/, ''));
        }
      }

      experiences.push({
        id: `exp-${Date.now()}-${experiences.length}`,
        profileId: '',
        company: companyLine,
        title: titleLine,
        startDate: dateLine,
        endDate: '',
        current: /present|current/i.test(dateLine),
        description,
        achievements,
      });
      i += 4;
    } else {
      i++;
    }
  }

  return experiences;
}

function parseEducation(content: string): Education[] {
  const education: Education[] = [];
  const lines = content.split(/\n/).map((l) => l.trim()).filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/education|university|college|institute|degree|major/i.test(line)) {
      const institution = lines[i + 1] || '';
      const degreeLine = lines[i + 2] || '';
      const field = degreeLine.replace(/degree|in|of/i, '').trim();

      education.push({
        id: `edu-${Date.now()}-${education.length}`,
        profileId: '',
        institution,
        degree: degreeLine,
        fieldOfStudy: field,
        startDate: lines[i + 3] || '',
        endDate: '',
        gpa: undefined,
      });
      i += 3;
    }
  }

  return education;
}

function parseProjects(content: string): Project[] {
  const projects: Project[] = [];
  const lines = content.split(/\n/).map((l) => l.trim()).filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/project|open-source|github|portfolio/i.test(line) && /name/i.test(line)) {
      const name = lines[i + 1] || '';
      const description = lines[i + 2] || '';
      const techMatch = content.match(/(?:technologies|skills|tech)([^.]{0,200})/i);

      projects.push({
        id: `proj-${Date.now()}-${projects.length}`,
        profileId: '',
        name,
        description,
        technologies: techMatch?.[1]?.split(/[,;]/).map((t) => t.trim()).filter(Boolean) || [],
        startDate: lines[i + 3] || '',
        endDate: '',
        link: undefined,
      });
      i += 3;
    }
  }

  return projects;
}

function parseCertifications(content: string): Certification[] {
  const certifications: Certification[] = [];
  const lines = content.split(/\n/).map((l) => l.trim()).filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/certification|certified|certificate/i.test(line)) {
      const name = lines[i + 1] || '';
      const org = lines[i + 2] || '';
      const date = lines[i + 3] || '';

      certifications.push({
        id: `cert-${Date.now()}-${certifications.length}`,
        profileId: '',
        name,
        issuingOrganization: org,
        date,
        link: undefined,
      });
      i += 3;
    }
  }

  return certifications;
}

function parseLanguages(content: string): Language[] {
  const languages: Language[] = [];
  const lines = content.split(/\n/).map((l) => l.trim()).filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/language|speak|reading|writing/i.test(line) && /english|spanish|french|german|chinese|arabic|japanese|portuguese|hindi|italian/i.test(line)) {
      const name = line;
      const proficiency = line.includes('native') ? 'native' : line.includes('fluent') ? 'professional' : line.includes('conversational') ? 'conversational' : 'basic';

      languages.push({
        id: `lang-${Date.now()}-${languages.length}`,
        profileId: '',
        name,
        proficiency,
      });
      i += 1;
    }
  }

  return languages;
}

function parseLinks(content: string): ProfileLink[] {
  const links: ProfileLink[] = [];
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urlMatches = content.matchAll(urlRegex);

  for (const m of urlMatches) {
    const url = m[1];
    let label = '';
    const part = content.substring(Math.max(0, m.index - 40), m.index).trim();
    if (part.includes('github')) label = 'GitHub';
    else if (part.includes('linkedin')) label = 'LinkedIn';
    else if (part.includes('portfolio')) label = 'Portfolio';
    else if (part.includes('website')) label = 'Website';
    else label = 'Website';

    links.push({
      id: `link-${Date.now()}-${links.length}`,
      profileId: `profile-${Date.now()}`,
      label,
      url,
      type: label === 'GitHub' ? 'github' : label === 'LinkedIn' ? 'linkedin' : label === 'Portfolio' ? 'website' : 'website',
    });
  }

  return links;
}

function extractMissingFields(profile: CandidateProfile, lower: string, contentLength: number): string[] {
  const missing: string[] = [];
  if (!profile.summary || profile.summary.length < 30) missing.push('summary');
  if (!profile.location) missing.push('location');
  if (profile.targetRoles.length === 0) missing.push('target roles');
  if (profile.skills.length < 5) missing.push('skills');
  if (profile.experiences.length === 0) missing.push('experience');
  if (profile.education.length === 0) missing.push('education');
  if (contentLength < 200) missing.push('cv content');
  return missing;
}

// ─── Analyze CV ──────────────────────────────────────────────────────────────
export function analyzeCV(content: string, profile: Partial<CandidateProfile>): CVAnalysis {
  const issues: CVIssue[] = [];
  const categories: CVAnalysisCategory[] = [];

  // 1. Structure check
  const structureScore = measureStructure(content);
  categories.push({
    id: 'structure',
    label: 'Structure & Formatting',
    score: structureScore,
    status: structureScore >= 70 ? 'good' : structureScore >= 40 ? 'warning' : 'poor',
    issues: buildStructureIssues(structureScore, content),
  });

  // 2. Skills coverage
  const skillCoverage = measureSkillCoverage(content, profile);
  categories.push({
    id: 'skills',
    label: 'Skills Coverage',
    score: skillCoverage.score,
    status: skillCoverage.score >= 70 ? 'good' : skillCoverage.score >= 40 ? 'warning' : 'poor',
    issues: skillCoverage.issues,
  });

  // 3. Keyword quality
  const keywordScore = measureKeywordQuality(content, profile);
  categories.push({
    id: 'keywords',
    label: 'Keyword Quality',
    score: keywordScore,
    status: keywordScore >= 70 ? 'good' : keywordScore >= 40 ? 'warning' : 'poor',
    issues: keywordScore >= 70 ? [] : [
      { id: 'kw-1', severity: 'minor', title: 'Limited keyword coverage', description: 'The CV uses limited industry keywords.', suggestion: 'Add role-specific skills and technologies from the job description.' },
      { id: 'kw-2', severity: 'info', title: 'Action verbs could be stronger', description: 'Consider using stronger action verbs.', suggestion: 'Replace passive verbs with active ones (e.g., "Developed" instead of "Worked on").' },
    ],
  });

  // 4. Clarity/readability
  const clarityScore = measureClarity(content);
  categories.push({
    id: 'clarity',
    label: 'Clarity & Readability',
    score: clarityScore,
    status: clarityScore >= 70 ? 'good' : clarityScore >= 40 ? 'warning' : 'poor',
    issues: buildClarityIssues(clarityScore, content),
  });

  // 5. Achievement quantification
  const achievementScore = measureAchievements(content, profile);
  categories.push({
    id: 'achievements',
    label: 'Achievements & Impact',
    score: achievementScore,
    status: achievementScore >= 70 ? 'good' : achievementScore >= 40 ? 'warning' : 'poor',
    issues: buildAchievementIssues(achievementScore, profile.experiences || []),
  });

  // Overall readiness
  const overall = Math.round((structureScore * 0.25) + (skillCoverage.score * 0.2) + (keywordScore * 0.2) + (clarityScore * 0.15) + (achievementScore * 0.2));
  const overallStatus: CVAnalysis['overallStatus'] = overall >= 85 ? 'excellent' : overall >= 70 ? 'good' : overall >= 55 ? 'fair' : overall >= 40 ? 'needs-improvement' : 'weak';

  // Quick wins
  const quickWins = buildQuickWins(issues);

  // Gaps
  const gaps = buildGaps(issues, profile);

  return {
    overallReadiness: overall,
    overallStatus,
    categories,
    issues,
    quickWins,
    gaps,
  };
}

function measureStructure(content: string): number {
  const lines = content.split(/\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 5) return 20;

  const sectionRegex = /(summary|experience|education|skills|projects|certification|languages|contact|about)/i;
  const sectionCount = lines.filter((l) => sectionRegex.test(l)).length;
  const density = lines.filter((l) => l.length < 120 && !/http/.test(l)).length / lines.length;

  return Math.min(100, (sectionCount / 6) * 70 + density * 30);
}

function buildStructureIssues(score: number, content: string): CVIssue[] {
  const issues: CVIssue[] = [];
  if (score < 40) {
    issues.push({
      id: 'struct-1',
      severity: 'major',
      title: 'Poor section structure',
      description: 'The CV lacks clear section headings making it difficult to scan.',
      suggestion: 'Use clear, consistent section headings (e.g., Experience, Education, Skills).',
    });
  }
  if (score < 30) {
    issues.push({
      id: 'struct-2',
      severity: 'critical',
      title: 'Content is too dense',
      description: 'Lines are too long and difficult to read.',
      suggestion: 'Break long paragraphs into bullet points and keep lines under 120 characters.',
    });
  }
  return issues;
}

function measureSkillCoverage(content: string, profile: Partial<CandidateProfile>): { score: number; issues: CVIssue[] } {
  const lower = content.toLowerCase();
  const knownSkills = new Set(SEED_SKILLS.map((s) => s.toLowerCase()));
  const matched = content.split(/[,;]+/).filter((s) => knownSkills.has(s.toLowerCase().trim())).length;

  let score = Math.min(100, matched * 5);
  if (!profile?.skills?.length) score = Math.max(0, score - 20);

  const issues: CVIssue[] = [];
  if (score < 40) {
    issues.push({
      id: 'skill-1',
      severity: 'major',
      title: 'Skills section is sparse',
      description: 'Few skills are listed. ATS systems often weight skills heavily.',
      suggestion: 'Add a dedicated "Skills" section with 8-15 relevant skills.',
    });
  }
  return { score, issues };
}

function measureKeywordQuality(content: string, profile: Partial<CandidateProfile>): number {
  const lower = content.toLowerCase();
  const keywords = ['react', 'typescript', 'node', 'python', 'fastapi', 'next.js', 'tailwind', 'postgresql', 'docker', 'git', 'javascript', 'typescript', 'api', 'rest', 'agile', 'remote'];
  let count = 0;
  for (const kw of keywords) {
    if (lower.includes(kw)) count++;
  }
  const score = (count / keywords.length) * 100;
  if (!profile?.skills?.length) return Math.max(0, score - 15);
  return score;
}

function measureClarity(content: string): number {
  const lines = content.split(/\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return 0;

  const avgLen = lines.reduce((sum, l) => sum + l.length, 0) / lines.length;
  const shortLines = lines.filter((l) => l.length < 120).length;
  const veryShort = lines.filter((l) => l.length < 10).length;

  let score = 70;
  score -= (avgLen - 40) * 0.2;
  score += shortLines / lines.length * 20;
  if (veryShort / lines.length > 0.3) score -= 10;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function buildClarityIssues(score: number, content: string): CVIssue[] {
  const issues: CVIssue[] = [];
  if (score < 40) {
    issues.push({
      id: 'clar-1',
      severity: 'major',
      title: 'Poor readability',
      description: 'Text is dense with long paragraphs and little white space.',
      suggestion: 'Use bullet points, short paragraphs, and clear headings.',
    });
  }
  return issues;
}

function measureAchievements(content: string, profile: Partial<CandidateProfile>): number {
  const lower = content.toLowerCase();
  const metrics = ['%', 'x', 'x', '$', 'k', 'increase', 'improved', 'reduced', 'built', 'led', 'managed', 'achieved'];
  let count = 0;
  for (const m of metrics) {
    if (lower.includes(m)) count++;
  }
  const score = Math.min(100, count * 6);
  if (!profile?.experiences?.length) return Math.max(0, score - 25);
  return score;
}

function buildAchievementIssues(score: number, experiences: Experience[]): CVIssue[] {
  const issues: CVIssue[] = [];
  if (score < 40) {
    issues.push({
      id: 'ach-1',
      severity: 'major',
      title: 'Limited quantified achievements',
      description: 'Few measurable results are provided.',
      suggestion: 'Add numbers: percentages, dollar amounts, team sizes, timeframes.',
    });
  }
  if (score >= 40 && score < 70) {
    issues.push({
      id: 'ach-2',
      severity: 'minor',
      title: 'Add impact statements',
      description: 'Achievements are listed but could be more impactful.',
      suggestion: 'Use the STAR format: Situation, Task, Action, Result.',
    });
  }
  return issues;
}

function buildQuickWins(issues: CVIssue[]): string[] {
  const quick: string[] = [];
  for (const issue of issues) {
    if (issue.severity === 'minor' || issue.severity === 'info') {
      quick.push(`${issue.title}: ${issue.suggestion}`);
    }
  }
  return quick.slice(0, 5);
}

function buildGaps(issues: CVIssue[], profile: Partial<CandidateProfile>): string[] {
  const gaps: string[] = [];
  if (!profile?.summary || profile.summary.length < 30) gaps.push('Add a professional summary of 3-5 sentences.');
  if (!profile?.location) gaps.push('Add your current location or preferred area.');
  if (!profile?.targetRoles || profile.targetRoles.length === 0) gaps.push('Specify your target roles.');
  if (!profile?.experiences || profile.experiences.length === 0) gaps.push('Add your work experience.');
  if (!profile?.education || profile.education.length === 0) gaps.push('Add your education background.');
  if (profile?.skills && profile.skills.length < 5) gaps.push('Add more relevant skills to strengthen match potential.');
  return gaps;
}
