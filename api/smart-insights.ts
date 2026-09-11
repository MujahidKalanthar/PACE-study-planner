import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'pace-study-planner',
      },
    },
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { /* ignore */ }
    }

    const { studentName, daysLeft, onTrackStatus, completedChapters, totalChapters, recentFeedback } = body || {};

    const prompt = `You are a calm, reassuring academic mentor for ${studentName || 'Student'} preparing for academic goals.
Days left: ${daysLeft}. Status: ${onTrackStatus}. Completed: ${completedChapters}/${totalChapters} chapters.
Student recent feedback: ${recentFeedback || 'going well'}.

Generate ONE concise, warm, practical insight (1 to 2 sentences max).`;

    if (process.env.GROQ_API_KEY) {
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: 'You are a warm, concise academic companion.' },
              { role: 'user', content: prompt },
            ],
            temperature: 0.3,
          }),
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          const insight = groqData.choices?.[0]?.message?.content?.trim();
          if (insight) {
            return res.status(200).json({ insight });
          }
        }
      } catch (e) {
        console.warn('Groq smart insight error:', e);
      }
    }

    const gemini = getGeminiClient();
    if (gemini) {
      const response = await gemini.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
      });
      return res.status(200).json({
        insight: response.text?.trim() || "You're building solid daily momentum. Keep taking it one study session at a time.",
      });
    }

    return res.status(200).json({
      insight: `You have completed ${completedChapters || 0} of ${totalChapters || 0} chapters. Steady daily consistency is the foundation of calm mastery.`,
    });
  } catch (err) {
    return res.status(200).json({
      insight: 'Taking 5-minute pauses between focused sessions helps preserve concept retention for longer.',
    });
  }
}
