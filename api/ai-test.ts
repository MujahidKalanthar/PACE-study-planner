import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: {
      hasGroqKey: Boolean(process.env.GROQ_API_KEY),
      groqKeyPrefix: process.env.GROQ_API_KEY ? `${process.env.GROQ_API_KEY.slice(0, 6)}...` : 'NONE',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      geminiKeyPrefix: process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.slice(0, 6)}...` : 'NONE',
      nodeVersion: process.version,
    },
    tests: {},
  };

  // Test 1: Groq Minimal Call
  if (process.env.GROQ_API_KEY) {
    const groqStartTime = Date.now();
    try {
      console.log('[AI-TEST] Calling Groq API directly with minimal prompt...');
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'user', content: 'Reply with exactly: AI_TEST_OK' },
          ],
          max_tokens: 10,
          temperature: 0.1,
        }),
      });

      const latencyMs = Date.now() - groqStartTime;
      const status = groqRes.status;
      const text = await groqRes.text();

      diagnostics.tests.groq = {
        status: status === 200 ? 'SUCCESS' : 'HTTP_ERROR',
        httpStatus: status,
        latencyMs,
        response: text,
      };
    } catch (err: any) {
      diagnostics.tests.groq = {
        status: 'FETCH_FAILED',
        error: err.message,
      };
    }
  } else {
    diagnostics.tests.groq = {
      status: 'SKIPPED_NO_KEY',
      message: 'GROQ_API_KEY is not set in environment variables.',
    };
  }

  // Test 2: Gemini Minimal Call
  if (process.env.GEMINI_API_KEY) {
    const geminiStartTime = Date.now();
    try {
      console.log('[AI-TEST] Calling Gemini API directly with minimal prompt...');
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'pace-study-planner' } },
      });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'Reply with exactly: AI_TEST_OK',
      });

      const latencyMs = Date.now() - geminiStartTime;
      diagnostics.tests.gemini = {
        status: 'SUCCESS',
        latencyMs,
        response: response.text?.trim(),
      };
    } catch (err: any) {
      diagnostics.tests.gemini = {
        status: 'API_ERROR',
        error: err.message,
      };
    }
  } else {
    diagnostics.tests.gemini = {
      status: 'SKIPPED_NO_KEY',
      message: 'GEMINI_API_KEY is not set in environment variables.',
    };
  }

  return res.status(200).json(diagnostics);
}
