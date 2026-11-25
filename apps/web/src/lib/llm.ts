/**
 * One entry point for text generation. Tries Groq first (fast, open model);
 * if Groq is missing, rate-limited or failing, falls back to Google Gemini.
 * Both keys stay server-side.
 */

export interface LlmRequest {
  system: string;
  user: string;
  maxTokens: number;
  temperature?: number;
  json?: boolean;
  timeoutMs?: number;
}

export interface LlmResult {
  text: string;
  provider: 'groq' | 'gemini';
  model: string;
}

const GROQ_MODEL = 'openai/gpt-oss-120b';
// gemini-2.5-flash is closed to new API keys; Google points new keys to 3.8 Flash.
const GEMINI_MODEL = 'gemini-3.8-flash';

async function viaGroq(req: LlmRequest, key: string): Promise<LlmResult> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(req.timeoutMs ?? 45000),
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: req.temperature ?? 0.3,
      max_tokens: req.maxTokens,
      ...(req.json ? { response_format: { type: 'json_object' } } : {}),
      messages: [
        { role: 'system', content: req.system },
        { role: 'user', content: req.user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const data = await res.json();
  const text = String(data.choices?.[0]?.message?.content || '')
    .replace(/<think>[\s\S]*?<\/think>/g, '')
    .trim();
  if (!text) throw new Error('Groq returned no text');
  return { text, provider: 'groq', model: GROQ_MODEL };
}

async function viaGemini(req: LlmRequest, key: string): Promise<LlmResult> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
    method: 'POST',
    headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(req.timeoutMs ?? 50000),
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: req.system }] },
      contents: [{ role: 'user', parts: [{ text: req.user }] }],
      generationConfig: {
        temperature: req.temperature ?? 0.3,
        maxOutputTokens: req.maxTokens,
        ...(req.json ? { responseMimeType: 'application/json' } : {}),
      },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  const text = String(data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('') || '').trim();
  if (!text) throw new Error('Gemini returned no text');
  return { text, provider: 'gemini', model: GEMINI_MODEL };
}

export function llmConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY);
}

export async function generate(req: LlmRequest): Promise<LlmResult> {
  const groq = process.env.GROQ_API_KEY;
  const gemini = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  let lastError: unknown = new Error('No AI provider is configured');
  if (groq) {
    try {
      return await viaGroq(req, groq);
    } catch (e) {
      lastError = e;
    }
  }
  if (gemini) {
    try {
      return await viaGemini(req, gemini);
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}
