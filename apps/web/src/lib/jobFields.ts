/**
 * True for software, data, AI, cyber and other computer-science roles. Words
 * like "intern" or "graduate" say nothing about the field, so they are ignored,
 * and selling or marketing a technical product does not count as a CS role.
 * Shared by the jobs API and the "Tech & CS only" filter on the Jobs page.
 */
export function isTechRole(title: string): boolean {
  const field = title.replace(/\b(intern|internship|trainee|graduate|apprentice|co-?op)\b/gi, ' ');
  if (/\b(sales|account executive|account manager|business development|marketing|recruiter|talent acquisition)\b/i.test(field)) {
    return false;
  }
  return /\b(engineer|engineering|developer|software|data|machine learning|ml|ai|llm|nlp|python|java|backend|back-end|frontend|front-end|full.?stack|devops|devsecops|sre|cloud|security|cyber|cybersecurity|infosec|appsec|soc|grc|pentest|penetration|threat|siem|incident response|vulnerability|iam|forensics?|red team|blue team|scientist|analytics|platform|mobile|ios|android|qa|test automation|architect|infrastructure|research|computer|it support|network)\b/i.test(field);
}
