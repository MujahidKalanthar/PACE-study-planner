import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const hasGroq = Boolean(process.env.GROQ_API_KEY);
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);

  return res.status(200).json({
    status: 'ok',
    aiConfigured: hasGroq || hasGemini,
    primaryProvider: hasGroq ? 'groq (llama-3.3-70b-versatile)' : hasGemini ? 'gemini (gemini-2.5-flash)' : 'none',
    timestamp: new Date().toISOString(),
  });
}
