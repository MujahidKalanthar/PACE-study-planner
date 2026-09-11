import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';

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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { text, fileData, mimeType, examContext } = req.body || {};

    if (!text && !fileData) {
      return res.status(400).json({
        error: 'Please provide syllabus text or upload a syllabus file (PDF or Image).',
      });
    }

    let extractedText = (text || '').trim();

    if (fileData) {
      const buffer = Buffer.from(fileData, 'base64');
      const cleanMime = (mimeType || 'application/pdf').toLowerCase();

      if (cleanMime.includes('pdf')) {
        const pdfText = await extractTextFromPdfBuffer(buffer);
        if (pdfText && pdfText.length > 20) {
          extractedText = `${extractedText}\n${pdfText}`.trim();
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

    if (extractedText.length > 10) {
      if (process.env.GROQ_API_KEY) {
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
        return res.status(200).json(validated);
      }

      const gemini = getGeminiClient();
      if (gemini) {
        const response = await gemini.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `${promptInstructions}\n\nUSER PROVIDED SYLLABUS CONTENT:\n"""\n${extractedText}\n"""`,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const parsed = JSON.parse(response.text || '{}');
        const validated = SyllabusSchema.parse(parsed);
        return res.status(200).json(validated);
      }
    }

    if (fileData && process.env.GEMINI_API_KEY) {
      const gemini = getGeminiClient();
      if (gemini) {
        const cleanMime = mimeType || (fileData.startsWith('JVBER') ? 'application/pdf' : 'image/png');
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
        return res.status(200).json(validated);
      }
    }

    return res.status(422).json({
      error: "We couldn't process your syllabus. Please try again or enter it manually.",
    });
  } catch (error: any) {
    console.error('[Vercel Serverless /api/parse-syllabus] Error:', error);
    return res.status(422).json({
      error: "We couldn't process your syllabus. Please try again or enter it manually.",
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined,
    });
  }
}
