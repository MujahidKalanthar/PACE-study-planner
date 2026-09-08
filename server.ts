import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '20mb' }));

// ==============================================================================
// PLUGGABLE AI PROVIDER ABSTRACTION (Groq / Gemini / Rule-Based Fallback)
// ==============================================================================

interface AIProvider {
  name: 'groq' | 'gemini' | 'fallback';
  parseSyllabus: (params: { text?: string; fileData?: string; mimeType?: string; examContext?: string }) => Promise<any>;
  generateInsight: (params: { studentName?: string; daysLeft: number; onTrackStatus: string; completedChapters: number; totalChapters: number; recentFeedback?: string }) => Promise<string>;
}

// 1. Groq Client Implementation (Fast, Free-Tier, OpenAI-compatible format)
async function callGroqChat(messages: Array<{ role: string; content: string }>, jsonMode = false): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not configured');

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.2,
      response_format: jsonMode ? { type: 'json_object' } : undefined,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API returned ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// 2. Gemini Client Implementation
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

// Helper: Active AI Provider selector
function getActiveAIProvider(): AIProvider {
  // Prefer Groq if key is present, then Gemini, then fallback
  if (process.env.GROQ_API_KEY) {
    return {
      name: 'groq',
      parseSyllabus: async ({ text, examContext }) => {
        const prompt = `You are an expert curriculum assistant for Indian entrance & board exams (CBSE Class 11/12, JEE Main/Advanced, NEET).
The student provided syllabus text${examContext ? ` for exam: ${examContext}` : ''}.
Extract subjects and chapters into clean JSON with this exact schema:
{
  "subjects": [
    {
      "name": "Physics",
      "chapters": [
        {
          "name": "Kinematics",
          "difficulty": "medium",
          "estimatedMinutes": 45,
          "subtopics": ["Motion in 1D", "Projectiles", "Relative Motion"]
        }
      ]
    }
  ]
}
Syllabus Content:
${text || 'Extract chapters and subtopics.'}`;

        const rawJson = await callGroqChat([
          { role: 'system', content: 'You are a syllabus structuring assistant. Always return valid JSON matching the requested schema.' },
          { role: 'user', content: prompt }
        ], true);

        return JSON.parse(rawJson);
      },
      generateInsight: async ({ studentName, daysLeft, onTrackStatus, completedChapters, totalChapters, recentFeedback }) => {
        const prompt = `You are a calm, grounded senior academic mentor for a 16-18 year old Indian student named ${studentName || 'Student'}.
Exam days left: ${daysLeft}. Pace: ${onTrackStatus}. Completed: ${completedChapters}/${totalChapters} chapters.
Student recent feedback: ${recentFeedback || 'going well'}.

Generate ONE concise, reassuring, practical study tip (1 to 2 sentences max).
Avoid generic fluff ("Believe in yourself"). Give practical insight.`;

        return await callGroqChat([
          { role: 'system', content: 'You are a warm, concise academic companion.' },
          { role: 'user', content: prompt }
        ]);
      }
    };
  }

  const gemini = getGeminiClient();
  if (gemini) {
    return {
      name: 'gemini',
      parseSyllabus: async ({ text, fileData, mimeType, examContext }) => {
        const promptText = `
You are an expert curriculum structuring assistant for Indian high school & entrance exams (CBSE Class 11/12, JEE Main/Advanced, NEET).
The student has provided syllabus content${examContext ? ` for: ${examContext}` : ''}.
Analyze and extract all subjects and chapters cleanly.
For each chapter:
- "name": Clean chapter title (e.g., "Kinematics", "Chemical Bonding", "Quadratic Equations").
- "difficulty": "easy", "medium", or "hard" based on typical Indian exam weightage.
- "estimatedMinutes": Recommended initial study duration in minutes (between 30 and 60 minutes).
- "subtopics": 2 to 4 key subtopics or topics in that chapter.
`;
        const contents: any[] = [];
        if (fileData && mimeType) {
          contents.push({
            inlineData: {
              mimeType,
              data: fileData,
            },
          });
        }
        contents.push({
          text: `${promptText}\n\nUser Syllabus Content:\n${text || 'Extract subjects and chapters from the attached image/document.'}`,
        });

        const response = await gemini.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: { parts: contents },
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                subjects: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      chapters: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            name: { type: Type.STRING },
                            difficulty: { type: Type.STRING, enum: ['easy', 'medium', 'hard'] },
                            estimatedMinutes: { type: Type.INTEGER },
                            subtopics: {
                              type: Type.ARRAY,
                              items: { type: Type.STRING },
                            },
                          },
                          required: ['name', 'difficulty', 'estimatedMinutes'],
                        },
                      },
                    },
                    required: ['name', 'chapters'],
                  },
                },
              },
              required: ['subjects'],
            },
          },
        });

        return JSON.parse(response.text || '{}');
      },
      generateInsight: async ({ studentName, daysLeft, onTrackStatus, completedChapters, totalChapters, recentFeedback }) => {
        const response = await gemini.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `You are a calm, reassuring academic mentor for ${studentName || 'Student'} preparing for entrance exams.
Days left: ${daysLeft}. Status: ${onTrackStatus}. Completed: ${completedChapters}/${totalChapters} chapters.
Student recent feedback: ${recentFeedback || 'going well'}.

Generate ONE concise, warm, practical insight (1 to 2 sentences max).`,
        });

        return response.text?.trim() || "You're building solid daily momentum. Keep taking it one study session at a time.";
      }
    };
  }

  // Fallback Provider
  return {
    name: 'fallback',
    parseSyllabus: async ({ text }) => {
      return parseSyllabusFallback(text || '');
    },
    generateInsight: async ({ completedChapters, totalChapters }) => {
      return `You've completed ${completedChapters} of ${totalChapters} chapters. Consistency in small daily sessions is key to mastering competitive exams.`;
    }
  };
}

// Rule-based fallback parser
function parseSyllabusFallback(rawText: string) {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 2);

  const chapters: any[] = [];
  let currentSubject = 'General Syllabus';

  for (const line of lines) {
    const clean = line.replace(/^[\d\.\-\*\•\)\s]+/, '').trim();
    if (!clean) continue;

    if (/(physics|chemistry|math|biology)/i.test(clean) && clean.length < 25) {
      currentSubject = clean;
    } else {
      chapters.push({
        name: clean,
        difficulty: clean.length % 2 === 0 ? 'medium' : 'hard',
        estimatedMinutes: 40,
        subtopics: ['Core Concepts', 'Practice Problems'],
      });
    }
  }

  return {
    subjects: [
      {
        name: currentSubject,
        chapters: chapters.length > 0 ? chapters : [
          { name: 'Foundations & Core Principles', difficulty: 'medium', estimatedMinutes: 45, subtopics: ['Theory', 'Key Formulae'] }
        ],
      },
    ],
  };
}

// ==============================================================================
// API ROUTES
// ==============================================================================

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  const provider = getActiveAIProvider();
  res.json({
    status: 'ok',
    aiProvider: provider.name,
    timestamp: new Date().toISOString()
  });
});

// Parse Syllabus Endpoint
app.post('/api/parse-syllabus', async (req: Request, res: Response) => {
  try {
    const { text, fileData, mimeType, examContext } = req.body;

    if (!text && !fileData) {
      res.status(400).json({ error: 'Please provide syllabus text or an uploaded file/image.' });
      return;
    }

    const provider = getActiveAIProvider();
    const result = await provider.parseSyllabus({ text, fileData, mimeType, examContext });
    res.json(result);
  } catch (error: any) {
    console.error('Error parsing syllabus:', error);
    const fallback = parseSyllabusFallback(req.body.text || '');
    res.json(fallback);
  }
});

// Smart Insights Generator Endpoint
app.post('/api/smart-insights', async (req: Request, res: Response) => {
  try {
    const { studentName, daysLeft, onTrackStatus, completedChapters, totalChapters, recentFeedback } = req.body;
    const provider = getActiveAIProvider();
    const insight = await provider.generateInsight({
      studentName,
      daysLeft: Number(daysLeft) || 30,
      onTrackStatus: onTrackStatus || 'on_track',
      completedChapters: Number(completedChapters) || 0,
      totalChapters: Number(totalChapters) || 10,
      recentFeedback,
    });
    res.json({ insight });
  } catch (error) {
    res.json({ insight: "Taking 5-minute pauses between focused sessions helps preserve concept retention for longer." });
  }
});

// In-App Feedback & Issue Reporting Endpoint
app.post('/api/feedback', async (req: Request, res: Response) => {
  try {
    const { type, category, name, email, message, stepsToReproduce } = req.body;

    if (!message || !message.trim()) {
      res.status(400).json({ error: 'Message is required.' });
      return;
    }

    console.log(`[PACE Feedback Received] Type: ${type}, Category: ${category}, From: ${name || 'Anonymous'} (${email || 'No email'}), Message: ${message}`);

    res.json({
      success: true,
      message: 'Thank you for your submission. Your feedback has been received.',
      receivedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Feedback submission error:', error);
    res.status(500).json({ error: 'Failed to process feedback.' });
  }
});

// ==============================================================================
// VITE DEV SERVER & PRODUCTION STATIC SERVING
// ==============================================================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`PACE Study Planner server running on port ${PORT}`);
  });
}

startServer();
