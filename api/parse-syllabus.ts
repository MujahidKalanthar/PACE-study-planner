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

export type ParsedSyllabus = z.infer<typeof SyllabusSchema>;

async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  try {
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    if (result && typeof result.text === 'string' && result.text.trim().length > 0) {
      console.log(`[AI-DEBUG] PDFParse extracted ${result.text.trim().length} characters from PDF.`);
      return result.text.trim();
    }
  } catch (err) {
    console.warn('[AI-DEBUG] PDFParse extraction warning:', err);
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
      const streamText = chunks.join('\n');
      console.log(`[AI-DEBUG] Stream parser extracted ${streamText.length} characters.`);
      return streamText;
    }
  } catch (e) {
    console.warn('[AI-DEBUG] Raw stream parsing warning:', e);
  }

  return '';
}

async function callGroqChat(messages: Array<{ role: string; content: string }>): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not configured in server environment');

  console.log('[AI-DEBUG] Sending request to Groq API (model: llama-3.3-70b-versatile)...');
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
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`[AI-DEBUG] Groq API returned HTTP ${res.status}:`, errText);
    throw new Error(`Groq API error (HTTP ${res.status}): ${errText}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '';
  console.log(`[AI-DEBUG] Groq response received (${content.length} bytes).`);
  return content;
}

async function callGemini(promptInstructions: string, userContent: string, fileData?: string, mimeType?: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured in server environment');

  console.log('[AI-DEBUG] Sending request to Google Gemini API (model: gemini-2.5-flash)...');
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'pace-study-planner',
      },
    },
  });

  if (fileData) {
    const cleanMime = mimeType || (fileData.startsWith('JVBER') ? 'application/pdf' : 'image/png');
    const response = await ai.models.generateContent({
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
    return response.text || '{}';
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `${promptInstructions}\n\nUSER PROVIDED SYLLABUS CONTENT:\n"""\n${userContent}\n"""`,
    config: {
      responseMimeType: 'application/json',
    },
  });
  return response.text || '{}';
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

  const startTime = Date.now();
  console.log('[AI-DEBUG] /api/parse-syllabus endpoint reached');

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        console.warn('[AI-DEBUG] Failed to parse raw string body as JSON');
      }
    } else if (Buffer.isBuffer(body)) {
      try {
        body = JSON.parse(body.toString('utf-8'));
      } catch (e) {
        console.warn('[AI-DEBUG] Failed to parse buffer body as JSON');
      }
    }

    const { text, fileData, mimeType, examContext } = body || {};

    console.log(`[AI-DEBUG] Input received: hasText=${Boolean(text)}, hasFile=${Boolean(fileData)}, examContext="${examContext || 'None'}"`);

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

    console.log(`[AI-DEBUG] Extracted text length: ${extractedText.length} characters`);

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

    let parsedResult: any = null;

    // Strategy 1: Groq (llama-3.3-70b-versatile)
    if (process.env.GROQ_API_KEY && extractedText.length > 10) {
      try {
        console.log('[AI-DEBUG] Attempting extraction via Groq...');
        const rawJson = await callGroqChat([
          {
            role: 'system',
            content: 'You are a syllabus structuring assistant. Always return valid JSON matching the requested schema without any markdown formatting or commentary.',
          },
          {
            role: 'user',
            content: `${promptInstructions}\n\nUSER PROVIDED SYLLABUS CONTENT:\n"""\n${extractedText}\n"""`,
          },
        ]);

        const jsonCandidate = JSON.parse(rawJson);
        parsedResult = SyllabusSchema.parse(jsonCandidate);
        console.log(`[AI-DEBUG] Groq extraction succeeded: ${parsedResult.subjects.length} subjects found.`);
      } catch (groqErr: any) {
        console.error('[AI-DEBUG] Groq extraction error:', groqErr.message);
        if (!process.env.GEMINI_API_KEY) {
          throw groqErr;
        }
      }
    }

    // Strategy 2: Google Gemini Fallback or Image parsing
    if (!parsedResult && process.env.GEMINI_API_KEY) {
      console.log('[AI-DEBUG] Attempting extraction via Google Gemini...');
      const rawJson = await callGemini(promptInstructions, extractedText, fileData, mimeType);
      const jsonCandidate = JSON.parse(rawJson);
      parsedResult = SyllabusSchema.parse(jsonCandidate);
      console.log(`[AI-DEBUG] Gemini extraction succeeded: ${parsedResult.subjects.length} subjects found.`);
    }

    if (!parsedResult) {
      if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
        throw new Error('No AI API keys configured. Please add GROQ_API_KEY or GEMINI_API_KEY in Vercel environment variables.');
      }
      throw new Error('Unable to extract syllabus from the provided input.');
    }

    console.log(`[AI-DEBUG] Validation passed. Returning ${parsedResult.subjects.length} subjects in ${Date.now() - startTime}ms.`);
    return res.status(200).json(parsedResult);
  } catch (error: any) {
    console.error('[AI-DEBUG] /api/parse-syllabus failed:', error);
    return res.status(422).json({
      error: error.message || "We couldn't process your syllabus. Please try again or enter it manually.",
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined,
    });
  }
}
