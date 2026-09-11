import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const hasGroq = Boolean(process.env.GROQ_API_KEY);
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);

  return res.status(200).json({
    status: 'ok',
    aiConfigured: hasGroq || hasGemini,
    primaryProvider: hasGroq ? 'groq (llama-3.3-70b-versatile)' : hasGemini ? 'gemini (gemini-3.6-flash)' : 'none',
    timestamp: new Date().toISOString(),
  });
}
