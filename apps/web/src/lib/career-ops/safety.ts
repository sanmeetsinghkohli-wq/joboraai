/** Deterministic checks on a job posting: text aimed at AI screeners, and common scam signs. */
export interface PostingFlag {
  kind: 'ai-directed' | 'scam';
  message: string;
  quote: string;
}

const AI_DIRECTED = [
  /ignore (all |any )?(previous|prior|above) instructions/i,
  /(rank|rate|score) (this|the) candidate/i,
  /\b(if you are|as) an? (ai|llm|language model|chatbot|assistant)\b/i,
  /\b(chatgpt|claude|gemini|gpt-?\d)\b/i,
  /include the word ["'“]?\w+["'”]? in your/i,
];

const SCAM = [
  { re: /\b(pay|payment|fee|deposit)\b.{0,40}\b(training|equipment|registration|visa|processing)\b/i, why: 'Asks you to pay for training, equipment, registration or visa processing.' },
  { re: /\b(telegram|whatsapp|signal)\b.{0,40}\b(interview|contact|message)\b/i, why: 'Interview or contact only through a chat app.' },
  { re: /@(gmail|yahoo|outlook|hotmail)\.com/i, why: 'Uses a personal email domain instead of a company one.' },
  { re: /\b(wire|western union|gift card|crypto|bitcoin)\b/i, why: 'Mentions wire transfers, gift cards or crypto.' },
  { re: /\b(no experience|no interview)\b.{0,30}\b(\$|usd|aed)\s?\d{3,}/i, why: 'Promises high pay with no experience or interview.' },
];

export function scanPosting(text: string): PostingFlag[] {
  const flags: PostingFlag[] = [];
  const quoteAround = (idx: number, len: number) =>
    text.slice(Math.max(0, idx - 30), Math.min(text.length, idx + len + 30)).replace(/\s+/g, ' ').trim();
  for (const re of AI_DIRECTED) {
    const m = re.exec(text);
    if (m) flags.push({ kind: 'ai-directed', message: 'Contains text aimed at AI screening tools. Jobora ignores it.', quote: quoteAround(m.index, m[0].length) });
  }
  for (const { re, why } of SCAM) {
    const m = re.exec(text);
    if (m) flags.push({ kind: 'scam', message: why, quote: quoteAround(m.index, m[0].length) });
  }
  return flags;
}
