import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { z } from 'zod';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '25mb' }));

// ==============================================================================
// STRICT SYLLABUS SCHEMA VALIDATION (Zod)
// ==============================================================================

const ChapterSchema = z.object({
  name: z.string().min(1, 'Chapter name is required'),
  difficulty: z.enum(['easy', 'medium', 'hard']).catch('medium'),
  estimatedMinutes: z.number().int().min(15).max(300).catch(45),
  subtopics: z.array(z.string()).default([]),
});

const SubjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required'),
  chapters: z.array(ChapterSchema).min(1, 'Each subject must have at least one chapter'),
});

const SyllabusSchema = z.object({
  subjects: z.array(SubjectSchema).min(1, 'At least one subject is required'),
});

export type ParsedSyllabus = z.infer<typeof SyllabusSchema>;

// ==============================================================================
// PDF TEXT EXTRACTION UTILITY
// ==============================================================================

async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  try {
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    if (result && typeof result.text === 'string' && result.text.trim().length > 0) {
      return result.text.trim();
    }
  } catch (err) {
    console.warn('[PDF Extract] PDFParse getText warning:', err);
  }

  // Fallback: extract ASCII/UTF-8 streams from PDF buffer
  try {
    const raw = buffer.toString('latin1');
    const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
    let match;
    const chunks: string[] = [];
    while ((match = streamRegex.exec(raw)) !== null) {
      const textMatches = match[1].match(/\(([^()]{2,})\)/g);
      if (textMatches) {
        chunks.push(textMatches.map((m) => m.slice(1, -1)).join(' '));
      }
    }
    if (chunks.length > 0) {
      return chunks.join('\n');
    }
  } catch (e) {
    console.warn('[PDF Extract] Raw stream parsing warning:', e);
  }

  return '';
}

// ==============================================================================
// AI PROVIDERS (Groq & Gemini)
// ==============================================================================

// 1. Groq Chat API Helper
async function callGroqChat(messages: Array<{ role: string; content: string }>, jsonMode = true): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not configured in server environment');

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.1,
      response_format: jsonMode ? { type: 'json_object' } : undefined,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API returned HTTP ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// 2. Gemini Client Initializer
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

/**
 * Main AI Syllabus Parser:
 * Strictly parses the actual uploaded content without hallucinating or defaulting to JEE/NEET/CBSE.
 */
async function parseSyllabusWithAI(params: {
  text?: string;
  fileData?: string;
  mimeType?: string;
  examContext?: string;
}): Promise<ParsedSyllabus> {
  const { text, fileData, mimeType, examContext } = params;
  let extractedText = (text || '').trim();

  // If a file is uploaded (PDF or Image)
  if (fileData) {
    const buffer = Buffer.from(fileData, 'base64');
    const cleanMime = (mimeType || 'application/pdf').toLowerCase();

    if (cleanMime.includes('pdf')) {
      const pdfText = await extractTextFromPdfBuffer(buffer);
      if (pdfText && pdfText.length > 20) {
        extractedText = `${extractedText}\n${pdfText}`.trim();
        console.log(`[AI Parser] Extracted ${pdfText.length} characters from text PDF.`);
      }
    }
  }

  const promptInstructions = `You are a strict, faithful academic curriculum extraction assistant.
Your task is to analyze the user's provided syllabus document/text and extract ONLY the actual subjects, chapters, and subtopics present in the document.

CRITICAL RULES:
1. The exam/course target is: "${examContext || 'User Course'}".
2. DO NOT assume this is JEE, NEET, or CBSE unless explicitly written in the user's text.
3. DO NOT invent, substitute, or hallucinate subjects or chapters not present in the user's input.
4. Extract every subject and its respective chapters exactly as given.
5. If the document is a single subject or course outline, group all chapters under that subject name.
6. For each chapter:
   - "name": Exact chapter or unit title from the text.
   - "difficulty": "easy", "medium", or "hard" based on scope and depth.
   - "estimatedMinutes": Recommended initial study duration in minutes (between 30 and 90 minutes).
   - "subtopics": Array of 2 to 4 key topics/subtopics mentioned in that chapter or covering its core concepts.

Respond ONLY with valid JSON strictly matching this schema:
{
  "subjects": [
    {
      "name": "Subject Name",
      "chapters": [
        {
          "name": "Chapter Title",
          "difficulty": "easy" | "medium" | "hard",
          "estimatedMinutes": 45,
          "subtopics": ["Subtopic 1", "Subtopic 2"]
        }
      ]
    }
  ]
}`;

  // Strategy A: If text is available, use Groq (fastest) or Gemini
  if (extractedText.length > 10) {
    if (process.env.GROQ_API_KEY) {
      console.log('[AI Parser] Calling Groq llama-3.3-70b-versatile with extracted text...');
      const rawJson = await callGroqChat([
        {
          role: 'system',
          content: 'You are a syllabus structuring assistant. Always return valid JSON matching the requested schema without any markdown formatting or commentary.',
        },
        {
          role: 'user',
          content: `${promptInstructions}\n\nUSER PROVIDED SYLLABUS CONTENT:\n"""\n${extractedText}\n"""`,
        },
      ], true);

      const parsed = JSON.parse(rawJson);
      const validated = SyllabusSchema.parse(parsed);
      return validated;
    }

    const gemini = getGeminiClient();
    if (gemini) {
      console.log('[AI Parser] Calling Gemini gemini-2.5-flash with extracted text...');
      const response = await gemini.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `${promptInstructions}\n\nUSER PROVIDED SYLLABUS CONTENT:\n"""\n${extractedText}\n"""`,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      const validated = SyllabusSchema.parse(parsed);
      return validated;
    }
  }

  // Strategy B: If fileData is an image or scanned PDF and Gemini is available (multimodal vision)
  if (fileData && process.env.GEMINI_API_KEY) {
    const gemini = getGeminiClient();
    if (gemini) {
      const cleanMime = mimeType || (fileData.startsWith('JVBER') ? 'application/pdf' : 'image/png');
      console.log(`[AI Parser] Calling Gemini multimodal with ${cleanMime}...`);

      const response = await gemini.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: cleanMime,
                data: fileData,
              },
            },
            {
              text: `${promptInstructions}\n\nExtract subjects and chapters from the attached syllabus document/image.`,
            },
          ],
        },
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      const validated = SyllabusSchema.parse(parsed);
      return validated;
    }
  }

  // If we reach here without API keys or without readable content, throw a descriptive error
  if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
    throw new Error('No AI provider API key configured (set GROQ_API_KEY or GEMINI_API_KEY in server environment).');
  }

  throw new Error('Unable to extract readable syllabus text from the provided input.');
}

// ==============================================================================
// API ROUTES
// ==============================================================================

// Health & Diagnostics Check
app.get('/api/health', (req: Request, res: Response) => {
  const hasGroq = Boolean(process.env.GROQ_API_KEY);
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);

  res.json({
    status: 'ok',
    aiConfigured: hasGroq || hasGemini,
    primaryProvider: hasGroq ? 'groq (llama-3.3-70b-versatile)' : hasGemini ? 'gemini (gemini-2.5-flash)' : 'none',
    timestamp: new Date().toISOString(),
  });
});

// AI Direct Diagnostic Test Endpoint
app.get('/api/ai-test', async (req: Request, res: Response) => {
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: {
      hasGroqKey: Boolean(process.env.GROQ_API_KEY),
      groqKeyPrefix: process.env.GROQ_API_KEY ? `${process.env.GROQ_API_KEY.slice(0, 6)}...` : 'NONE',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      geminiKeyPrefix: process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.slice(0, 6)}...` : 'NONE',
    },
    tests: {},
  };

  if (process.env.GROQ_API_KEY) {
    const start = Date.now();
    try {
      const resp = await callGroqChat([
        { role: 'user', content: 'Reply with exactly: AI_TEST_OK' },
      ], false);
      diagnostics.tests.groq = {
        status: 'SUCCESS',
        latencyMs: Date.now() - start,
        response: resp.trim(),
      };
    } catch (e: any) {
      diagnostics.tests.groq = { status: 'ERROR', error: e.message };
    }
  } else {
    diagnostics.tests.groq = { status: 'SKIPPED_NO_KEY' };
  }

  if (process.env.GEMINI_API_KEY) {
    const start = Date.now();
    try {
      const gemini = getGeminiClient();
      if (gemini) {
        const resp = await gemini.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: 'Reply with exactly: AI_TEST_OK',
        });
        diagnostics.tests.gemini = {
          status: 'SUCCESS',
          latencyMs: Date.now() - start,
          response: resp.text?.trim(),
        };
      }
    } catch (e: any) {
      diagnostics.tests.gemini = { status: 'ERROR', error: e.message };
    }
  } else {
    diagnostics.tests.gemini = { status: 'SKIPPED_NO_KEY' };
  }

  res.json(diagnostics);
});

// Parse Syllabus Endpoint
app.post('/api/parse-syllabus', async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const { text, fileData, mimeType, examContext } = req.body;

    if (!text && !fileData) {
      res.status(400).json({
        error: 'Please provide syllabus text or upload a syllabus file (PDF or Image).',
      });
      return;
    }

    console.log(`[POST /api/parse-syllabus] Request received (hasText: ${Boolean(text)}, hasFile: ${Boolean(fileData)}, examContext: "${examContext || 'None'}")`);

    const result = await parseSyllabusWithAI({ text, fileData, mimeType, examContext });

    console.log(`[POST /api/parse-syllabus] Successfully parsed ${result.subjects.length} subjects in ${Date.now() - startTime}ms.`);
    res.json(result);
  } catch (error: any) {
    console.error('[POST /api/parse-syllabus] Processing failed:', error);

    // Return a genuine error response without fake data
    res.status(422).json({
      error: "We couldn't process your syllabus. Please try again or enter it manually.",
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined,
    });
  }
});

// Smart Insights Generator Endpoint
app.post('/api/smart-insights', async (req: Request, res: Response) => {
  try {
    const { studentName, daysLeft, onTrackStatus, completedChapters, totalChapters, recentFeedback } = req.body;

    const prompt = `You are a calm, reassuring academic mentor for ${studentName || 'Student'} preparing for academic goals.
Days left: ${daysLeft}. Status: ${onTrackStatus}. Completed: ${completedChapters}/${totalChapters} chapters.
Student recent feedback: ${recentFeedback || 'going well'}.

Generate ONE concise, warm, practical insight (1 to 2 sentences max).`;

    if (process.env.GROQ_API_KEY) {
      const insight = await callGroqChat([
        { role: 'system', content: 'You are a warm, concise academic companion.' },
        { role: 'user', content: prompt },
      ], false);
      res.json({ insight: insight.trim() });
      return;
    }

    const gemini = getGeminiClient();
    if (gemini) {
      const response = await gemini.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      res.json({ insight: response.text?.trim() || "You're building solid daily momentum. Keep taking it one study session at a time." });
      return;
    }

    res.json({
      insight: `You have completed ${completedChapters} of ${totalChapters} chapters. Steady daily consistency is the foundation of calm mastery.`,
    });
  } catch (error) {
    res.json({
      insight: "Taking 5-minute pauses between focused sessions helps preserve concept retention for longer.",
    });
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
